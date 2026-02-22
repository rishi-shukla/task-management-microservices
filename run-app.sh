#!/bin/bash

echo "🚀 Preparing Task Management Microservices..."

# Function to build a Spring Boot service reliably
build_service() {
  SERVICE_NAME=$1
  echo "📦 Compiling $SERVICE_NAME..."
  cd "$SERVICE_NAME" || exit

  # Check if Maven Wrapper exists, otherwise fall back to global Maven
  if [ -f "./mvnw" ]; then
      # Make wrapper executable just in case
      chmod +x mvnw
      ./mvnw clean package -DskipTests
  else
      mvn clean package -DskipTests
  fi

  cd ..
  echo "✅ $SERVICE_NAME compiled successfully."
  echo "----------------------------------------"
}

# 1. Compile all Java backend services first
build_service "identity-service"
build_service "task-service"
build_service "gateway-service"

# 2. Stop any running containers and remove old data volumes for a clean slate
echo "🧹 Cleaning up old containers and volumes..."
docker compose down -v

# 3. Build and start all services in detached mode
echo "🏗️ Building and starting Docker containers..."
docker compose up --build -d

echo "⏳ Waiting for the API Gateway to become fully responsive (this usually takes 20-30 seconds)..."

# Keep pinging the Gateway until it stops refusing connections
while ! curl -s http://localhost:8080 > /dev/null; do
    sleep 3
    echo -n "."
done

echo ""
echo "================================================="
echo "✅ Stack is up and running successfully!"
echo "🌐 Frontend (React):     http://localhost:5173"
echo "🚪 API Gateway:          http://localhost:8080"
echo "🔐 Identity Service:     http://localhost:8081"
echo "📋 Task Service:         http://localhost:8082"
echo "🗄️ MySQL Database:       localhost:3306"
echo "================================================="
