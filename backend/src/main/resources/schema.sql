-- ============================================================================
-- Orbit — reference schema (NOT executed at runtime)
-- Hibernate manages the dev schema via spring.jpa.hibernate.ddl-auto=update.
-- Adopt Flyway (or Liquibase) and promote this file to a versioned migration
-- before any shared / production deployment.
-- Target: MySQL 8
-- ============================================================================

CREATE DATABASE IF NOT EXISTS social_network
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE social_network;

CREATE TABLE roles (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  name        VARCHAR(32)  NOT NULL,
  created_at  DATETIME(6)  NOT NULL,
  updated_at  DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB;

CREATE TABLE users (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  email         VARCHAR(180) NOT NULL,
  username      VARCHAR(20)  NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  display_name  VARCHAR(60)  NOT NULL,
  bio           VARCHAR(280) NULL,
  avatar_url    VARCHAR(300) NULL,
  cover_url     VARCHAR(300) NULL,
  active        BIT(1)       NOT NULL DEFAULT b'1',
  created_at    DATETIME(6)  NOT NULL,
  updated_at    DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_username (username),
  KEY ix_users_username (username)
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB;

CREATE TABLE refresh_tokens (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  token      VARCHAR(64)  NOT NULL,
  user_id    BIGINT       NOT NULL,
  expires_at DATETIME(6)  NOT NULL,
  revoked    BIT(1)       NOT NULL DEFAULT b'0',
  created_at DATETIME(6)  NOT NULL,
  updated_at DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_refresh_token (token),
  KEY ix_refresh_user (user_id),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE posts (
  id         BIGINT        NOT NULL AUTO_INCREMENT,
  author_id  BIGINT        NOT NULL,
  content    VARCHAR(5000) NULL,
  privacy    VARCHAR(16)   NOT NULL,
  feeling    VARCHAR(80)   NULL,
  location   VARCHAR(160)  NULL,
  created_at DATETIME(6)   NOT NULL,
  updated_at DATETIME(6)   NOT NULL,
  PRIMARY KEY (id),
  KEY ix_posts_author_created (author_id, created_at),
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE post_media (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  post_id    BIGINT       NOT NULL,
  url        VARCHAR(300) NOT NULL,
  type       VARCHAR(16)  NOT NULL,
  position   INT          NOT NULL,
  created_at DATETIME(6)  NOT NULL,
  updated_at DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  KEY ix_post_media_post (post_id),
  CONSTRAINT fk_post_media_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE comments (
  id         BIGINT        NOT NULL AUTO_INCREMENT,
  post_id    BIGINT        NOT NULL,
  author_id  BIGINT        NOT NULL,
  content    VARCHAR(2000) NOT NULL,
  parent_id  BIGINT        NULL,
  created_at DATETIME(6)   NOT NULL,
  updated_at DATETIME(6)   NOT NULL,
  PRIMARY KEY (id),
  KEY ix_comments_post_created (post_id, created_at),
  KEY ix_comments_parent (parent_id),
  CONSTRAINT fk_comments_post   FOREIGN KEY (post_id)   REFERENCES posts (id),
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users (id),
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments (id)
) ENGINE=InnoDB;

CREATE TABLE post_likes (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  post_id    BIGINT      NOT NULL,
  user_id    BIGINT      NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_post_like (post_id, user_id),
  KEY ix_post_like_post (post_id)
) ENGINE=InnoDB;

CREATE TABLE shares (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  post_id    BIGINT       NOT NULL,
  user_id    BIGINT       NOT NULL,
  caption    VARCHAR(280) NULL,
  created_at DATETIME(6)  NOT NULL,
  updated_at DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_share (post_id, user_id),
  KEY ix_share_post (post_id)
) ENGINE=InnoDB;

CREATE TABLE friendships (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  user_low_id  BIGINT      NOT NULL,
  user_high_id BIGINT      NOT NULL,
  created_at   DATETIME(6) NOT NULL,
  updated_at   DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_friendship_pair (user_low_id, user_high_id),
  KEY ix_friendship_low (user_low_id),
  KEY ix_friendship_high (user_high_id)
) ENGINE=InnoDB;

CREATE TABLE friend_requests (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  requester_id BIGINT      NOT NULL,
  addressee_id BIGINT      NOT NULL,
  status       VARCHAR(16) NOT NULL,
  created_at   DATETIME(6) NOT NULL,
  updated_at   DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_friend_request_pair (requester_id, addressee_id),
  KEY ix_friend_request_addressee (addressee_id, status)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  recipient_id BIGINT      NOT NULL,
  actor_id     BIGINT      NOT NULL,
  type         VARCHAR(32) NOT NULL,
  entity_type  VARCHAR(32) NULL,
  entity_id    BIGINT      NULL,
  is_read      BIT(1)      NOT NULL DEFAULT b'0',
  created_at   DATETIME(6) NOT NULL,
  updated_at   DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_notifications_recipient_created (recipient_id, created_at)
) ENGINE=InnoDB;
