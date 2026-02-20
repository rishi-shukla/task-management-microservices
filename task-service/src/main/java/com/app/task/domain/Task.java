package com.app.task.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Getter
@NoArgsConstructor
@ToString
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private LocalDateTime createdDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;

    private String assignedUser;

    public static Task create(String title, String description, String assignedUser) {
        Task task = new Task();
        task.title = title;
        task.description = description;
        task.assignedUser = assignedUser;
        task.status = TaskStatus.PENDING;
        task.createdDate = LocalDateTime.now();
        return task;
    }

    public void approve() {
        if (this.status != TaskStatus.PENDING) {
            throw new IllegalStateException("Only pending tasks can be approved.");
        }
        this.status = TaskStatus.APPROVED;
    }

    public void reject() {
        if (this.status != TaskStatus.PENDING) {
            throw new IllegalStateException("Only pending tasks can be rejected.");
        }
        this.status = TaskStatus.REJECTED;
    }
}
