package com.app.identity.controller;

import com.app.identity.dto.AuthRequest;
import com.app.identity.dto.RegisterRequest;
import com.app.identity.dto.UserResponse; // Fixed: Missing import
import com.app.identity.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List; // Fixed: Missing import
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService service;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody @Valid RegisterRequest request) {
        return ResponseEntity.ok(service.saveUser(request));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody @Valid AuthRequest request) {
        Authentication authenticate = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        if (authenticate.isAuthenticated()) {
            return ResponseEntity.ok(Map.of("token", service.generateToken(request.getUsername())));
        } else {
            throw new RuntimeException("Invalid credentials");
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<String> validate(@RequestParam("token") String token) {
        service.validateToken(token);
        return ResponseEntity.ok("Token is valid");
    }

    // Fixed: Uses the injected 'service' to return the secure user list
    @GetMapping("/users")
    public List<UserResponse> getAllUsers() {
        return service.getAllUsers();
    }
}