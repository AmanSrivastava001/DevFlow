package com.devflow.model;

import jakarta.persistence.*;
import java.time.*;

@Entity @Table(name = "work_tasks", indexes = @Index(name = "idx_task_project", columnList = "project_id"))
public class WorkTask {
    public enum Status { TODO, IN_PROGRESS, REVIEW, DONE }
    public enum Priority { LOW, MEDIUM, HIGH, URGENT }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) public Project project;
    @Column(nullable = false, length = 160) public String title;
    @Column(length = 3500) public String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) public Status status = Status.TODO;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) public Priority priority = Priority.MEDIUM;
    public LocalDate dueDate;
    @Column(nullable = false) public Instant createdAt = Instant.now();
    @Column(nullable = false) public Instant updatedAt = Instant.now();
    public Project getProject() { return project; }
    public WorkTask() {}
    public WorkTask(Project project, String title, String description, Status status, Priority priority, LocalDate dueDate) {
        this.project = project; this.title = title; this.description = description;
        this.status = status; this.priority = priority; this.dueDate = dueDate;
    }
    @PreUpdate public void touch() { updatedAt = Instant.now(); }
}
