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
storage, dev seed data. Messaging added in M3 (see below). 99 tests green; verified booting against MySQL.

**Milestone 1 (mobile): complete** — full Expo/React Native client: auth flow,
home feed, post detail + threaded comments, create post (text + photos), friends
(requests / friends / suggestions), search (people + posts), notifications with
tap-through routing, profile + edit profile, settings (appearance + logout),
design system (light + dark), typed navigation. See [`mobile/README.md`](mobile/README.md).

**Milestone 3 (messaging): complete** — real REST-backed conversations & messages
(`/api/conversations`, `.../messages`, `.../read`) on both backend (entities,
service, controller, notification wiring, seed) and mobile (`ConversationListScreen`
/ `ChatScreen` via `@/api/conversations`). Delivery is poll-on-focus +
pull-to-refresh; real-time transport (STOMP) is a future enhancement, not in M1–M4. Full end-to-end
verified against MySQL (register → post → like → comment → share → friend →
conversation → message → avatar/cover upload → notifications → search).
99 backend tests green; 124 Jest suites/tests green; `tsc` clean; `expo export` bundles.

**Milestone 4 (Stories + feed scope): complete** — Stories is now a real REST
feature end-to-end: `POST/GET/DELETE /api/stories`, `POST /api/stories/{id}/view`
(self-view is a no-op), 24h expiry, friend-visibility (you see your own reel plus
active reels of friends only), multipart upload with local media storage and
file-delete on story delete. Backend: entity/repo/service/controller/mapper/dto +
seed + tests. Mobile: rail, viewer (view-tracking + delete), AddStory upload —
all via `@/api/stories`. The feed (`GET /api/posts`) is now own + friends'
non-private posts only, never global public. **There is no mock/fake/hardcoded
runtime data anywhere in the mobile app** — the `src/mock/` directory is gone and
every `catch` sets an error state / toast / rethrows (never returns canned data).
Brand-new friendless user verified against MySQL: posts / stories / conversations
/ notifications / friends all empty; own post/story/message/avatar/cover persist
(survive re-login); friending alice makes her story + non-private posts appear.
123 backend tests green; 139 Jest tests green; `tsc` clean; `expo export` bundles.

Remaining milestones: M5 polish. Real-time (STOMP / WebSocket) is a future
enhancement and is not part of M1–M4. See `docs/superpowers/`.

## Quick start (backend)

```bash
# MySQL 8 must be running on localhost:3306 (user root / pass 1234567890)
cd backend
JAVA_HOME=$(/usr/libexec/java_home -v 21) SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
# Swagger: http://localhost:8080/swagger-ui.html   — seed logins use password Password123!
```
