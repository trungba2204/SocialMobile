# M3 — Real Messaging + Mock-Data Audit

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Replace the mock Messages feature with a real REST-backed Conversation/Message subsystem (Spring Boot + MySQL + React Native), and verify every backend-supported mobile feature already renders real database data (not mock).

**Investigation findings (done by controller before this plan):**
- Backend has **NO** messaging classes (`grep` for conversation/message/chat → nothing). Must be built.
- Mobile runtime mock usage is limited to exactly two areas: `@/mock/stories.ts` (Stories — **no backend, stays mock, allowed**) and `@/mock/conversations.ts` via `@/features/messages/messagesData.ts` (Messaging — **replace with real API**). Auth, Profile, Feed, Posts, Comments, Friends, Notifications, Search already call real `@/api/*` → real backend (confirmed by the M1-Mobile final review).
- Avatar/cover upload **already works end-to-end**: mobile `EditProfileScreen` → `users.uploadAvatar` → `POST /api/users/me/avatar` (multipart `file`) → `LocalStorageService` writes file + `user.avatarUrl` persisted to MySQL → `/auth/me` returns it → survives restart (bootstrap re-fetches `/auth/me`). Verified via curl: upload returned `{"url":"/api/media/avatars/<uuid>.png"}`, `users.avatar_url` row updated in MySQL. Task 3 is **verify + harden error states**, not rebuild.

## Global Constraints

- **Backend:** Java 21, Spring Boot 3.3, Spring Web/Security/Data JPA, MySQL 8, Maven, Bean Validation, springdoc. Same layering/style as existing `com.socialapp.*` feature packages: `Controller → Service → Repository`, DTOs at the boundary (never serialize entities), `BaseEntity` (lifecycle timestamps), feature-first package. Cross-feature calls via existing SPI (`NotificationPort.record(recipientId, actorId, NotificationType, entityType, entityId)`).
- **Mobile:** Expo SDK 57, RN 0.86, TS strict, `@/*`→`src/*`. Axios client with single-flight refresh (do not touch it). `<Text>` primitive + theme tokens only. Access token memory-only, refresh in expo-secure-store. Never log tokens/passwords. Test pattern: `await renderScreen()` → `fireEvent` (no manual act) → `await waitFor(expect)`; mock async fns `jest.fn().mockResolvedValue(...)`.
- **No mock data in any runtime path that has a backend.** Stories may stay mock (no backend). Messaging must NOT stay mock.
- **No silent mock fallback on API failure** — show loading/error/empty states.
- Media URLs: `resolveMediaUrl` (already centralized in `Avatar.tsx` + used by `PostMediaGrid`). Message image attachments (if any) go through it too.
- REST first. STOMP/WebSocket is explicitly **out of scope** (M4) — REST + poll-on-focus + pull-to-refresh is the M3 delivery.
- All existing tests stay green: backend `mvn test` (81), mobile `npm test` (109), `tsc --noEmit` clean.

---

## Backend API contract (this plan defines it — mobile consumes exactly this)

Base `/api`. All require `Authorization: Bearer`. Error + pagination envelopes identical to existing endpoints.

```
GET   /api/conversations                     ?page&size   → Page<ConversationDto>   (my conversations, most-recent-activity first)
POST  /api/conversations                     { peerUserId: number }  → ConversationDto   (get-or-create the 1:1 conversation with that user; 200 if exists, 201 if created; 400 if peer==self or peer not found)
GET   /api/conversations/{id}                → ConversationDto        (403 if caller not a member)
GET   /api/conversations/{id}/messages       ?page&size   → Page<MessageDto>   (newest first — DESC by createdAt; mobile inverts)
POST  /api/conversations/{id}/messages       { content: string (1..4000) }  → MessageDto   (201; also: bumps conversation updatedAt, sets sender's lastReadMessageId to the new message, increments the other member's unreadCount, fires NotificationType.MESSAGE to the other member with entityType="CONVERSATION", entityId=conversationId)
POST  /api/conversations/{id}/read           → 204   (set caller's lastReadMessageId to latest message, unreadCount → 0)
```

DTOs:
```
ConversationDto {
  id: number;
  peer: UserDto;                       // the OTHER member (1:1 only in M3)
  lastMessage: { id: number; content: string; senderId: number; createdAt: string } | null;
  unreadCount: number;                 // caller's ConversationMember.unreadCount
  updatedAt: string;
}
MessageDto { id: number; conversationId: number; sender: UserDto; content: string; createdAt: string }
```

Entities:
```
Conversation extends BaseEntity   { boolean group=false; String title (nullable) }
ConversationMember extends BaseEntity {
  Long conversationId; Long userId; Long lastReadMessageId (nullable); int unreadCount=0;
  UNIQUE(conversationId, userId); index(userId)
}
Message extends BaseEntity   { Long conversationId; Long senderId; @Column(length=4000) String content; index(conversationId, createdAt) }
```
1:1 dedupe: `POST /api/conversations` finds an existing conversation that has exactly the caller + peer as members; else creates one + two `ConversationMember` rows.

---

## Task 1: Messaging backend (entities, repos, service, controller, DTOs, mapper, notification wiring, seed, tests)

**Files (all under `backend/src/main/java/com/socialapp/conversation/`):**
- Create: `Conversation.java`, `ConversationMember.java`, `Message.java`
- Create: `ConversationRepository.java`, `ConversationMemberRepository.java`, `MessageRepository.java`
- Create: `ConversationService.java`, `ConversationController.java`, `ConversationMapper.java`
- Create: `dto/{ConversationDto,MessageDto,CreateConversationRequest,SendMessageRequest,LastMessageDto}.java`
- Modify: `backend/src/main/java/com/socialapp/config/SeedDataRunner.java` — add `seedConversations()` (2-3 conversations for `alice` with 5-10 messages each, from her friends; a couple unread)
- Modify: `backend/src/main/resources/db/schema-reference.sql` — add the 3 tables
- Test: `conversation/ConversationServiceTest.java`, `conversation/ConversationControllerTest.java`, `conversation/MessageFlowIT.java` (`@SpringBootTest` H2 — send a message end-to-end, assert persisted + notification created + unread incremented)

**Interfaces:**
- Consumes: `UserRepository`, `UserMapper`, `NotificationPort` (all existing), `BaseEntity`, `NotificationType.MESSAGE` (exists).
- Produces: the API contract above. `ConversationService`:
  - `Page<ConversationDto> listMine(long userId, Pageable)`
  - `ConversationDto getOrCreateDirect(long userId, long peerUserId)`
  - `ConversationDto get(long conversationId, long userId)` (403 → `ForbiddenException` if not a member)
  - `Page<MessageDto> messages(long conversationId, long userId, Pageable)`
  - `MessageDto send(long conversationId, long userId, String content)`
  - `void markRead(long conversationId, long userId)`

- [ ] **Step 1: Write `ConversationServiceTest`** (Mockito): `getOrCreateDirect` creates a Conversation + 2 members when none exists; returns the existing one on a second call (dedupe); `peerUserId == userId` → `ConflictException`/`ValidationException`; unknown peer → `ResourceNotFoundException`. `send` → saves Message, bumps conversation, sets sender lastRead, increments the OTHER member's unreadCount, calls `notifications.record(peerId, senderId, MESSAGE, "CONVERSATION", conversationId)`. `get`/`messages` by a non-member → `ForbiddenException`. `markRead` → caller's unreadCount 0 + lastReadMessageId = latest.
- [ ] **Step 2: Run — FAIL.**
- [ ] **Step 3: Implement entities + repositories.** `ConversationMemberRepository`: `findByConversationIdAndUserId`, `findByUserId`, `@Query` for "conversation id shared by exactly users A and B". `MessageRepository`: `Page<Message> findByConversationIdOrderByCreatedAtDesc`, `Optional<Message> findTopByConversationIdOrderByCreatedAtDesc`, `countByConversationId`.
- [ ] **Step 4: Run repo-touching tests — PASS.**
- [ ] **Step 5: Implement `ConversationService` + `ConversationMapper` + DTOs.** `listMine` orders by `conversation.updatedAt DESC`. `ConversationMapper.toDto` resolves the peer (the member whose userId != caller), the last message (repo `findTop...`), and the caller's `unreadCount`.
- [ ] **Step 6: Run `ConversationServiceTest` — PASS.**
- [ ] **Step 7: Write `ConversationControllerTest`** (`@WebMvcTest` + mocked service, `WithPrincipal` helper like existing controller tests): each of the 6 routes → correct status + body shape; `POST /conversations` returns `ConversationDto`; `POST /conversations/{id}/messages` blank content → 400 fieldErrors; non-member GET → 403.
- [ ] **Step 8: Run — FAIL.**
- [ ] **Step 9: Implement `ConversationController`.** `@Valid` bodies. `markRead`/nothing → 204.
- [ ] **Step 10: Run — PASS.**
- [ ] **Step 11: Write `MessageFlowIT`** (`@SpringBootTest`, `@ActiveProfiles("test")` H2, real service beans): create users, `getOrCreateDirect`, `send` twice, assert `MessageRepository.count()==2`, the recipient's `ConversationMember.unreadCount==2`, `NotificationRepository` has 2 `MESSAGE` notifications for the recipient; `markRead` → unread 0.
- [ ] **Step 12: Run — PASS.**
- [ ] **Step 13: Implement `seedConversations()` in `SeedDataRunner`** (guarded by the existing empty-DB check). Also update `schema-reference.sql`.
- [ ] **Step 14: Run full backend suite** `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn -q clean test` — all green (was 81, now ~95+).
- [ ] **Step 15: Boot against MySQL + curl-verify** (dev profile, seed): login alice → `GET /api/conversations` (seeded) → `POST /api/conversations {peerUserId: <ben's id>}` → `POST .../messages {content:"hi"}` → `GET .../messages` shows it → `mysql -e "SELECT * FROM messages"` shows the row → `GET /api/notifications` for ben shows a MESSAGE notification. Stop backend.
- [ ] **Step 16: Commit** — `feat(backend): messaging (conversations, messages, REST API, seed)`

---

## Task 2: Wire mobile Messages to the real API + remove the mock

**Files:**
- Create: `mobile/src/api/conversations.ts`
- Modify: `mobile/src/api/types.ts` — add `ConversationDto`, `MessageDto`, `LastMessageDto`
- Modify: `mobile/src/features/messages/ConversationListScreen.tsx`, `ChatScreen.tsx`, `components/{ConversationRow,MessageBubble,ChatComposer}.tsx`
- Modify: `mobile/src/navigation/types.ts` — `MessagesStackParamList.Chat` param becomes `{ conversationId: number }` (was string); add optional `{ peerUserId?: number }` for the "start a chat with X" entry
- Modify: `mobile/src/navigation/resolveNotification.ts` — `MESSAGE` → `nav.navigate('Messages', { screen: 'Chat', params: { conversationId: n.entityId } })`
- Modify: `mobile/src/features/friends/FriendsScreen.tsx` + `mobile/src/features/profile/ProfileScreen.tsx` — "Message" button → `conversations.getOrCreate(peerUserId)` → `navigation.navigate('Messages', { screen: 'Chat', params: { conversationId } })`
- **Delete:** `mobile/src/mock/conversations.ts`, `mobile/src/features/messages/messagesData.ts`
- Test: rewrite `mobile/src/features/messages/__tests__/ChatScreen.test.tsx`; add `ConversationListScreen.test.tsx`, `src/api/__tests__/conversations.test.ts`

**Interfaces:**
- `@/api/conversations`:
  - `list(page: number, size?: number): Promise<Page<ConversationDto>>`  → `GET /conversations`
  - `getOrCreate(peerUserId: number): Promise<ConversationDto>`  → `POST /conversations { peerUserId }`
  - `get(id: number): Promise<ConversationDto>`
  - `messages(id: number, page: number, size?: number): Promise<Page<MessageDto>>`
  - `send(id: number, content: string): Promise<MessageDto>`
  - `markRead(id: number): Promise<void>`
- `ConversationDto` / `MessageDto` exactly as Task 1's contract.

- [ ] **Step 1: Write `conversations.test.ts`** (axios-mock-adapter, like `posts.test.ts`): each fn hits the right method+URL+body; `list(0)` → `?page=0&size=20`; `send(3,'hi')` → `POST /conversations/3/messages {content:'hi'}` returns parsed `MessageDto`.
- [ ] **Step 2: Run — FAIL.** Implement `api/conversations.ts` + the two DTO types.
- [ ] **Step 3: Run — PASS.**
- [ ] **Step 4: Write `ChatScreen.test.tsx`** (real pattern): mock `conversations.get` + `conversations.messages` → renders seeded messages (sender name / bubble alignment by `sender.id === me`); type + send → `conversations.send(id, text)` called → the new message appears right-aligned → composer clears. Mock `conversations.markRead` (called on mount/focus).
- [ ] **Step 5: Run — FAIL.**
- [ ] **Step 6: Implement `ChatScreen`:** `route.params.conversationId: number`. `useResource(() => conversations.get(id), [id])` for header (peer name/avatar). `usePagedQuery` (or a local list + `conversations.messages`) for the inverted message list. `MessageBubble` mine = `sender.id === useAuthStore.user.id`. On send: optimistic append (temp `MessageDto`) → `conversations.send` → reconcile with returned dto → revert + error toast on failure. On focus + after send: `conversations.markRead(id)`. Poll: `useFocusEffect` refetch messages every time the screen focuses; optional `setInterval(refetch, 5000)` while focused (clear on blur). Loading = Skeleton, error = ErrorState + retry, empty = EmptyState ("Say hello").
- [ ] **Step 7: Write `ConversationListScreen.test.tsx`:** mock `conversations.list` → rows render (peer name, last message, unread badge); tap → `navigation.navigate('Messages', { screen: 'Chat', params: { conversationId: <id> } })`; empty → EmptyState; error → ErrorState.
- [ ] **Step 8: Run — FAIL.**
- [ ] **Step 9: Implement `ConversationListScreen`:** `usePagedQuery(conversations.list)`. `ConversationRow` props switch to `ConversationDto` (peer.displayName, peer.avatarUrl via Avatar, lastMessage?.content, `relativeTime(updatedAt)`, unreadCount badge). Pull-to-refresh + `useFocusEffect` refetch.
- [ ] **Step 10: Update `ConversationRow`, `MessageBubble`, `ChatComposer`** to the real DTO types (remove `MockConversation`/`MockMessage` imports). `ChatComposer` unchanged in behavior (text + send; attach stays disabled `// M4`).
- [ ] **Step 11: Wire the entry points:** `resolveNotification` MESSAGE case; Friends "Message" button; Profile "Message" button (FRIENDS status only) — all via `conversations.getOrCreate(peerUserId)` then navigate. `MessagesStackParamList.Chat` param type → `{ conversationId: number }`.
- [ ] **Step 12: Delete `mobile/src/mock/conversations.ts` + `mobile/src/features/messages/messagesData.ts`.** `grep -rn "messagesData\|MockConversation\|MockMessage\|mock/conversations"` mobile/src → zero hits (outside deleted files).
- [ ] **Step 13: `npx jest` all green pristine; `npx tsc --noEmit` clean; `npx expo export --platform ios` bundles.**
- [ ] **Step 14: Commit** — `feat(mobile): real messaging (conversations + chat via REST API), remove mock`

---

## Task 3: End-to-end verification sweep + mock audit + avatar/cover hardening

**Files:**
- Modify (only if a gap is found): `mobile/src/features/profile/EditProfileScreen.tsx` (error/invalid-file/failure states for avatar+cover), any screen missing a real-data path
- Modify: `mobile/README.md` — update the "mock data" section (only Stories remains mock; messaging is now real), refresh the status line
- Modify: root `README.md` — messaging now real; note STOMP is M4

**Interfaces:** produces a verified, mock-free (except Stories) app.

- [ ] **Step 1: Mock audit.** `grep -rniE "mock|fake|dummy|hardcoded|placeholder" mobile/src --include=*.ts --include=*.tsx | grep -v __tests__ | grep -v "\.test\."` — classify every hit. Acceptable: `@/mock/stories.ts` + its 2 importers (Stories, no backend), `// M4` attach-disabled comments, test-infra. **Unacceptable:** any hit implying runtime mock for a backend-supported feature → fix. Document the classified list in the report.
- [ ] **Step 2: Confirm no silent mock fallback.** Grep every `catch` in `mobile/src/features` and `mobile/src/api` — none may substitute canned data; all must set an error state / rethrow. Document.
- [ ] **Step 3: Avatar/cover hardening.** In `EditProfileScreen`: verify pick → `users.uploadAvatar`/`uploadCover` → `patchUser` (avatar) / local+save (cover); the displayed image uses the RETURNED url (through `resolveMediaUrl`/Avatar), NOT the local picker `uri`, once upload resolves. Add: invalid-file rejection surfaces a toast (backend returns 400 for non-image); upload failure surfaces a toast and does NOT patch the user; a spinner shows during upload. Add/extend `EditProfileScreen.test.tsx` for the failure path.
- [ ] **Step 4: Backend suite** `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn -q clean test` — green. `mvn -q clean package` — jar builds.
- [ ] **Step 5: Mobile** `npx tsc --noEmit` (0 errors), `npx jest` (all green, count), `npx expo export --platform ios` (bundles).
- [ ] **Step 6: Full end-to-end against MySQL** — start backend (dev, seed), then a script that exercises the real API the way the app does and checks MySQL after each mutation. Cover the user's checklist: register a NEW user via `/api/auth/register` → `SELECT * FROM users` shows it; login → `/api/auth/me`; create post (multipart) → `SELECT * FROM posts`; `GET /api/posts` shows it; like → `SELECT * FROM post_likes`; comment → `SELECT * FROM comments`; share → `SELECT * FROM shares`; friend request between two users → accept → `SELECT * FROM friendships`; `getOrCreate` conversation + send message → `SELECT * FROM messages` + `SELECT * FROM conversation_members` unread; avatar upload → `SELECT avatar_url` + re-login shows it persisted; cover upload → `SELECT cover_url`; `GET /api/notifications` shows the like/comment/message notifications; `GET /api/search/users?q=` + `/search/posts?q=` return DB rows. Paste all evidence into the report. Stop backend.
- [ ] **Step 7: Token-safety grep** — `grep -rn "console\." mobile/src | grep -v __tests__` → none near token/password; logback redaction still present backend-side. Document.
- [ ] **Step 8: Update `mobile/README.md` + root `README.md`.**
- [ ] **Step 9: Commit** — `docs: messaging is real; M3 verification`

---

## Self-Review

- Messaging: backend built (entities/repos/service/controller/DTOs/mapper/seed/tests), mobile wired to it, mock deleted, notification on send, verified message persists MySQL → API → RN and loads for the other user. ✓ (Tasks 1, 2, 3 step 6)
- Mock audit: Task 3 step 1-2 classifies every hit; only Stories may remain, and it's clearly isolated + backend-absent. ✓
- Avatar/cover: verified working pre-plan; Task 3 step 3 hardens error states + confirms the displayed URL is the server URL not the local uri. ✓
- Every backend-supported feature uses real API: pre-verified by M1-Mobile final review + re-verified Task 3 step 6. ✓
- Auth session flow: untouched (single-flight refresh intact); Task 3 step 7 re-confirms no token logging. ✓
- STOMP: explicitly deferred to M4 — REST + poll-on-focus is the delivery. Documented.
- Tests: backend `mvn test`, mobile `npm test`, `tsc` — all gated in Tasks 1, 2, 3.

## Execution: subagent-driven, 3 tasks, review each.
