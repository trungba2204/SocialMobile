package com.socialapp.post.comment;

import com.socialapp.common.BaseEntity;
import com.socialapp.post.Post;
import com.socialapp.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "comments", indexes = {
        @Index(name = "ix_comments_post_created", columnList = "post_id, created_at"),
        @Index(name = "ix_comments_parent", columnList = "parent_id")
})
public class Comment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(name = "parent_id")
    private Long parentId;

    protected Comment() {
    }

    public Comment(Post post, User author, String content, Long parentId) {
        this.post = post;
        this.author = author;
        this.content = content;
        this.parentId = parentId;
    }

    public Post getPost() {
        return post;
    }

    public User getAuthor() {
        return author;
    }

    public String getContent() {
        return content;
    }

    public Long getParentId() {
        return parentId;
    }
}
