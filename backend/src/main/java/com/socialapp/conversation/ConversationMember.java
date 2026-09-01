package com.socialapp.conversation;

import com.socialapp.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "conversation_members",
        uniqueConstraints = @UniqueConstraint(name = "uk_conversation_member",
                columnNames = {"conversation_id", "user_id"}),
        indexes = @Index(name = "ix_conversation_member_user", columnList = "user_id"))
public class ConversationMember extends BaseEntity {

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;

    @Column(name = "unread_count", nullable = false)
    private int unreadCount = 0;

    protected ConversationMember() {
    }

    public ConversationMember(Long conversationId, Long userId) {
        this.conversationId = conversationId;
        this.userId = userId;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getLastReadMessageId() {
        return lastReadMessageId;
    }

    public void setLastReadMessageId(Long lastReadMessageId) {
        this.lastReadMessageId = lastReadMessageId;
    }

    public int getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(int unreadCount) {
        this.unreadCount = unreadCount;
    }

    public void incrementUnread() {
        this.unreadCount++;
    }
}
