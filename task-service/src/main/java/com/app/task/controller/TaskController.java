package com.app.task.controller;

import com.app.task.domain.TaskStatus;
import com.app.task.dto.TaskRequest;
import com.app.task.dto.TaskResponse;
import com.app.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService service;

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @RequestBody @Valid TaskRequest request,
            @RequestAttribute(value = "username", required = false) String username) {

        if (username == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createTask(request));
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(
            @RequestParam(required = false) TaskStatus status,
            @RequestAttribute(value = "username", required = false) String username) {

        if (username == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.getAllTasks(status));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<TaskResponse> approveTask(
            @PathVariable Long id,
            @RequestAttribute(value = "role", required = false) String role) {

        if (!"MANAGER".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(service.approveTask(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<TaskResponse> rejectTask(
            @PathVariable Long id,
            @RequestAttribute(value = "role", required = false) String role) {

        if (!"MANAGER".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(service.rejectTask(id));
    }
}
