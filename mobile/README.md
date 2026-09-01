# Orbit — Mobile App

Expo (SDK 57) / React Native 0.86 / React 19 client for the Orbit social network.
TypeScript throughout, Zustand for state, Axios for HTTP, React Navigation for
routing.

## Prerequisites

- **Node 20+** and npm
- **Expo Go** (iOS/Android) for quick device testing, or a **dev build** if you
  need native modules beyond what Expo Go ships
- The **Orbit backend** running and reachable at `EXPO_PUBLIC_API_URL`
  (see [`../backend/README.md`](../backend/README.md)). Default
  `http://localhost:8080`.

## Setup

```bash
cd mobile
npm install
cp .env.example .env        # then edit EXPO_PUBLIC_API_URL if needed
npx expo start
```

Press `i` / `a` in the Expo CLI for the iOS Simulator / Android emulator, or scan
the QR code with Expo Go on a physical device.

### `.env`

| Variable | Default | Notes |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:8080` | Backend origin, **no** trailing `/api`. |

- **iOS Simulator**: `http://localhost:8080` works as-is.
- **Android emulator**: use `http://10.0.2.2:8080`.
- **Physical device**: use your machine's LAN IP, e.g. `http://192.168.1.20:8080`,
  and make sure the backend binds to `0.0.0.0`.

The value is read in `app.config.ts` and exposed via `expo-constants` as
`Constants.expoConfig.extra.apiUrl` (`src/lib/apiUrl.ts`).

## Commands

| Command | Purpose |
|---|---|
| `npx expo start` | Run the dev server |
| `npm test` | Jest suite (36 suites / 107 tests) |
| `npx tsc --noEmit` | Type-check (zero errors) |
| `npx expo lint` | Lint (scaffolds `eslint-config-expo` on first run) |
| `npx expo export --platform ios` | Verify the whole app bundles |

M1 verification: Jest + `tsc --noEmit` + `expo export`, plus a curl round-trip of
the key API contracts (login, feed, notifications, friends, search, profile)
against the seeded backend. There is no automated on-device / simulator E2E in M1.

## Architecture

- `src/api/` — thin Axios modules per resource + `client.ts` (single-flight token
  refresh, memory-only access token, refresh token in `expo-secure-store`).
- `src/features/<feature>/` — feature-first screens + local components + tests.
- `src/components/` — shared primitives (`Text`, `Button`, `ScreenContainer`,
  `Skeleton`, `EmptyState`, `ErrorState`, …).
- `src/hooks/` — `usePagedQuery`, `useResource`, `useDebouncedValue`.
- `src/store/` — `useAuthStore` (auth lifecycle + bootstrap), `useUiStore`
  (toasts, unread badge, theme mode).
- `src/theme/` — design tokens + `ThemeProvider` / `useTheme` (light + dark).
- `src/navigation/` — bottom tabs + native stacks + modals.

## Screens backed by mock data

**Stories** and **Messages** are complete, interactive UI wired to fixtures in
`src/mock/` — there is no M1 backend for them. Real APIs land in **M2 (Stories)**
and **M3 (Messaging)**; realtime (typing, delivery) is **M4**. The code is marked
with `// M2` / `// M3` comments.

Several **Settings** sub-screens (Account, Privacy, Security, Notifications,
Blocked users, Help) are intentional "coming soon" stubs per the spec — Appearance
and Log out are functional. Forgot Password is UI-only (no backend endpoint).

## Design-system rules

- **Never** import `Text` from `react-native`. Use the `Text` primitive from
  `@/components/Text` (enforces font family, sizing, color tokens).
- **All** styling goes through theme tokens — `theme.colors.*`, `theme.space.*`,
  `theme.typography.*`, `theme.radius.*`. No hard-coded colors or magic spacing
  in feature code.
- Every list/detail screen renders three branches: **skeleton** (initial load),
  **empty**, and **error + retry**.
- Never log tokens or passwords. Access token stays in memory; refresh token in
  SecureStore.

## Known follow-ups

Non-blocking nits deferred from task reviews:

- `npx expo lint` (expo's flat config, not part of the original plan) reports ~14
  errors from `react-hooks` "latest" rules flagging established, safe patterns:
  the `fetcherRef.current = fetcher` stash in `usePagedQuery` / `useResource`, and
  synchronous initial-load `setState` inside their effects; plus ref-access in
  `PostCard` / `StoryViewerScreen` / `PressableScale` animation code. None affect
  behaviour or tests. Address by migrating those hooks to an event/effect split.
- `useNavigation<any>()` is used in several screens — replace with typed
  navigator params.
- Magic spacing / `Array<T>` vs `T[]` nits in `MessageBubble`, `ConversationRow`,
  composer components and `src/mock/conversations.ts`.
- `await fireEvent(...)` / `await render(...)` harmless-noise in a few test files.
- `PostDetail` / `CommentsThread` `KeyboardAvoidingView` has no
  `keyboardVerticalOffset`; re-check on a physical iOS device and add a
  header-height offset if the composer is covered.
- `src/theme/ThemeProvider.tsx` imports `useTheme` twice; `navigation/types.ts`
  has an empty-interface declaration merge.
