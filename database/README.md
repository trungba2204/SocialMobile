# Database

Orbit uses **MySQL 8**. Local development credentials (defaults baked into
`backend/src/main/resources/application.yml`, overridable by env vars):

| Setting  | Value            | Env var       |
|----------|------------------|---------------|
| Host     | `localhost`      | `DB_HOST`     |
| Port     | `3306`           | `DB_PORT`     |
| User     | `root`           | `DB_USER`     |
| Password | `1234567890`     | `DB_PASSWORD` |
| Database | `social_network` | `DB_NAME`     |

## Create the database

The JDBC URL uses `createDatabaseIfNotExist=true`, so simply starting the
backend creates it. To create it by hand:

```sql
CREATE DATABASE IF NOT EXISTS social_network
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Schema management

Development uses Hibernate `spring.jpa.hibernate.ddl-auto=update` — the schema
is derived from the JPA entities on startup. `schema.sql` in the backend
resources is a **hand-maintained reference only** (it is not executed). Before
any shared or production deployment, adopt **Flyway**: move `schema.sql` to
`src/main/resources/db/migration/V1__init.sql`, add the `flyway-mysql`
dependency, and set `ddl-auto=validate`.

## Reset local data

```sql
DROP DATABASE social_network;
```

Then restart the backend. With `SEED_ENABLED=true` (default in the `dev`
profile) the app repopulates demo users, posts, comments, friendships,
friend requests and notifications when the `users` table is empty.

## Seed toggle

| Profile        | `app.seed.enabled` |
|----------------|--------------------|
| default        | `false`            |
| `dev`          | `true`             |
| env override   | `SEED_ENABLED`     |

Seed users all use the password `Password123!` (e.g. `alice`, `ben`, `chloe`).
