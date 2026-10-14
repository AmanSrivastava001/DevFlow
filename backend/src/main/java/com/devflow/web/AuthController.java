package com.devflow.web;

import com.devflow.model.*;
import com.devflow.repo.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final ActivityRepository activity;
    private final PasswordEncoder encoder;
    private final JwtEncoder jwt;

    public AuthController(UserRepository users, ProjectRepository projects, TaskRepository tasks,
                          ActivityRepository activity, PasswordEncoder encoder, JwtEncoder jwt) {
        this.users = users; this.projects = projects; this.tasks = tasks;
        this.activity = activity; this.encoder = encoder; this.jwt = jwt;
    }

    public record RegisterRequest(@NotBlank @Size(min = 2, max = 100) String fullName,
                                  @NotBlank @Email String email,
                                  @NotBlank @Size(min = 8, max = 100) String password) {}
    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}
    public record UserView(Long id, String fullName, String email) {}
    public record AuthResponse(String token, UserView user) {}

    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmail(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        AppUser user = users.save(new AppUser(request.fullName().trim(), email, encoder.encode(request.password())));
        createStarterWorkspace(user);
        return responseFor(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        AppUser user = users.findByEmail(request.email().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!encoder.matches(request.password(), user.passwordHash)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return responseFor(user);
    }

    @GetMapping("/me")
    public UserView me(@AuthenticationPrincipal Jwt principal) {
        AppUser user = users.findById(Long.parseLong(principal.getSubject()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return view(user);
    }

    private AuthResponse responseFor(AppUser user) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder()
                .subject(user.id.toString()).issuedAt(now).expiresAt(now.plus(Duration.ofHours(12)))
                .claim("email", user.email).build();
        var header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwt.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AuthResponse(token, view(user));
    }
    private static UserView view(AppUser u) { return new UserView(u.id, u.fullName, u.email); }

    private void createStarterWorkspace(AppUser user) {
        Project design = projects.save(new Project(user, "Website Redesign", "Elevate the website experience and improve conversion.", "#7C5CFC"));
        Project mobile = projects.save(new Project(user, "Mobile App Launch", "Plan and deliver the next release to customers.", "#13B8A6"));
        Project growth = projects.save(new Project(user, "Growth Experiments", "Run and evaluate experiments with the team.", "#F59E5B"));
        addTask(design, "Audit current user experience", WorkTask.Status.DONE, WorkTask.Priority.HIGH, -2);
        addTask(design, "Design landing page wireframes", WorkTask.Status.IN_PROGRESS, WorkTask.Priority.HIGH, 2);
        addTask(design, "Review typography and components", WorkTask.Status.REVIEW, WorkTask.Priority.MEDIUM, 4);
        addTask(design, "Implement responsive navigation", WorkTask.Status.TODO, WorkTask.Priority.MEDIUM, 6);
        addTask(mobile, "Define onboarding flow", WorkTask.Status.DONE, WorkTask.Priority.HIGH, -1);
        addTask(mobile, "Build notification preferences", WorkTask.Status.IN_PROGRESS, WorkTask.Priority.URGENT, 1);
        addTask(mobile, "Prepare beta release checklist", WorkTask.Status.TODO, WorkTask.Priority.MEDIUM, 8);
        addTask(growth, "Analyze acquisition funnel", WorkTask.Status.IN_PROGRESS, WorkTask.Priority.HIGH, 3);
        addTask(growth, "Draft A/B test hypothesis", WorkTask.Status.TODO, WorkTask.Priority.LOW, 5);
        activity.save(new ActivityLog(user, "WORKSPACE_CREATED", "Your sample workspace is ready to explore"));
    }
    private void addTask(Project project, String title, WorkTask.Status status, WorkTask.Priority priority, int daysFromNow) {
        tasks.save(new WorkTask(project, title, "Starter task — edit or delete it to make this workspace yours.", status, priority, LocalDate.now().plusDays(daysFromNow)));
    }
}
