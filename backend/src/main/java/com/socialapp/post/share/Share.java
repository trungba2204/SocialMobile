package com.socialapp.post.share;

import com.socialapp.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "shares",
        uniqueConstraints = @UniqueConstraint(name = "uk_share", columnNames = {"post_id", "user_id"}),
        indexes = @Index(name = "ix_share_post", columnList = "post_id"))
public class Share extends BaseEntity {

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 280)
    private String caption;

    protected Share() {
    }

    public Share(Long postId, Long userId, String caption) {
        this.postId = postId;
        this.userId = userId;
        this.caption = caption;
    }

    public Long getPostId() {
        return postId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getCaption() {
        return caption;
    }
}
