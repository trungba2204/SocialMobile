# M4 — Real Stories + Feed Visibility Fix

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Replace the mock Stories feature with a real REST-backed Story subsystem (Spring Boot + MySQL + storage + React Native), and fix the Home feed so a friendless user does NOT see strangers' posts.

**Investigation findings (controller, before this plan):**
- Mobile runtime mock = EXACTLY `@/mock/stories.ts`, imported only by `mobile/src/features/home/components/StoriesRail.tsx` and `mobile/src/features/stories/StoryViewerScreen.tsx`. Everything else (posts, comments, friends, notifications, search, messages, profile) already calls real `@/api/*`. Confirmed by `grep -rn "@/mock/" mobile/src` → only those 2 files.
- Messaging is real as of M3 (`@/api/conversations` + backend `com.socialapp.conversation`). A brand-new user has no seeded conversations → `GET /api/conversations` returns empty. Re-verify in Task 4, do not re-implement.
- Avatar/cover upload verified working end-to-end this session (server URL persisted to `users.avatar_url`, survives re-login). Re-verify in Task 4, do not re-implement.
- **Feed bug:** `backend/src/main/java/com/socialapp/post/PostRepository.java` `findFeed` query is `p.author.id = :viewerId OR p.author.id in :friendIds OR p.privacy = PUBLIC` — the global-PUBLIC clause makes a friendless new user's feed full of seed users' public posts. `searchVisible` keeps the global-PUBLIC clause (correct — search spans the network); only `findFeed` changes.
- **No Story backend exists:** `find backend/src -iname "*story*"` → nothing. `NotificationType.STORY_REACTION` enum value exists but is unused.

## Global Constraints

- **Backend:** Java 21, Spring Boot 3.3, MySQL 8, Maven, Bean Validation, springdoc. Same style as existing `com.socialapp.*` packages: `Controller → Service → Repository`, DTOs at boundary (never serialize entities), FK ids stored as `Long` fields, extend `BaseEntity` (lifecycle timestamps). Cross-feature via `NotificationPort` SPI. **Schema via `ddl-auto=update`** (project-wide decision from M1 — do NOT introduce Flyway; it would be inconsistent with every other table and the M1 ruling. Add new tables to `backend/src/main/resources/db/schema-reference.sql`).
- Backend auth: current user always from `@CurrentUser AuthPrincipal principal` → `principal.userId()`. NEVER hardcode a user id.
- **Mobile:** Expo SDK 57, RN 0.86, TS strict, `@/*`→`src/*`. Axios client with single-flight refresh — DO NOT touch. `<Text>` primitive + theme tokens only. Access token memory-only. Never log tokens/passwords. Test pattern: `await renderScreen()` → `fireEvent` (no manual act) → `await waitFor`; mock async fns `jest.fn().mockResolvedValue(...)`.
- **NO mock data for any backend-supported feature. NO silent mock fallback on API failure** — loading (Skeleton) / error (ErrorState + retry) / empty (EmptyState).
- Media URLs via `resolveMediaUrl` (centralized in `Avatar.tsx`; story media needs it too since backend returns `/api/media/...` relative).
- All existing tests stay green: backend `mvn clean test` (99), mobile `npm test` (124), `tsc --noEmit` clean.
- **A brand-new user (0 friends, 0 posts, 0 stories, 0 conversations) must see: empty Stories rail (just "Add story"), empty Feed ("No posts yet"), empty Messages, empty Notifications, empty Friends.** This is the acceptance bar.

---

## Backend API contract (this plan defines it — mobile Task 3 consumes exactly this)

Base `/api`. All require `Authorization: Bearer`.

```
POST   /api/stories              multipart: part "file" (image, ≤5MB) + optional form field "caption" (≤200)   → StoryDto   (201)
GET    /api/stories              → StoryReelDto[]   (active [not expired], visible to caller = own + friends'; grouped by author; own reel first, then friends by most-recent-story desc; max 50 reels)
GET    /api/stories/{id}         → StoryDto   (403 if not visible)
DELETE /api/stories/{id}         → 204   (owner only, else 403)
POST   /api/stories/{id}/view    → 204   (record caller as a viewer; no-op if caller == owner or already viewed)
GET    /api/stories/{id}/viewers → Page<UserDto>   (owner only; who viewed this story)
```
DTOs:
```
StoryDto      { id: number; author: UserDto; mediaUrl: string; caption: string | null; createdAt: string; expiresAt: string; viewedByMe: boolean; viewerCount: number }
StoryReelDto  { author: UserDto; stories: StoryDto[]; hasUnseen: boolean }   // hasUnseen = any story with viewedByMe=false (false for own reel)
```
Entities:
```
Story extends BaseEntity        { Long authorId; String mediaUrl (len 300); String caption (len 200, nullable); Instant expiresAt;  index(authorId, expiresAt) }
StoryView extends BaseEntity     { Long storyId; Long viewerId;  UNIQUE(storyId, viewerId); index(storyId) }
```
- `expiresAt = createdAt + 24h`, set in the service on create.
- "active" = `expiresAt > now()`.
- Visibility: a story is visible to caller C if `authorId == C` OR `authorId ∈ friendIds(C)`. Reuse `FriendGraphPort.friendIds(userId)` (existing SPI, already a bean — the `friend` module implements it).
- On create: fire `NotificationPort.record(...)` to each friend? NO — stories don't notify on post (too noisy). Skip notification on create. (STORY_REACTION notification is out of scope — no reactions in M4.)
- Storage: reuse `StorageService.store(file, "stories")` → returns `StoredFile{key,url}` with url `/api/media/stories/<uuid>.<ext>` (same as avatars/posts). `MediaController` already serves `/api/media/**` (permitAll).
- Seed (`SeedDataRunner.seedStories()`): 4-6 stories spread across alice's friends (ben, chloe, deepak…), created "1-8 hours ago" so they're active, NOT expired, NOT for brand-new users. Guarded by the existing empty-DB check.

---

## Task 1: Story backend

**Files (all `backend/src/main/java/com/socialapp/story/`):**
- Create: `Story.java`, `StoryView.java`, `StoryRepository.java`, `StoryViewRepository.java`, `StoryService.java`, `StoryController.java`, `StoryMapper.java`, `dto/{StoryDto,StoryReelDto,CreateStoryRequest}.java`
- Modify: `backend/src/main/java/com/socialapp/config/SeedDataRunner.java` (add `seedStories()`), `backend/src/main/resources/db/schema-reference.sql` (2 tables)
- Test: `story/StoryServiceTest.java`, `story/StoryControllerTest.java`, `story/StoryFlowIT.java`

**Interfaces:**
- Consumes: `UserRepository`, `UserMapper`, `StorageService` (`store(MultipartFile, String keyPrefix)`), `FriendGraphPort` (`Set<Long> friendIds(long)`), `BaseEntity`. All existing beans.
- Produces the API contract above. `StoryService`:
  - `StoryDto create(long authorId, MultipartFile file, String caption)`
  - `List<StoryReelDto> activeReels(long viewerId)`
  - `StoryDto get(long storyId, long viewerId)` (403 → `ForbiddenException` if not visible)
  - `void delete(long storyId, long requesterId)` (403 if not owner)
  - `void recordView(long storyId, long viewerId)` (no-op if owner or dup — catch the unique violation or check-first)
  - `Page<UserDto> viewers(long storyId, long ownerId, Pageable)` (403 if not owner)

- [ ] **Step 1: Write `StoryServiceTest`** (Mockito): `create` stores file via `storage.store(f,"stories")`, sets `expiresAt ≈ now+24h`, saves Story, returns dto. `activeReels` for a viewer with friends {2,3}: returns reels for authors in {viewer,2,3} that have a non-expired story; expired stories excluded; own reel first; `hasUnseen` false for own reel, true when a friend story has no StoryView by viewer. `get` a story by a non-friend non-owner → `ForbiddenException`. `delete` by non-owner → `ForbiddenException`; by owner → repo delete + StoryView cleanup. `recordView` by owner → no-op (no save); by a viewer → StoryView saved; second call → no duplicate (no exception surfaced). `viewers` by non-owner → `ForbiddenException`.
- [ ] **Step 2: Run — FAIL.**
- [ ] **Step 3: Implement entities + repos.** `StoryRepository`: `@Query` "active stories by authors in :authorIds where expiresAt > :now order by authorId, createdAt asc"; `findByIdAndExpiresAtAfter`; `deleteByAuthorIdAndExpiresAtBefore` (cleanup helper, optional). `StoryViewRepository`: `existsByStoryIdAndViewerId`, `findStoryIdsViewedBy(viewerId, storyIds)`, `deleteByStoryId`, `countByStoryId`, `Page<StoryView> findByStoryId(id, pageable)`.
- [ ] **Step 4: Run repo tests — PASS.**
- [ ] **Step 5: Implement `StoryService` + `StoryMapper` + DTOs.** `activeReels`: `authorIds = friendIds(viewer) ∪ {viewer}`; fetch active stories; bulk-fetch viewed story ids for the viewer; group by author; build reels; sort own-first then by newest story desc.
- [ ] **Step 6: Run `StoryServiceTest` — PASS.**
- [ ] **Step 7: Write `StoryControllerTest`** (`@WebMvcTest` + mocked service + `WithPrincipal`, like `NotificationControllerTest`): `POST /api/stories` multipart → 201 `StoryDto`; missing file → 400; `GET /api/stories` → `StoryReelDto[]`; `DELETE /api/stories/{id}` → 204; `POST /api/stories/{id}/view` → 204; `GET /api/stories/{id}/viewers` → page.
- [ ] **Step 8: Run — FAIL.**
- [ ] **Step 9: Implement `StoryController`** (`@RequestPart("file") MultipartFile file`, `@RequestParam(value="caption",required=false) String caption`).
- [ ] **Step 10: Run — PASS.**
- [ ] **Step 11: Write `StoryFlowIT`** (`@SpringBootTest` H2, real beans): user A + friend B + stranger C. A creates a story (use a `MockMultipartFile` PNG). `activeReels(B)` includes A's story; `activeReels(C)` does NOT. `recordView` by B → `activeReels(B)` `hasUnseen` flips to false for A's reel. `get(storyId, C)` → throws. `delete` by A → gone from `activeReels(B)`. An expired story (set `expiresAt` in the past via the entity) is excluded.
- [ ] **Step 12: Run — PASS.**
- [ ] **Step 13: `seedStories()` in SeedDataRunner** + `schema-reference.sql`.
- [ ] **Step 14: `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn -B clean test`** — all green (99 → ~115).
- [ ] **Step 15: Boot vs MySQL + curl-verify.** DROP+recreate `social_network` if schema conflicts. Login alice → `GET /api/stories` (seeded friend reels) → `POST /api/stories` with a real image file → 201 → `GET /api/stories` shows alice's reel first → `mysql -e "SELECT id,author_id,media_url,expires_at FROM stories ORDER BY id DESC LIMIT 3"` → the file exists under `backend/uploads/stories/` → `POST /api/stories/{id}/view` as ben → `mysql -e "SELECT * FROM story_views"` → `DELETE` as alice → 204 → row gone. Register a NEW user → `GET /api/stories` → `[]`. Stop backend.
- [ ] **Step 16: Commit** ON `main` — `feat(backend): stories (24h, friend-visibility, upload, views, seed)`

---

## Task 2: Feed visibility fix (friendless user sees no strangers' posts)

**Files:**
- Modify: `backend/src/main/java/com/socialapp/post/PostRepository.java` — `findFeed` query only
- Modify: `backend/src/test/java/com/socialapp/post/PostRepositoryTest.java` — the feed expectations
- (leave `searchVisible` unchanged — search spanning PUBLIC posts network-wide is correct)

**Interface:** `findFeed(viewerId, friendIds, Pageable)` signature unchanged; semantics change.

- [ ] **Step 1: Update `PostRepositoryTest`** — the feed for a user X with friend F and stranger S must contain: X's own posts (all privacies) + F's PUBLIC and FRIENDS posts; must NOT contain: F's PRIVATE posts, ANY of S's posts (even PUBLIC). Update the existing `feedIncludesOwnFriendsAndPublicOnly` test (rename to `feedIsOwnPlusFriendsRespectingPrivacy`) and assertions.
- [ ] **Step 2: Run — FAIL** (old query returns S's public posts).
- [ ] **Step 3: Change `findFeed` query** to:
  ```
  select p from Post p
  where p.author.id = :viewerId
     or (p.author.id in :friendIds and p.privacy <> com.socialapp.post.Privacy.PRIVATE)
  order by p.createdAt desc
  ```
  (`:friendIds` always contains the `-1L` sentinel from `PostService.friendIdsOrSentinel` so `in` is never empty — existing pattern, unchanged.)
- [ ] **Step 4: Run `PostRepositoryTest` — PASS.**
- [ ] **Step 5: Full backend suite** `mvn -B clean test` — green (check no other test asserted the old global-PUBLIC feed behavior; fix any that did).
- [ ] **Step 6: curl-verify** — a fresh registered user: `GET /api/posts` → `totalElements: 0`. alice: `GET /api/posts` → only her + her friends' non-private posts (no posts authored by users she isn't friends with). Document counts.
- [ ] **Step 7: Commit** ON `main` — `fix(backend): feed is own + friends only, not global public`

---

## Task 3: Mobile Stories — wire to the real API, remove the mock, build Add/View/Delete

**Files:**
- Create: `mobile/src/api/stories.ts`
- Modify: `mobile/src/api/types.ts` (`StoryDto`, `StoryReelDto`), `mobile/src/features/home/components/StoriesRail.tsx`, `mobile/src/features/stories/StoryViewerScreen.tsx`, `mobile/src/features/stories/components/StoryProgressBar.tsx` (types only if needed), `mobile/src/navigation/types.ts` (`StoryViewerParams` → `{ authorId: number }` or reel index into fetched data — see below)
- Create: `mobile/src/features/stories/AddStoryScreen.tsx` (or a modal) + register in `AppNavigator`
- **Delete:** `mobile/src/mock/stories.ts`
- Test: `mobile/src/api/__tests__/stories.test.ts`, rewrite `mobile/src/features/stories/__tests__/StoryViewerScreen.test.tsx`, add `StoriesRail.test.tsx`

**Interfaces:**
- `@/api/stories`:
  - `reels(): Promise<StoryReelDto[]>`  → `GET /api/stories`
  - `create(asset: PickedAsset, caption?: string): Promise<StoryDto>`  → `POST /api/stories` multipart (`file` part + `caption` field). Use `buildFilePart` from `@/api/media` like `users.uploadAvatar`.
  - `get(id: number): Promise<StoryDto>`
  - `remove(id: number): Promise<void>`  → `DELETE /api/stories/{id}`
  - `markViewed(id: number): Promise<void>`  → `POST /api/stories/{id}/view`
  - `viewers(id: number, page: number): Promise<Page<UserDto>>`
- `StoryDto` / `StoryReelDto` exactly as Task 1's contract.

- [ ] **Step 1: `stories.test.ts`** (axios-mock-adapter): each fn → right method/URL/body; `create` → multipart FormData with a `file` part.
- [ ] **Step 2: Run — FAIL.** Implement `api/stories.ts` + the 2 DTO types.
- [ ] **Step 3: Run — PASS.**
- [ ] **Step 4: `StoriesRail.test.tsx`** — mock `stories.reels` → renders "Add story" first, then a card per reel (author displayName, avatar via `<Avatar>`, unseen ring when `hasUnseen`); empty reels → just "Add story"; tapping "Add story" → navigates to AddStory; tapping a reel → navigates to StoryViewer with that author's id/index; API error → the rail renders just "Add story" (NOT a crash, NOT mock) + a small retry affordance is acceptable.
- [ ] **Step 5: Run — FAIL.**
- [ ] **Step 6: Rewrite `StoriesRail`** — it owns a `useResource(stories.reels, [])` fetch (or a lightweight `useFocusEffect` fetch). `MOCK_STORIES` import gone. First item = "Add story" (`+` avatar) → `navigation.navigate('AddStory')`. Then reels. Tap a reel → `navigation.navigate('StoryViewer', { authorId })` — pass the whole reels array via a param OR (cleaner) StoryViewer refetches `stories.reels()` itself and finds the requested author. Choose: **StoryViewer refetches** (keeps params tiny, always fresh).
- [ ] **Step 7: Rewrite `StoryViewerScreen`** — `route.params: { authorId: number }`. On mount: `stories.reels()` → find the reel for `authorId` → its `stories[]` drive the segmented progress + auto-advance + tap-zones + hold-pause (all existing logic, just fed from real data). Media = `resolveMediaUrl(story.mediaUrl)` via `<Image>` / `<Avatar>`. On each story shown: `stories.markViewed(story.id)` (fire-and-forget). If the reel is the caller's own → show a "⋯" → Delete (`stories.remove(id)` → confirm modal → on success advance/close + the rail refetches on focus) and a viewer count / "Seen by N". After last story → `goBack()`. Loading = full-screen spinner; fetch error = ErrorState with a close button; reel-not-found = `goBack()`.
- [ ] **Step 8: `AddStoryScreen`** (modal, `presentation:'modal'`): on open, `ImagePicker.launchImageLibraryAsync({ mediaTypes:'images', quality:0.8, allowsMultipleSelection:false })`. Show the picked image as a full-bleed preview + an optional caption `TextField` + a "Share story" `Button`. On share: `setUploading(true)` (disable button, spinner) → `stories.create(asset, caption)` → success → `showToast('Story shared')` + `navigation.goBack()` (the rail refetches on focus) → failure → error toast, stay, re-enable. Double-submit guarded. If the user cancels the picker with no prior image → `navigation.goBack()`.
- [ ] **Step 9: Register `AddStory` + updated `StoryViewer` params** in `AppNavigator` + `navigation/types.ts`. `StoriesRail`'s existing callers unaffected.
- [ ] **Step 10: Delete `mobile/src/mock/stories.ts`.** `grep -rn "mock/stories\|MOCK_STORIES\|MockStory" mobile/src` → zero hits. `mobile/src/mock/` is now empty → delete the dir.
- [ ] **Step 11: Rewrite `StoryViewerScreen.test.tsx`** + keep `StoryProgressBar` behavior. Real assertions: mock `stories.reels` → viewer shows author's first story image → timer advance → 2nd story → last → `goBack`; `stories.markViewed` called per story; own reel shows a Delete affordance that calls `stories.remove`.
- [ ] **Step 12: `npx jest` all green pristine; `npx tsc --noEmit` clean; `npx expo export --platform ios` bundles.**
- [ ] **Step 13: Commit** ON `main` — `feat(mobile): real stories (rail + viewer + add + delete via REST API), remove mock`

---

## Task 4: End-to-end verification — brand-new user sees nothing fake

**Files:** Modify only if a gap is found. Update `mobile/README.md` + root `README.md` (Stories now real; the only mock is gone; feed is friends-scoped).

- [ ] **Step 1: Mock audit** — `grep -rniE "mock|fake|dummy|sample|hardcoded" mobile/src --include=*.ts --include=*.tsx | grep -v __tests__ | grep -v "\.test\."` → classify every hit. Expected: ZERO runtime mock (Stories mock now deleted). The `uploadErrorMessage(e, fallback)` param name is not mock. Document the full list.
- [ ] **Step 2: `mobile/src/mock/` directory is gone.** `ls mobile/src/mock` → not found. `grep -rn "@/mock" mobile/src` → zero.
- [ ] **Step 3: Catch-block audit** — every `catch` in `mobile/src/features` + `mobile/src/api`: none returns canned/hardcoded data. Document.
- [ ] **Step 4: Backend** `mvn -B clean test` green; `mvn -B clean package` jar builds.
- [ ] **Step 5: Mobile** `npx tsc --noEmit` 0 errors; `npx jest` all green (count); `npx expo export --platform ios` bundles.
- [ ] **Step 6: BRAND-NEW USER e2e** (start backend dev+seed; script it):
  - `POST /api/auth/register` a fresh user → `GET /api/auth/me`
  - `GET /api/posts` → `totalElements == 0`  ← **feed empty for friendless user**
  - `GET /api/stories` → `[]`  ← **no stories for friendless user**
  - `GET /api/conversations` → `totalElements == 0`
  - `GET /api/notifications` → `totalElements == 0`
  - `GET /api/friends` → `totalElements == 0`
  - Then: this user creates a post → `GET /api/posts` → shows ONLY their own post. Creates a story (multipart) → `GET /api/stories` → shows only their own reel; `SELECT * FROM stories WHERE author_id = <new>` + file on disk. `POST /api/stories/{id}/view` → self-view is a no-op (`SELECT count(*) FROM story_views WHERE story_id=<s>` == 0). `DELETE` the story → 204, row gone, `GET /api/stories` → `[]`.
  - Friend the new user with alice (request + accept). Now `GET /api/posts` for the new user shows alice's non-private posts; `GET /api/stories` shows alice's friends'-visible active stories (if alice has one — create one as alice). Confirms visibility is relationship-driven.
  - Re-login the new user (fresh `POST /api/auth/login`) → `GET /api/stories` still shows the same (persisted). Paste ALL evidence.
- [ ] **Step 7: Token grep** — `grep -rn "console\." mobile/src | grep -v __tests__` → none logging a token; backend logback redaction intact.
- [ ] **Step 8: Update both READMEs.** Commit — `docs: stories are real; feed is friend-scoped; M4 verification`

---

## Self-Review

- Stories: backend built (entity/repo/service/controller/mapper/dto/seed + 3 test classes), mobile wired (api/stories, rail from API, viewer from API + view-tracking + delete, AddStory upload), mock deleted, e2e verified (upload persists file+row, survives re-login, expires, delete works, friendless user sees `[]`). ✓
- Feed: `findFeed` no longer includes global PUBLIC → friendless user's feed is empty; friend's non-private posts included; stranger's posts excluded. `searchVisible` unchanged (correct). ✓
- Messages: already real (M3) — Task 4 re-verifies a new user sees empty, no re-implementation. ✓
- Avatar/cover: already verified — Task 4 re-verifies persistence, no re-implementation. ✓
- No mock runtime data anywhere after Task 3 (Stories was the last one). No silent fallback (Task 4 catch audit). ✓
- Auth: every endpoint uses `@CurrentUser` principal; no hardcoded ids (Task 1 uses `principal.userId()` throughout; Task 4 spot-checks). ✓
- ddl-auto not Flyway — deliberate, consistent with the entire existing schema; documented.
- Tests gated in every task (backend mvn, mobile jest + tsc).

## Execution: subagent-driven, 4 tasks, review each.
