.PHONY: up down build shell migrate fresh seed test artisan composer panel-install panel-dev panel-build pwa-install pwa-dev pwa-test pwa-check logs tinker

NODE_RUN = docker compose run --rm --service-ports node sh -c

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

shell:
	docker compose exec app bash

migrate:
	docker compose exec app php artisan migrate

fresh:
	docker compose exec app php artisan migrate:fresh --seed

seed:
	docker compose exec app php artisan db:seed

test:
	docker compose exec app php artisan test

# make artisan c="route:list"
artisan:
	docker compose exec app php artisan $(c)

# make composer c="require foo/bar"
composer:
	docker compose exec app composer $(c)

tinker:
	docker compose exec app php artisan tinker

logs:
	docker compose logs -f

panel-install:
	docker compose run --rm node sh -c "cd backend && npm install"

panel-build:
	docker compose run --rm node sh -c "cd backend && npm run build"

panel-dev:
	docker compose run --rm -p 5173:5173 node sh -c "cd backend && npm run dev -- --host 0.0.0.0"

pwa-install:
	docker compose run --rm node sh -c "cd pwa && npm install"

pwa-dev:
	docker compose run --rm -p 5174:5174 node sh -c "cd pwa && npm run dev -- --host 0.0.0.0 --port 5174"

pwa-test:
	docker compose run --rm node sh -c "cd pwa && npm run test"

pwa-check:
	docker compose run --rm node sh -c "cd pwa && npm run lint && npm run typecheck && npm run test"

panel-check:
	docker compose run --rm node sh -c "cd backend && npm run lint && npm run typecheck"
