#!/bin/bash

echo "🚀 Starting Microservices Stack..."

# Stop any running containers and remove old data volumes for a clean slate
echo "🧹 Cleaning up old containers and volumes..."
docker compose down -v

# Build and start all services in detached mode
echo "🏗️ Building and starting services..."
docker compose up --build -d

echo "✅ Stack is up and running!"
echo "-------------------------------------------------"
echo "🌐 Frontend (React):     http://localhost:5173"
echo "🚪 API Gateway:          http://localhost:8080"
echo "🔐 Identity Service:     http://localhost:8081"
echo "📋 Task Service:         http://localhost:8082"
echo "🗄️ MySQL Database:       localhost:3306"
echo "-------------------------------------------------"
echo "Use 'docker compose logs -f' to view live logs."
