# Take-Home Assignment: Task Management Microservices

A full-stack, microservices-based task management application built with Spring Boot 3, Java 21, and React. This project demonstrates secure, scalable architecture using an API Gateway, stateless JWT authentication, and containerized deployment.

## 🏗️ Architecture Overview

The backend is decomposed into purpose-built services, communicating via REST and shielded by an API Gateway to prevent direct external access to internal microservices.

* **Frontend (React/Vite - Port 5173)**: A Single Page Application (SPA) providing the user interface for authenticating and managing tasks.
* **API Gateway (Spring Cloud Gateway - Port 8080)**: The single entry point for the frontend. It handles cross-origin resource sharing (CORS) pre-flight requests and dynamically routes traffic to the appropriate downstream microservice.
* **Identity Service (Port 8081)**: Manages user authentication, registration, and role-based access control. Uses `io.jsonwebtoken` (JJWT 0.12.5) for issuing and validating secure, stateless JSON Web Tokens.
* **Task Service (Port 8082)**: Manages the core business logic, handling CRUD operations for tasks and ensuring users only interact with authorized data.
* **Database (MySQL - Port 3306)**: A containerized database initialized automatically via an `init.sql` script to seed necessary schemas and test users.

---

## 🚀 Quick Start

Ensure you have [Docker](https://www.docker.com/) and Docker Compose installed on your machine.

**1. Clone the repository:**
```bash
git clone https://github.com/rishi-shukla/task-management-microservices.git
cd task-management-microservices
2. Make the startup script executable (Mac/Linux users):

Bash
chmod +x run-app.sh
3. Run the startup script:

Bash
./run-app.sh
(Windows users can simply run bash run-app.sh or execute docker compose up --build -d directly).

Note: Please allow approximately 30-60 seconds for the database to fully initialize and the Java microservices to boot up.

🔑 Access & Test Credentials
Once the application is running, open your browser and navigate to the frontend UI:

Web Interface URL: http://localhost:5173

The database is pre-seeded with test accounts so you can immediately evaluate the application's Role-Based Access Control (RBAC) without needing to register manually. You can log in using any of the following credentials:

Username,Password,Role,Access Level
rishi,password,MANAGER,Full access to assign and manage all tasks.
manager,password,MANAGER,Full access to assign and manage all tasks.
user1,password,USER,Restricted access to view/update assigned tasks.
employee1,password,USER,Restricted access to view/update assigned tasks.

Note: The API Gateway runs on http://localhost:8080, but you only need to interact with the frontend UI on port 5173. The React application handles routing API requests through the gateway automatically.

📈 Trade-offs, Shortcomings & Future Scalability
While this application fulfills the core requirements of the assignment, several enterprise-grade optimizations were scoped out for time but would be critical for a true production environment:

Pagination & Sorting: Currently, the Task Service fetches all tasks at once. For scalability, the /tasks endpoints should implement offset/limit or cursor-based pagination (using Spring Data's Pageable) to prevent memory exhaustion and UI lag on large datasets.

Caching Strategy: The Identity Service validates the JWT and fetches user roles on every request. Introducing a distributed cache (like Redis) would significantly reduce database hits for session and token validation.

Database Scaling: The app currently relies on a single MySQL instance. As read-heavy traffic scales, the architecture should evolve into a primary-replica setup, routing read operations to read-replicas to reduce load on the primary write node.

Resilience & Rate Limiting: The API Gateway currently lacks circuit breakers. Integrating Resilience4j would prevent cascading failures if a downstream service goes offline. Additionally, implementing IP or user-based rate limiting at the Gateway would protect against DDoS attacks.

Password Security: For ease of testing and evaluation by the review team, plain-text (NoOpPasswordEncoder) encoding is configured. In a production scenario, this must be swapped to BCryptPasswordEncoder to securely hash credentials before persisting them to the database.
