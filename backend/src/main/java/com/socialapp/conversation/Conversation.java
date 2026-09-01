package com.socialapp.conversation;

import com.socialapp.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "conversations")
public class Conversation extends BaseEntity {

    @Column(name = "is_group", nullable = false)
    private boolean group = false;

    @Column(length = 120)
    private String title;

    @Column(name = "last_message_id")
    private Long lastMessageId;

    protected Conversation() {
    }

    public Conversation(boolean group, String title) {
        this.group = group;
        this.title = title;
    }

    public boolean isGroup() {
        return group;
    }

    public String getTitle() {
        return title;
    }

    public Long getLastMessageId() {
        return lastMessageId;
    }

    public void setLastMessageId(Long lastMessageId) {
        this.lastMessageId = lastMessageId;
    }
}
