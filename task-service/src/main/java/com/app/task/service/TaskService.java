package com.app.task.service;

import com.app.task.domain.Task;
import com.app.task.domain.TaskStatus;
import com.app.task.dto.TaskRequest;
import com.app.task.dto.TaskResponse;
import com.app.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository repository;

    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        log.info("Creating task: {}", request.title());
        Task task = Task.create(request.title(), request.description(), request.assignedUser());
        return mapToResponse(repository.save(task));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasks(TaskStatus status) {
        List<Task> tasks = (status != null) ? repository.findByStatus(status) : repository.findAll();
        return tasks.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse approveTask(Long taskId) {
        log.info("Approving task: {}", taskId);
        Task task = repository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.approve();
        log.info("NOTIFICATION: Task {} approved. Email simulated for user {}", taskId, task.getAssignedUser());

        return mapToResponse(repository.save(task));
    }

    @Transactional
    public TaskResponse rejectTask(Long taskId) {
        log.info("Rejecting task: {}", taskId);
        Task task = repository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.reject();
        return mapToResponse(repository.save(task));
    }

    private TaskResponse mapToResponse(Task task) {
        return new TaskResponse(
            task.getId(),
            task.getTitle(),
            task.getDescription(),
            task.getStatus(),
            task.getAssignedUser(),
            task.getCreatedDate()
        );
    }
}
