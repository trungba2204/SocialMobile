package com.socialapp.story;

import com.socialapp.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "stories", indexes = {
        @Index(name = "ix_stories_author_expires", columnList = "author_id, expires_at")
})
public class Story extends BaseEntity {

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(name = "media_url", length = 300, nullable = false)
    private String mediaUrl;

    @Column(length = 200)
    private String caption;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected Story() {
    }

    public Story(Long authorId, String mediaUrl, String caption, Instant expiresAt) {
        this.authorId = authorId;
        this.mediaUrl = mediaUrl;
        this.caption = caption;
        this.expiresAt = expiresAt;
    }

    public Long getAuthorId() {
        return authorId;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public String getCaption() {
        return caption;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
