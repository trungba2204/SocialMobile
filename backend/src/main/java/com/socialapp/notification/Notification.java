package com.socialapp.notification;

import com.socialapp.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "ix_notifications_recipient_created", columnList = "recipient_id, created_at")
})
public class Notification extends BaseEntity {

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private NotificationType type;

    @Column(name = "entity_type", length = 32)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    protected Notification() {
    }

    public Notification(Long recipientId, Long actorId, NotificationType type,
                        String entityType, Long entityId) {
        this.recipientId = recipientId;
        this.actorId = actorId;
        this.type = type;
        this.entityType = entityType;
        this.entityId = entityId;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public Long getActorId() {
        return actorId;
    }

    public NotificationType getType() {
        return type;
    }

    public String getEntityType() {
        return entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public boolean isRead() {
        return read;
    }

    public void markRead() {
        this.read = true;
    }
}
