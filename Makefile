.DEFAULT_GOAL := help

# ============================================================
# Docker Compose Commands
# ============================================================

up: ## Start all backend services (detached)
	docker compose up -d

down: ## Stop all backend services
	docker compose down

restart: ## Restart all backend services
	docker compose down && docker compose up -d

logs: ## Stream logs from all services
	docker compose logs -f

logs-gateway: ## Stream logs from API Gateway only
	docker compose logs -f gateway

logs-correction: ## Stream logs from Correction Service only
	docker compose logs -f correction

logs-storage: ## Stream logs from Storage Service only
	docker compose logs -f storage

logs-analytics: ## Stream logs from Analytics Service only
	docker compose logs -f analytics

logs-diagnosis: ## Stream logs from Diagnosis Service only
	docker compose logs -f diagnosis

build: ## Rebuild all Docker images
	docker compose build

build-no-cache: ## Rebuild all Docker images without cache
	docker compose build --no-cache

ps: ## Show status of all running services
	docker compose ps

# ============================================================
# Development
# ============================================================

dev: ## Start services in dev mode (with hot reload)
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

app: ## Run the Tauri desktop app in dev mode
	cd app && npm run tauri dev

# ============================================================
# Setup
# ============================================================

setup: ## First-time setup: copy .env.example to .env
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ .env created. Please fill in your API keys."; \
	else \
		echo "⚠️  .env already exists. Skipping."; \
	fi

install: ## Install frontend dependencies
	cd app && npm install

# ============================================================
# Utilities
# ============================================================

clean: ## Remove all stopped containers and unused images
	docker compose down --volumes --remove-orphans
	docker image prune -f

shell-gateway: ## Open a shell inside the gateway container
	docker compose exec gateway bash

shell-storage: ## Open a shell inside the storage container
	docker compose exec storage bash

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: up down restart logs logs-gateway logs-correction logs-storage \
        logs-analytics logs-diagnosis build build-no-cache ps dev app \
        setup install clean shell-gateway shell-storage help
