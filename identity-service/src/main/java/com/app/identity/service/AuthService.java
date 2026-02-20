package com.app.identity.service;

import com.app.identity.dto.RegisterRequest;
import com.app.identity.dto.UserResponse;
import com.app.identity.entity.UserCredential;
import com.app.identity.repository.UserCredentialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Fixed: This handles final fields automatically
public class AuthService {
    private final UserCredentialRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService; // Fixed: Moved to constructor to avoid NullPointer

    public List<UserResponse> getAllUsers() {
        return repository.findAll().stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getRole().name()
                ))
                .collect(Collectors.toList());
    }

    public String saveUser(RegisterRequest request) {
        if (repository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("User already exists");
        }

        UserCredential user = UserCredential.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                // Fixed: If using NoOp, we don't encode here to match database
                .password(request.getPassword())
                .role(request.getRole())
                .build();
        repository.save(user);
        return "User added successfully";
    }

    public String generateToken(String username) {
        UserCredential user = repository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return jwtService.generateToken(username, user.getRole().name());
    }

    public void validateToken(String token) {
        String username = jwtService.extractUsername(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        if (!jwtService.validateToken(token, userDetails)) {
            throw new RuntimeException("Invalid token");
        }
    }
}