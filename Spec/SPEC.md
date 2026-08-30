/superpowers:brainstorm

I am starting a completely new project in this empty folder.

Build a complete full-stack **mobile social networking application from scratch**, similar in functionality to modern social networks such as Facebook, but with a completely original UI/UX.

There is currently no frontend or backend. Create everything from scratch.

# 1. TECHNOLOGY STACK

## Mobile Frontend

Use:

* React Native
* TypeScript
* Expo
* React Navigation
* Zustand for state management where appropriate
* Axios for API communication
* React Native Paper or another suitable component library only when useful
* Lucide React Native / appropriate icon library

The application must be a REAL mobile application targeting:

* Android
* iOS

Do NOT build a web application.

Do NOT use Next.js.

Do NOT use regular ReactJS.

Do NOT use Flutter.

---

## Backend

Use:

* Java 21
* Spring Boot
* Spring Web
* Spring Security
* Spring Data JPA
* Hibernate
* MySQL
* JWT authentication
* Maven
* REST API
* Bean Validation
* Swagger/OpenAPI

Use a clean and maintainable backend architecture.

Recommended structure:

```text
backend/
├── src/main/java/
│   └── com/socialapp/
│       ├── config/
│       ├── controller/
│       ├── dto/
│       ├── entity/
│       ├── exception/
│       ├── repository/
│       ├── security/
│       └── service/
│
├── src/main/resources/
│   ├── application.yml
│   └── ...
│
└── pom.xml
```

You may improve this architecture if there is a better professional structure.

---

# 2. DATABASE

Use MySQL.

Database credentials for local development:

```text
Host: localhost
Port: 3306
Username: root
Password: 1234567890
```

Create a dedicated database for the application.

For example:

```text
social_network
```

Do NOT hard-code database credentials throughout the source code.

Put configuration in:

```text
application.yml
```

or environment variables, while using the credentials above as the default local development configuration.

Create proper:

* Primary keys
* Foreign keys
* Indexes
* Unique constraints
* Relationships
* CreatedAt
* UpdatedAt

---

# 3. PROJECT STRUCTURE

Create:

```text
project-root/
├── mobile/
│   ├── src/
│   ├── package.json
│   ├── app.json
│   └── ...
│
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── ...
│
├── database/
│   └── README.md
│
└── README.md
```

The mobile frontend and backend must be clearly separated.

---

# 4. UI/UX — YOU DESIGN EVERYTHING

This is extremely important.

I do NOT have an existing design.

You are responsible for designing the entire UI/UX from scratch.

Act as a:

* Senior Product Designer
* Senior Mobile UX Designer
* Senior React Native Engineer

Do NOT ask me to choose:

* Colors
* Typography
* Layout
* Navigation
* Card design
* Icon style
* Spacing
* Animations

Make professional design decisions yourself.

Create a completely original visual identity.

The app may take general UX inspiration from Facebook, Instagram, Messenger and other social platforms, but DO NOT copy their exact visual design, branding, logos or proprietary assets.

The result should look like a new premium social networking application.

---

# 5. DESIGN SYSTEM

Create a coherent design system including:

### Colors

Define:

* Primary
* Secondary
* Accent
* Background
* Surface
* Card
* Text primary
* Text secondary
* Border
* Success
* Warning
* Error

Support:

* Light mode
* Dark mode

### Typography

Define:

* Display
* Heading
* Body
* Caption
* Button
* Metadata

### Spacing

Create a consistent spacing system.

### Components

Create reusable components for:

* Buttons
* Inputs
* Cards
* Avatars
* Badges
* Tabs
* Bottom sheets
* Modals
* Toasts
* Skeleton loaders
* Empty states

---

# 6. MAIN MOBILE SCREENS

Create at minimum:

## Authentication

```text
Splash
Login
Register
Forgot Password
```

## Main Application

```text
Home
Friends
Create Post
Notifications
Messages
Profile
Search
Settings
```

---

# 7. HOME FEED

Design a modern social feed.

Include:

* Header
* User avatar
* Search
* Notifications
* Messages
* Stories
* Create Post
* Feed posts

Each Post should support:

* Avatar
* Username
* Timestamp
* Privacy indicator
* Post text
* Images
* Video placeholder
* Like
* Comment
* Share
* Like count
* Comment count
* Share count
* More menu

Use realistic seed data.

---

# 8. STORIES

Create:

* Stories carousel
* Add Story
* Story viewer
* Story progress
* Story reactions
* Story replies
* Story views

Make the Stories UI original.

---

# 9. CREATE POST

Create a polished mobile post composer.

Support:

* Text
* Images
* Video
* Privacy
* Location
* Tag people
* Feeling/activity
* Preview
* Publish

---

# 10. FRIEND SYSTEM

Implement:

* Friend requests
* Accept request
* Reject request
* Remove friend
* Friend list
* Suggested friends
* Mutual friends

Create appropriate mobile UI.

---

# 11. SEARCH

Create a search experience for:

* Users
* Posts
* Friends

Include:

* Search history
* Search suggestions
* Result states
* Empty state

---

# 12. NOTIFICATIONS

Support:

* Likes
* Comments
* Shares
* Friend requests
* Friend accepted
* Messages
* Story interactions

When the user taps a notification, navigate to the appropriate destination.

For example:

```text
Like notification
→ Open related post

Comment notification
→ Open related post/comment

Friend request
→ Open user profile

Message notification
→ Open conversation
```

---

# 13. MESSAGING

Create a modern private messaging system.

Conversation list:

* Avatar
* Name
* Last message
* Timestamp
* Online status
* Unread badge

Chat screen:

* Header
* Messages
* Message bubbles
* Timestamp
* Read state
* Typing indicator
* Image attachment
* Emoji
* Text input
* Send button

Use WebSocket/STOMP if appropriate for real-time messaging.

If real-time messaging is too large for the first milestone, create the architecture so it can be added cleanly later.

---

# 14. PROFILE

Create:

* Cover image
* Avatar
* Name
* Username
* Bio
* Friends/followers
* Posts
* Photos
* Friends

Actions:

* Add Friend
* Remove Friend
* Message
* Edit Profile

---

# 15. SETTINGS

Create:

* Account
* Privacy
* Security
* Notifications
* Appearance
* Language
* Blocked users
* Help
* Logout

---

# 16. NAVIGATION

Design the best mobile navigation yourself.

You may use:

* Bottom tabs
* Stack navigation
* Modal navigation
* Nested navigation

Choose the structure that provides the best UX.

Do NOT blindly copy Facebook.

---

# 17. MOBILE UX

Optimize for:

* iPhone
* Android
* Small screens
* Large screens

Handle:

* Safe areas
* Keyboard
* Bottom navigation
* Keyboard avoiding views
* Pull to refresh
* Infinite scrolling
* Loading
* Empty states
* Error states
* Network errors

Avoid:

* Content behind navigation
* Tiny touch targets
* Horizontal overflow
* Broken keyboard behavior
* Layout jumps

---

# 18. DATABASE ENTITIES

At minimum design entities for:

```text
User
Role
RefreshToken
Post
PostMedia
Comment
Like
Share
Friendship
FriendRequest
Notification
Conversation
ConversationMember
Message
Story
StoryView
```

Add additional entities if necessary.

Use proper JPA relationships.

Avoid unnecessary bidirectional relationships that could cause serialization problems.

Use DTOs instead of exposing JPA entities directly from controllers.

---

# 19. AUTHENTICATION

Implement:

```text
Register
Login
Refresh Token
Logout
Current User
```

Use:

* BCrypt password hashing
* JWT access token
* Refresh token
* Spring Security
* Role-based authorization

Never store plain-text passwords.

Never return passwords in API responses.

---

# 20. REST API

Create clean REST endpoints.

Example:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout

GET /api/users/me
GET /api/users/{id}
PUT /api/users/me

GET /api/posts
POST /api/posts
PUT /api/posts/{id}
DELETE /api/posts/{id}

POST /api/posts/{id}/like
DELETE /api/posts/{id}/like

GET /api/posts/{id}/comments
POST /api/posts/{id}/comments

POST /api/friends/requests/{userId}
POST /api/friends/requests/{requestId}/accept
POST /api/friends/requests/{requestId}/reject
DELETE /api/friends/{userId}

GET /api/search/users?q=

GET /api/notifications

GET /api/conversations
GET /api/conversations/{id}/messages
POST /api/conversations/{id}/messages

GET /api/stories
POST /api/stories
POST /api/stories/{id}/view
```

Improve the API design if necessary.

---

# 21. VALIDATION & ERROR HANDLING

Backend:

* Bean Validation
* Global exception handler
* Consistent API error response
* Proper HTTP status codes
* Authentication errors
* Authorization errors
* Validation errors
* Not found errors

Frontend:

* Form validation
* API error handling
* Loading indicators
* Retry actions
* Empty states

---

# 22. SECURITY

Implement:

* BCrypt
* JWT
* Refresh token rotation where appropriate
* Authorization
* Input validation
* CORS
* Secure API design
* No sensitive information in logs

Do not log:

* Passwords
* JWT tokens
* Refresh tokens
* Sensitive personal data

---

# 23. MEDIA

Prepare architecture for:

* Profile avatar
* Cover image
* Post images
* Post videos
* Story media
* Message attachments

Do not over-engineer cloud storage initially.

Create a clean media abstraction so local storage can be replaced with S3/MinIO later.

---

# 24. SEED DATA

Create development seed data.

Include:

* Users
* Posts
* Comments
* Friends
* Notifications
* Conversations
* Messages
* Stories

The app should look populated when launched.

---

# 25. CODE QUALITY

Follow:

* SOLID principles
* Clean code
* Separation of concerns
* Reusable components
* DTO pattern
* Service layer
* Repository layer
* Proper naming
* Type safety

Avoid giant files.

Avoid duplicated code.

Avoid putting business logic inside controllers.

---

# 26. SUPERPOWERS WORKFLOW

Do NOT immediately start writing hundreds of files.

First:

1. Inspect the empty folder.
2. Analyze requirements.
3. Design the system architecture.
4. Design the database.
5. Design API contracts.
6. Design mobile navigation.
7. Design the complete UI/UX system.
8. Define component architecture.
9. Define implementation milestones.
10. Produce a detailed implementation plan.

Use the Superpowers workflow.

At this stage, do NOT implement the application yet.

Present the proposed architecture, database model, API design, navigation structure and UI/UX direction.

Wait for my approval.

---

# 27. AFTER APPROVAL

After I approve the plan:

Implement systematically.

Recommended order:

```text
1. Project scaffolding
2. MySQL configuration
3. Database entities
4. Flyway/Liquibase migrations
5. Authentication backend
6. User APIs
7. Post APIs
8. Friend APIs
9. Comment/Like/Share APIs
10. Notification APIs
11. Messaging APIs
12. Story APIs
13. React Native foundation
14. Design system
15. Authentication screens
16. Main navigation
17. Home feed
18. Stories
19. Create Post
20. Friends
21. Notifications
22. Messages
23. Profile
24. Search
25. Settings
26. API integration
27. Error handling
28. Testing
29. Final UI/UX polish
```

You may change the order if dependencies require it.

---

# 28. VERIFICATION

After implementation:

Backend:

```bash
mvn clean test
mvn clean package
```

Mobile:

```bash
npm install
npx tsc --noEmit
npx expo start
```

Verify:

* Backend starts successfully
* Database connects successfully
* API works
* Authentication works
* JWT works
* React Native starts
* Navigation works
* API integration works
* No TypeScript errors
* No Java compilation errors
* No obvious runtime errors

Fix errors instead of simply reporting them.

---

# FINAL OBJECTIVE

Create a complete production-quality social networking mobile application:

```text
React Native
      ↓
REST API
      ↓
Java Spring Boot
      ↓
MySQL
```

The UI must be designed completely from scratch by you.

Do not ask me to design it.

Make professional product-design decisions yourself.

First use the Superpowers brainstorming/planning workflow and present the complete architecture + UI/UX direction + implementation plan.

Do not modify the project files until the plan is approved.
