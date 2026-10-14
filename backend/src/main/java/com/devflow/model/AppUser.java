package com.devflow.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "app_users", indexes = @Index(name = "idx_user_email", columnList = "email", unique = true))
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(nullable = false, length = 100) public String fullName;
    @Column(nullable = false, unique = true, length = 200) public String email;
    @Column(nullable = false) public String passwordHash;
    @Column(nullable = false) public Instant createdAt = Instant.now();
    public AppUser() {}
    public AppUser(String fullName, String email, String passwordHash) {
        this.fullName = fullName; this.email = email; this.passwordHash = passwordHash;
    }
}
