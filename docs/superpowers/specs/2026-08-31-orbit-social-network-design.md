# Orbit — Social Networking Mobile App — Design Spec

**Date:** 2026-08-31
**Source requirements:** `Spec/SPEC.md`
**Status:** Approved for Milestone 1 planning

Orbit is a full-stack mobile social network: an Expo React Native (TypeScript) app
talking to a Java 21 / Spring Boot REST backend backed by MySQL. This document is
the authoritative design. Implementation is milestoned; each milestone gets its own
plan under `docs/superpowers/plans/`.

---

## 1. Scope Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Delivery shape | **MVP-first**, then expand | Fastest path to a runnable end-to-end slice |
| Milestone 1 | Auth + Feed + Posts + Comments + Likes + Friends + Notifications + Search, backend **and** mobile | End-to-end vertical slice |
| Real-time messaging | Architected now, **REST-only** first (STOMP in M4) | Matches SPEC.md fallback guidance |
| Media storage | **Local disk** behind `StorageService` interface | S3/MinIO swap later, zero infra now |
| DB migrations | Hibernate `ddl-auto=update` for dev; checked-in `schema.sql` as reference | Speed now; adopt Flyway before any real deploy |

### Milestones

1. **M1 – Runnable slice**: scaffolding, MySQL config, base + auth + post + social entities,
   JWT auth, user/post/comment/like/friend/notification/search APIs, local storage, seed data,
   backend tests. Mobile: design system, auth screens, tab navigation, Home feed, PostDetail,
   Comments, Create Post, Friends, Notifications, Profile, Search, Settings shell, full API
   integration with loading/error/empty states.
2. **M2 – Stories**: Story + StoryView entities, APIs, carousel, viewer, reactions/replies/views.
3. **M3 – Messaging (REST)**: Conversation/ConversationMember/Message entities + APIs,
   conversation list, chat screen, polling.
4. **M4 – Real-time**: STOMP over WebSocket, typing indicators, live read receipts, push hook.
5. **M5 – Polish**: settings sub-screens, blocked users, appearance/language, animation +
   accessibility + performance pass.

---

## 2. System Architecture

```
mobile/ (Expo RN + TS)            backend/ (Spring Boot 3, Java 21)         MySQL
  React Navigation                  REST /api/**                            social_network
  Zustand stores          HTTPS     Spring Security + JWT filter    JDBC
  Axios API client   <───JWT───>    Controller -> Service -> Repository  <──>
  @tanstack/react-query             DTO boundary (MapStruct)
  react-native-reanimated           @RestControllerAdvice error handler
                                    LocalStorageService -> ./uploads
```

### 2.1 Backend layering

Per request: `Controller → Service → Repository → Entity`. DTOs at the controller
boundary only — **JPA entities are never serialized to/from controllers**. Mapping via
MapStruct. Cross-cutting: `SecurityConfig` (stateless, JWT filter), `CorsConfig`,
`OpenApiConfig` (springdoc), `JpaAuditingConfig` (`@EnableJpaAuditing`), global
`@RestControllerAdvice`.

### 2.2 Backend package structure (feature-first)

```
com.socialapp
├── config/        SecurityConfig, CorsConfig, OpenApiConfig, JpaAuditingConfig, SeedDataRunner
├── common/        BaseEntity, ApiError, PageResponse, exceptions/, CurrentUser resolver
├── auth/          AuthController, AuthService, dto/, jwt/ (JwtService, JwtAuthFilter, JwtProperties)
├── user/          UserController, UserService, UserRepository, User, Role, dto/, UserMapper
├── post/          PostController, PostService, PostRepository, Post, PostMedia, dto/, PostMapper
│   ├── comment/   CommentController, CommentService, CommentRepository, Comment, dto/
│   ├── like/      PostLike, PostLikeRepository (like/unlike handled in PostService)
│   └── share/     Share, ShareRepository
├── friend/        FriendController, FriendService, Friendship, FriendRequest, repositories, dto/
├── notification/  NotificationController, NotificationService, Notification, dto/, NotificationType
├── search/        SearchController, SearchService, dto/
└── storage/       StorageService (iface), LocalStorageService, StorageProperties, MediaController
```

### 2.3 Mobile structure

```
mobile/src
├── api/           client.ts (axios + interceptors), auth.ts, users.ts, posts.ts, friends.ts,
│                  notifications.ts, search.ts, types.ts
├── auth/          screens/ (Splash, Login, Register, ForgotPassword), useAuthStore.ts
├── navigation/    RootNavigator, AuthNavigator, AppNavigator, MainTabs, linking.ts
├── features/
│   ├── home/      FeedScreen, PostDetailScreen, CommentsScreen, components/PostCard, StoriesRail(stub)
│   ├── post/      CreatePostScreen, components/
│   ├── friends/   FriendsScreen, RequestsScreen, SuggestionsScreen
│   ├── notifications/ NotificationsScreen, resolveNotification.ts
│   ├── messages/  ConversationListScreen (stub for M3), ChatScreen (stub)
│   ├── profile/   ProfileScreen, EditProfileScreen
│   ├── search/    SearchScreen
│   └── settings/  SettingsScreen
├── components/    Button, IconButton, TextField, Card, Avatar, Badge, Tabs, BottomSheet,
│                  Modal, Toast, Skeleton, EmptyState, Divider, Chip, ScreenContainer
├── theme/         tokens.ts, ThemeProvider.tsx, useTheme.ts
├── store/         useUiStore.ts (theme mode, toasts)
└── lib/           hooks/, format.ts (relative time), validation.ts
```

---

## 3. Data Model

Every table: `id BIGINT AUTO_INCREMENT PRIMARY KEY`, `created_at DATETIME NOT NULL`,
`updated_at DATETIME NOT NULL` via `BaseEntity` + JPA auditing. All FK columns indexed.
Enums stored as `VARCHAR` via `@Enumerated(EnumType.STRING)`.

### M1 entities

| Entity | Fields | Constraints / relationships |
|---|---|---|
| `User` | email, username, password_hash, display_name, bio (nullable), avatar_url (nullable), cover_url (nullable), is_active (default true) | `UNIQUE(email)`, `UNIQUE(username)`; `@ManyToMany` → `Role` (join `user_roles`) |
| `Role` | name | `UNIQUE(name)`; values `ROLE_USER`, `ROLE_ADMIN` |
| `RefreshToken` | token, user_id, expires_at, revoked (default false) | `UNIQUE(token)`, index(user_id) |
| `Post` | author_id, content (TEXT, nullable if media present), privacy ENUM(PUBLIC,FRIENDS,PRIVATE) default PUBLIC, feeling (nullable), location (nullable) | index(author_id, created_at) |
| `PostMedia` | post_id, url, type ENUM(IMAGE,VIDEO), position INT | FK post_id `ON DELETE CASCADE`, index(post_id) |
| `Comment` | post_id, author_id, content, parent_id (nullable, one level of replies) | index(post_id, created_at), FK parent_id → comment.id |
| `PostLike` | post_id, user_id | `UNIQUE(post_id, user_id)` |
| `Share` | post_id, user_id, caption (nullable) | `UNIQUE(post_id, user_id)` |
| `Friendship` | user_low_id, user_high_id | stored canonically (user_low_id < user_high_id); `UNIQUE(user_low_id, user_high_id)` |
| `FriendRequest` | requester_id, addressee_id, status ENUM(PENDING,ACCEPTED,REJECTED) default PENDING | `UNIQUE(requester_id, addressee_id)`, index(addressee_id, status) |
| `Notification` | recipient_id, actor_id, type ENUM, entity_type (nullable), entity_id (nullable), is_read (default false) | index(recipient_id, created_at) |

`NotificationType`: `POST_LIKE, POST_COMMENT, POST_SHARE, FRIEND_REQUEST, FRIEND_ACCEPTED,
MESSAGE, STORY_REACTION` (only the first five fire in M1).

### Later-milestone entities (designed, not built in M1)

`Conversation(is_group, title)`, `ConversationMember(conversation_id, user_id,
last_read_message_id, unread_count)` `UNIQUE(conversation_id,user_id)`,
`Message(conversation_id, sender_id, content, type, attachment_url)`,
`Story(author_id, media_url, type, caption, expires_at)`,
`StoryView(story_id, viewer_id, reaction)` `UNIQUE(story_id, viewer_id)`.

### Serialization safety

No `@ManyToOne`/`@OneToMany` is serialized. Relationships are `LAZY`. Controllers return
DTOs assembled by services. No Jackson entity graphs, so no recursion.

---

## 4. REST API (M1)

Base path `/api`. JSON. Auth via `Authorization: Bearer <accessToken>` on every route
except `/auth/register`, `/auth/login`, `/auth/refresh`.

### 4.1 Error envelope

```json
{
  "timestamp": "2026-08-31T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/posts",
  "fieldErrors": [{ "field": "content", "message": "must not be blank" }]
}
```

Status codes: 400 validation, 401 missing/expired token, 403 not permitted,
404 not found, 409 conflict (duplicate like, existing friend request), 500 fallback.

### 4.2 Pagination envelope

Request `?page=0&size=20`. Response:

```json
{ "content": [ ... ], "page": 0, "size": 20, "totalElements": 137, "totalPages": 7, "last": false }
```

### 4.3 Endpoints

```
POST   /auth/register     { email, username, displayName, password } -> { accessToken, refreshToken, user }
POST   /auth/login        { emailOrUsername, password }              -> { accessToken, refreshToken, user }
POST   /auth/refresh      { refreshToken }                           -> { accessToken, refreshToken }
POST   /auth/logout       { refreshToken }                           -> 204
GET    /auth/me                                                      -> UserDto

GET    /users/{id}                                                   -> UserProfileDto
PUT    /users/me          { displayName?, bio? }                     -> UserDto
POST   /users/me/avatar   multipart file                             -> { url }
POST   /users/me/cover    multipart file                             -> { url }
GET    /users/{id}/posts  ?page&size                                 -> Page<PostDto>

GET    /posts             ?page&size   (feed: own + friends' + PUBLIC, newest first) -> Page<PostDto>
POST   /posts             multipart: part "post" (JSON: content?, privacy?, feeling?, location?)
                                    + parts "media" (0..4 files)     -> PostDto
GET    /posts/{id}                                                   -> PostDto
PUT    /posts/{id}        { content?, privacy?, feeling?, location? } -> PostDto   (author only)
DELETE /posts/{id}                                                   -> 204        (author only)
POST   /posts/{id}/like                                              -> { liked: true, likeCount }
DELETE /posts/{id}/like                                              -> { liked: false, likeCount }
POST   /posts/{id}/share  { caption? }                               -> PostDto (the share record surfaced)
GET    /posts/{id}/comments ?page&size                               -> Page<CommentDto>
POST   /posts/{id}/comments { content, parentId? }                   -> CommentDto
DELETE /comments/{id}                                                -> 204 (author or post author)

GET    /friends            ?page&size                                -> Page<UserDto>
GET    /friends/requests   ?page&size   (incoming, PENDING)          -> Page<FriendRequestDto>
GET    /friends/suggestions                                          -> List<UserDto> (friends-of-friends, max 20)
POST   /friends/requests/{userId}                                    -> FriendRequestDto (409 if exists/already friends)
POST   /friends/requests/{id}/accept                                 -> 204 (addressee only)
POST   /friends/requests/{id}/reject                                 -> 204 (addressee only)
DELETE /friends/{userId}                                             -> 204

GET    /notifications      ?page&size                                -> Page<NotificationDto> (+ header X-Unread-Count)
POST   /notifications/{id}/read                                      -> 204
POST   /notifications/read-all                                       -> 204

GET    /search/users       ?q=&page&size   (username/displayName LIKE) -> Page<UserDto>
GET    /search/posts       ?q=&page&size   (content LIKE, visible only) -> Page<PostDto>
```

Swagger UI served at `/swagger-ui.html`, OpenAPI JSON at `/v3/api-docs`.

### 4.4 Core DTO shapes

```
UserDto            { id, username, displayName, avatarUrl, bio }
UserProfileDto     UserDto + { coverUrl, friendCount, postCount, friendStatus }   // friendStatus: NONE|PENDING_OUT|PENDING_IN|FRIENDS|SELF
PostDto            { id, author: UserDto, content, privacy, feeling, location,
                     media: [{ url, type, position }], createdAt,
                     likeCount, commentCount, shareCount, likedByMe }
CommentDto         { id, post: { id }, author: UserDto, content, parentId, createdAt }
FriendRequestDto   { id, requester: UserDto, createdAt, status }
NotificationDto    { id, type, actor: UserDto, entityType, entityId, isRead, createdAt }
AuthResponse       { accessToken, refreshToken, user: UserDto }
```

---

## 5. Authentication

- Passwords: **BCrypt** (`strength 10`). Never stored, logged, or returned.
- Access token: JWT HS256, **15 min** TTL, claims `sub` (user id), `username`, `roles`.
- Refresh token: opaque UUID string, persisted in `refresh_token`, **7 day** TTL,
  **rotated** on every `/auth/refresh` (old row `revoked=true`, new row issued).
- `/auth/logout` revokes the supplied refresh token.
- Secret + TTLs from `application.yml` → env override (`JWT_SECRET`, `JWT_ACCESS_TTL`,
  `JWT_REFRESH_TTL`). No secret hard-coded in Java.
- `SecurityConfig`: stateless session, CSRF disabled, `JwtAuthFilter` before
  `UsernamePasswordAuthenticationFilter`, permit `/auth/register|login|refresh`,
  `/v3/api-docs/**`, `/swagger-ui/**`; everything else authenticated.
- Role-based: `@PreAuthorize` where admin-only endpoints appear (none in M1, wiring ready).

Mobile side: access token in memory (Zustand, not persisted), refresh token in
`expo-secure-store`. Axios response interceptor: on 401 → single refresh attempt →
retry original request → on failure clear session, route to Login.

---

## 6. Navigation (mobile)

```
RootNavigator            switches on useAuthStore.status: 'loading' | 'signedOut' | 'signedIn'
├── AuthNavigator (Stack, headerless)
│     Splash -> Login -> Register -> ForgotPassword
└── AppNavigator (Stack)
      ├── MainTabs (bottom tabs)
      │     Home          -> HomeStack: Feed, PostDetail, Comments, UserProfile
      │     Friends       -> FriendsStack: FriendsHome, Requests, Suggestions, UserProfile
      │     Create        -> center action tab; intercepts tabPress, opens CreatePost modal
      │     Notifications -> NotificationsStack: NotificationList
      │     Profile       -> ProfileStack: MyProfile, EditProfile, Settings
      ├── CreatePost         (modal, slide-up)
      ├── Search             (Stack, pushed from Home header)
      ├── ImageViewer        (modal, fade)
      └── Messages           (Stack, pushed from Home header; list + chat are M3 stubs)
```

`resolveNotification(type, entityType, entityId, navigation)` centralizes deep-link
routing: `POST_LIKE|POST_COMMENT|POST_SHARE` → PostDetail; `FRIEND_REQUEST` → Requests;
`FRIEND_ACCEPTED` → UserProfile.

`linking.ts` prefixes: `orbit://` and `https://orbit.app` (config only in M1).

---

## 7. Design System

Original identity — **not** a clone of any existing network.

- **Brand**: working name **Orbit** — your social circles as orbits around you.
  Wordmark in Plus Jakarta Sans SemiBold; glyph is a ring with an offset dot.
- **Color roles** (light / dark), all 12 required by SPEC.md §5:

| Role | Light | Dark |
|---|---|---|
| primary | `#5B4BE0` | `#8B7DF0` |
| secondary | `#0F172A` | `#E2E8F0` |
| accent | `#22D3EE` | `#22D3EE` |
| background | `#FBFBFD` | `#0B0B10` |
| surface | `#FFFFFF` | `#15151D` |
| card | `#FFFFFF` | `#1B1B25` |
| textPrimary | `#16161D` | `#F5F5F7` |
| textSecondary | `#6B7280` | `#9AA0AA` |
| border | `#EAEAEF` | `#2A2A36` |
| success | `#16A34A` | `#4ADE80` |
| warning | `#F59E0B` | `#FBBF24` |
| error | `#E5484D` | `#F87171` |

- **Typography**: Plus Jakarta Sans (display/heading), Inter (body/UI/metadata).
  Display 30/700, Heading 20/600, Body 15/400, Caption 13/400, Button 15/600, Metadata 12/500.
  Line-height 1.35 body, 1.2 headings.
- **Spacing** (4-pt): `xs 4, sm 8, md 12, lg 16, xl 24, xxl 32, xxxl 48`.
- **Radius**: `sm 8, md 12, lg 16, pill 999`. **Shadow**: one elevation token
  (`y 4, blur 16, rgba(15,15,25,0.08)`).
- **Feed card**: edge-to-edge, media in `radius.md`, a 3px `privacy hairline` on the
  card's leading edge instead of a text privacy row; single icon action row; like
  animates (reanimated spring scale 1→1.25→1 + color fill).
- **Stories** (M2): rounded-rect cards, gradient ring (primary→accent) for unseen;
  viewer with segmented top progress bars, tap-forward / hold-pause / swipe-dismiss.
- **Motion**: `react-native-reanimated`, 200–250ms ease-out screen/element transitions,
  spring on interactive controls, skeleton shimmer on load. Image containers reserve
  space by aspect ratio to prevent layout jump.
- **Components (M1)**: `Button` (variants: primary/secondary/ghost/danger; sizes sm/md/lg;
  loading state), `IconButton`, `TextField` (label, error, helper, secure toggle),
  `Card`, `Avatar` (sizes + fallback initials), `Badge`, `Tabs`, `BottomSheet`, `Modal`,
  `Toast` (via `useUiStore`), `Skeleton`, `EmptyState` (icon + title + body + action),
  `Divider`, `Chip`, `ScreenContainer` (safe-area + keyboard-aware wrapper).

---

## 8. Media

`StorageService` interface:

```java
StoredFile store(MultipartFile file, String keyPrefix);   // returns { key, url }
void delete(String key);
Resource load(String key);
```

`LocalStorageService` writes under `${storage.local.dir:./uploads}/<keyPrefix>/<uuid.ext>`,
serves via `GET /api/media/{keyPrefix}/{filename}` (or Spring static resource handler).
Allowed types: `image/jpeg,image/png,image/webp` (≤5 MB), `video/mp4` (≤50 MB, stored
only — no transcoding in M1). Swap to S3/MinIO later by adding `S3StorageService` and a
`@ConditionalOnProperty` selector.

---

## 9. Seed Data

`SeedDataRunner` (`ApplicationRunner`, guarded by `app.seed.enabled=true`, default true in
`dev` profile) creates when the DB is empty:

- 12 users (`alice`, `ben`, `chloe`, … password `Password123!`), varied avatars/bios.
- ~40 posts across users, mix of text-only and 1–3 images, varied privacy, timestamps
  spread over 14 days.
- ~90 comments (some threaded), ~150 likes, ~15 shares.
- Friendship graph: a connected component so `suggestions` returns results;
  a few PENDING requests targeting `alice`.
- ~20 notifications for `alice` (mix of read/unread).

Media for seed: a handful of bundled sample images copied into `./uploads/seed/` on first run.

---

## 10. Validation & Error Handling

**Backend**: Bean Validation on every request DTO (`@NotBlank`, `@Email`, `@Size`,
`@Pattern` for username `^[a-z0-9_]{3,20}$`, password `min 8, ≥1 letter ≥1 digit`).
`@RestControllerAdvice` maps `MethodArgumentNotValidException` → 400 + `fieldErrors`,
`ResourceNotFoundException` → 404, `ConflictException` → 409, `AccessDeniedException` → 403,
`AuthenticationException` → 401, catch-all → 500 (message hidden in prod profile).

**Mobile**: form validation mirrors backend rules (`lib/validation.ts`); API errors
surfaced via `Toast` + inline field errors; every list screen has explicit
loading (Skeleton) / empty (EmptyState) / error (retry) states; network failure shows a
retry affordance.

---

## 11. Security

BCrypt, JWT, refresh rotation, method + URL authorization, Bean Validation, CORS
(`app.cors.allowed-origins`, defaulting to Expo dev origins), no secrets in logs.
Logging filter redacts `Authorization` header and any `password`/`token` field.
`spring.jpa.open-in-view=false`.

---

## 12. Verification (per milestone)

Backend: `mvn -q clean test` then `mvn -q clean package`; app boots against local MySQL,
Swagger reachable, auth + one protected endpoint exercised via `curl`.
Mobile: `npm install`, `npx tsc --noEmit` (zero errors), `npx expo start` boots,
navigation works, feed loads from the running backend.

---

## 13. Global Constraints (copied verbatim into every plan)

- Mobile: **React Native + TypeScript + Expo**. React Navigation. Zustand where
  appropriate. Axios for API. **No web app. No Next.js. No plain ReactJS. No Flutter.**
  Targets **Android and iOS**.
- Backend: **Java 21**, Spring Boot, Spring Web, Spring Security, Spring Data JPA,
  Hibernate, **MySQL**, JWT auth, **Maven**, REST, Bean Validation, Swagger/OpenAPI.
- DB local dev defaults: host `localhost`, port `3306`, user `root`, password
  `1234567890`, database `social_network`. **Credentials live in `application.yml` /
  env vars — never hard-coded through the source.**
- Every table has PK, appropriate FKs, indexes, unique constraints, `created_at`,
  `updated_at`.
- DTOs at controller boundary — **never serialize JPA entities**. No unnecessary
  bidirectional relationships.
- Never store plaintext passwords. Never return passwords. Never log passwords, JWTs,
  refresh tokens, or sensitive personal data.
- Code quality: SOLID, clean code, separation of concerns, service + repository layers,
  no business logic in controllers, no giant files, no duplicated code.
- UI/UX is designed by the implementer per §7 — do not ask the user for visual choices.
