package com.socialapp.post;

import com.socialapp.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "post_media", indexes = @Index(name = "ix_post_media_post", columnList = "post_id"))
public class PostMedia extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(nullable = false, length = 300)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private MediaType type;

    @Column(nullable = false)
    private int position;

    protected PostMedia() {
    }

    public PostMedia(String url, MediaType type, int position) {
        this.url = url;
        this.type = type;
        this.position = position;
    }

    void attachTo(Post post) {
        this.post = post;
    }

    public Post getPost() {
        return post;
    }

    public String getUrl() {
        return url;
    }

    public MediaType getType() {
        return type;
    }

    public int getPosition() {
        return position;
    }
}
