# Orbit Backend

Java 21 · Spring Boot 3.3 · Spring Security (JWT) · Spring Data JPA · MySQL 8 · Maven

REST API for the Orbit mobile social network. Milestone 1 covers authentication,
users, posts, comments, likes, shares, friends, notifications and search.

## Prerequisites

- **JDK 21** — `JAVA_HOME` must point at a 21 JDK:
  ```bash
  export JAVA_HOME=$(/usr/libexec/java_home -v 21)
  ```
- **MySQL 8** running on `localhost:3306` (see [`../database/README.md`](../database/README.md)).
  The app creates the `social_network` schema automatically.

## Configuration

All settings live in `src/main/resources/application.yml` with environment-variable
overrides — nothing sensitive is hard-coded in Java.

| Env var | Default | Purpose |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / `3306` / `social_network` | database location |
| `DB_USER` / `DB_PASSWORD` | `root` / `1234567890` | database credentials |
| `JWT_SECRET` | dev placeholder (≥32 bytes) | HS256 signing key — **set in any shared env** |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | `PT15M` / `P7D` | token lifetimes |
| `CORS_ORIGINS` | Expo dev origins | comma-separated allowed origins |
| `STORAGE_DIR` | `./uploads` | local media directory |
| `SEED_ENABLED` | `false` (`true` in `dev` profile) | insert demo data when DB is empty |

## Run

```bash
# dev profile enables seed data + debug logging
JAVA_HOME=$(/usr/libexec/java_home -v 21) SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```

- API base: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Health: `http://localhost:8080/actuator/health`

Seed users share the password `Password123!` (`alice`, `ben`, `chloe`, …).

## Test & build

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn clean test      # 80+ unit/slice/IT tests, H2-backed
JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn clean package   # produces target/orbit-backend.jar
java -jar target/orbit-backend.jar
```

Tests use in-memory H2 (MySQL mode); no Docker or MySQL needed to run them.

## Architecture

Feature-first packages under `com.socialapp` (`auth`, `user`, `post`, `friend`,
`notification`, `search`, `storage`, `common`, `config`). Strict
`Controller → Service → Repository` layering; DTOs at the controller boundary
(JPA entities are never serialized). Cross-feature calls go through small SPI
interfaces (`NotificationPort`, `FriendGraphPort`, `ProfileStatsPort`,
`PostStatsPort`) with no-op fallback beans, so modules stay decoupled and
independently testable.

Media is stored on local disk behind `StorageService`; swap in an S3/MinIO
implementation later without touching callers.

## Schema

Hibernate `ddl-auto=update` manages the dev schema. `src/main/resources/db/schema-reference.sql`
is a hand-maintained reference (not executed; `spring.sql.init.mode=never`). **Adopt Flyway before deploying** —
see [`../database/README.md`](../database/README.md).
