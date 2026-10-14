package com.devflow.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "activity_logs")
public class ActivityLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) public AppUser owner;
    @Column(nullable = false, length = 140) public String action;
    @Column(nullable = false, length = 220) public String detail;
    @Column(nullable = false) public Instant createdAt = Instant.now();
    public ActivityLog() {}
    public ActivityLog(AppUser owner, String action, String detail) {
        this.owner = owner; this.action = action; this.detail = detail;
    }
}
