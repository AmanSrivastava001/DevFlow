package com.devflow.web;

import com.devflow.model.*;
import com.devflow.repo.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;

@RestController @RequestMapping("/api")
public class WorkspaceController {
    private final UserRepository users;
    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final ActivityRepository activity;
    public WorkspaceController(UserRepository users, ProjectRepository projects, TaskRepository tasks, ActivityRepository activity) {
        this.users = users; this.projects = projects; this.tasks = tasks; this.activity = activity;
    }

    public record ProjectInput(@NotBlank @Size(max=110) String name, @Size(max=1500) String description,
                               @Pattern(regexp="^#[0-9a-fA-F]{6}$", message="Use a 6-digit hex color") String color) {}
    public record TaskInput(@NotNull Long projectId, @NotBlank @Size(max=160) String title,
                            @Size(max=3500) String description, @NotNull WorkTask.Status status,
                            @NotNull WorkTask.Priority priority, LocalDate dueDate) {}
    public record StatusInput(@NotNull WorkTask.Status status) {}
    public record ProjectView(Long id, String name, String description, String color, Instant createdAt) {}
    public record TaskView(Long id, Long projectId, String projectName, String title, String description,
                           WorkTask.Status status, WorkTask.Priority priority, LocalDate dueDate,
                           Instant createdAt, Instant updatedAt) {}
    public record ActivityView(Long id, String action, String detail, Instant createdAt) {}
    public record DashboardView(long totalProjects, long totalTasks, long doneTasks, long inProgressTasks,
                                long overdueTasks, List<TaskView> upcomingTasks, List<ActivityView> activity) {}

    @GetMapping("/health") public Map<String,String> health() { return Map.of("status", "ok"); }

    @GetMapping("/projects") @Transactional(readOnly=true)
    public List<ProjectView> listProjects(@AuthenticationPrincipal Jwt jwt) {
        return projects.findByOwnerIdOrderByCreatedAtDesc(id(jwt)).stream().map(this::pv).toList();
    }

    @PostMapping("/projects") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public ProjectView createProject(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ProjectInput input) {
        AppUser u = user(jwt);
        Project project = projects.save(new Project(u, input.name().trim(), clean(input.description()), color(input.color())));
        log(u, "PROJECT_CREATED", "Created project " + project.name);
        return pv(project);
    }

    @PutMapping("/projects/{projectId}") @Transactional
    public ProjectView updateProject(@AuthenticationPrincipal Jwt jwt, @PathVariable Long projectId,
                                     @Valid @RequestBody ProjectInput input) {
        Project p = ownedProject(projectId, id(jwt));
        p.name = input.name().trim(); p.description = clean(input.description()); p.color = color(input.color());
        log(p.getOwner(), "PROJECT_UPDATED", "Updated project " + p.name);
        return pv(projects.save(p));
    }

    @DeleteMapping("/projects/{projectId}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void deleteProject(@AuthenticationPrincipal Jwt jwt, @PathVariable Long projectId) {
        Project p = ownedProject(projectId, id(jwt));
        tasks.deleteByProjectIdAndProjectOwnerId(projectId, id(jwt));
        projects.delete(p);
        log(p.getOwner(), "PROJECT_DELETED", "Deleted project " + p.name);
    }

    @GetMapping("/tasks") @Transactional(readOnly=true)
    public List<TaskView> listTasks(@AuthenticationPrincipal Jwt jwt, @RequestParam(required=false) Long projectId) {
        Long uid = id(jwt);
        if (projectId != null) ownedProject(projectId, uid);
        List<WorkTask> result = projectId == null ? tasks.findByProjectOwnerIdOrderByCreatedAtDesc(uid) :
                tasks.findByProjectIdAndProjectOwnerIdOrderByCreatedAtDesc(projectId, uid);
        return result.stream().map(this::tv).toList();
    }

    @PostMapping("/tasks") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public TaskView createTask(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody TaskInput input) {
        Project p = ownedProject(input.projectId(), id(jwt));
        WorkTask task = tasks.save(new WorkTask(p, input.title().trim(), clean(input.description()),
                input.status(), input.priority(), input.dueDate()));
        log(p.getOwner(), "TASK_CREATED", "Created task " + task.title);
        return tv(task);
    }

    @PutMapping("/tasks/{taskId}") @Transactional
    public TaskView updateTask(@AuthenticationPrincipal Jwt jwt, @PathVariable Long taskId,
                               @Valid @RequestBody TaskInput input) {
        Long uid = id(jwt);
        WorkTask t = ownedTask(taskId, uid);
        Project p = ownedProject(input.projectId(), uid);
        t.project = p; t.title = input.title().trim(); t.description = clean(input.description());
        t.status = input.status(); t.priority = input.priority(); t.dueDate = input.dueDate();
        log(p.getOwner(), "TASK_UPDATED", "Updated task " + t.title);
        return tv(tasks.save(t));
    }

    @PatchMapping("/tasks/{taskId}/status") @Transactional
    public TaskView changeStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable Long taskId,
                                 @Valid @RequestBody StatusInput input) {
        WorkTask t = ownedTask(taskId, id(jwt));
        t.status = input.status();
        log(t.getProject().getOwner(), "TASK_MOVED", "Moved " + t.title + " to " + input.status().name().replace('_', ' '));
        return tv(tasks.save(t));
    }

    @DeleteMapping("/tasks/{taskId}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void deleteTask(@AuthenticationPrincipal Jwt jwt, @PathVariable Long taskId) {
        WorkTask t = ownedTask(taskId, id(jwt));
        log(t.getProject().getOwner(), "TASK_DELETED", "Deleted task " + t.title);
        tasks.delete(t);
    }

    @GetMapping("/dashboard") @Transactional(readOnly=true)
    public DashboardView dashboard(@AuthenticationPrincipal Jwt jwt) {
        Long uid = id(jwt);
        List<WorkTask> mine = tasks.findByProjectOwnerIdOrderByCreatedAtDesc(uid);
        LocalDate today = LocalDate.now();
        List<TaskView> upcoming = mine.stream()
                .filter(t -> t.status != WorkTask.Status.DONE && t.dueDate != null)
                .sorted(Comparator.comparing(t -> t.dueDate)).limit(6).map(this::tv).toList();
        return new DashboardView(projects.findByOwnerIdOrderByCreatedAtDesc(uid).size(), mine.size(),
                mine.stream().filter(t -> t.status == WorkTask.Status.DONE).count(),
                mine.stream().filter(t -> t.status == WorkTask.Status.IN_PROGRESS).count(),
                mine.stream().filter(t -> t.status != WorkTask.Status.DONE && t.dueDate != null && t.dueDate.isBefore(today)).count(),
                upcoming, activity.findTop12ByOwnerIdOrderByCreatedAtDesc(uid).stream()
                .map(a -> new ActivityView(a.id, a.action, a.detail, a.createdAt)).toList());
    }

    private static Long id(Jwt jwt) { return Long.parseLong(jwt.getSubject()); }
    private AppUser user(Jwt jwt) { return users.findById(id(jwt)).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED)); }
    private Project ownedProject(Long pid, Long uid) { return projects.findByIdAndOwnerId(pid, uid)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found")); }
    private WorkTask ownedTask(Long tid, Long uid) { return tasks.findByIdAndProjectOwnerId(tid, uid)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found")); }
    private static String clean(String s) { return s == null ? "" : s.trim(); }
    private static String color(String s) { return s == null || s.isBlank() ? "#7C5CFC" : s; }
    private ProjectView pv(Project p) { return new ProjectView(p.id, p.name, p.description, p.color, p.createdAt); }
    private TaskView tv(WorkTask t) { return new TaskView(t.id, t.getProject().getId(), t.getProject().getName(),
            t.title, t.description, t.status, t.priority, t.dueDate, t.createdAt, t.updatedAt); }
    private void log(AppUser owner, String action, String detail) { activity.save(new ActivityLog(owner, action, detail)); }
}
