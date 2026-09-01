package com.socialapp.conversation;

import com.socialapp.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "messages", indexes = {
        @Index(name = "ix_messages_conversation_created", columnList = "conversation_id, created_at")
})
public class Message extends BaseEntity {

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(nullable = false, length = 4000)
    private String content;

    protected Message() {
    }

    public Message(Long conversationId, Long senderId, String content) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.content = content;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public String getContent() {
        return content;
    }
}
