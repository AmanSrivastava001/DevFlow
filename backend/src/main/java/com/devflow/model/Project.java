package com.devflow.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "projects")
public class Project {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) public AppUser owner;
    @Column(nullable = false, length = 110) public String name;
    @Column(length = 1500) public String description;
    @Column(nullable = false, length = 16) public String color;
    @Column(nullable = false) public Instant createdAt = Instant.now();
    // Use getter methods for associations because Hibernate may return a lazy proxy.
    // Direct field reads from a proxy (e.g. task.project.owner) can be null.
    public Long getId() { return id; }
    public AppUser getOwner() { return owner; }
    public String getName() { return name; }
    public Project() {}
    public Project(AppUser owner, String name, String description, String color) {
        this.owner = owner; this.name = name; this.description = description; this.color = color;
    }
}
