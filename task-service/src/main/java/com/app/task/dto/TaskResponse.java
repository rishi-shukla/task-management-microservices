package com.app.task.dto;

import com.app.task.domain.TaskStatus;
import java.time.LocalDateTime;

public record TaskResponse(
    Long id,
    String title,
    String description,
    TaskStatus status,
    String assignedUser,
    LocalDateTime createdDate
) {}
