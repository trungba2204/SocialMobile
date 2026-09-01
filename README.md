# Orbit — Mobile Social Network

A full-stack social networking app: an Expo React Native (TypeScript) client
backed by a Java 21 / Spring Boot REST API on MySQL.

> **Orbit** — your social circles as orbits around you. Original UI/UX, not a
> clone of any existing network.

```
mobile/  (Expo + React Native + TypeScript)   →   REST / JWT
backend/ (Java 21 + Spring Boot + JPA)         →   MySQL 8
```

## Repository layout

| Path | What |
|---|---|
| [`backend/`](backend/README.md) | Spring Boot REST API — auth, users, posts, friends, notifications, search |
| [`mobile/`](mobile/README.md) | Expo React Native app — design system, navigation, feature screens |
| [`database/`](database/README.md) | MySQL setup, credentials, schema reference, seed toggle |
| `docs/superpowers/specs/` | Design spec |
| `docs/superpowers/plans/` | Milestone implementation plans |

## Status

**Milestone 1 (backend): complete** — authentication (JWT + refresh rotation),
user profiles & avatars, post CRUD / feed / like / share, threaded comments,
friend requests & suggestions, notifications, user & post search, local media
storage, dev seed data. 80+ tests green; verified booting against MySQL.

**Milestone 1 (mobile): complete** — full Expo/React Native client: auth flow,
home feed, post detail + threaded comments, create post (text + photos), friends
(requests / friends / suggestions), search (people + posts), notifications with
tap-through routing, profile + edit profile, settings (appearance + logout),
design system (light + dark), typed navigation. Stories and Messages ship as
complete mock-data UI pending their milestones. 36 Jest suites / 107 tests green;
`tsc --noEmit` clean; `expo export` bundles; API contracts verified end-to-end
against the seeded backend. See [`mobile/README.md`](mobile/README.md).

Remaining milestones: M2 Stories, M3 Messaging (REST), M4 real-time (STOMP),
M5 polish. See `docs/superpowers/`.

## Quick start (backend)

```bash
# MySQL 8 must be running on localhost:3306 (user root / pass 1234567890)
cd backend
JAVA_HOME=$(/usr/libexec/java_home -v 21) SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
# Swagger: http://localhost:8080/swagger-ui.html   — seed logins use password Password123!
```
