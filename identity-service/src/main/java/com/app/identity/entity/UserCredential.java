package com.app.identity.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data // Generates getters/setters (fixes getUsername, getPassword errors)
@AllArgsConstructor
@NoArgsConstructor
@Builder // Critical: Fixes the 'cannot find symbol: method builder()' error
@Table(name = "users")
public class UserCredential {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    // Fixed: Ensure the Role enum exists and is used correctly
    @Enumerated(EnumType.STRING)
    private Role role;
}