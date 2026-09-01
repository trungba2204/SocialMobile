package com.socialapp.story;

import com.socialapp.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "story_views",
        uniqueConstraints = @UniqueConstraint(name = "uk_story_view", columnNames = {"story_id", "viewer_id"}),
        indexes = @Index(name = "ix_story_views_story", columnList = "story_id"))
public class StoryView extends BaseEntity {

    @Column(name = "story_id", nullable = false)
    private Long storyId;

    @Column(name = "viewer_id", nullable = false)
    private Long viewerId;

    protected StoryView() {
    }

    public StoryView(Long storyId, Long viewerId) {
        this.storyId = storyId;
        this.viewerId = viewerId;
    }

    public Long getStoryId() {
        return storyId;
    }

    public Long getViewerId() {
        return viewerId;
    }
}
