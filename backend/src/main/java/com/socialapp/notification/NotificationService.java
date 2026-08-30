package com.socialapp.notification;

import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.notification.dto.NotificationDto;
import com.socialapp.notification.spi.NotificationPort;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Primary
public class NotificationService implements NotificationPort {

    private final NotificationRepository notifications;
    private final NotificationMapper mapper;

    public NotificationService(NotificationRepository notifications, NotificationMapper mapper) {
        this.notifications = notifications;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void record(long recipientId, long actorId, NotificationType type,
                       String entityType, Long entityId) {
        notifications.save(new Notification(recipientId, actorId, type, entityType, entityId));
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> list(long userId, Pageable pageable) {
        return notifications.findByRecipientIdOrderByCreatedAtDesc(userId, pageable).map(mapper::toDto);
    }

    @Transactional(readOnly = true)
    public long unreadCount(long userId) {
        return notifications.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(long id, long userId) {
        Notification n = notifications.findByIdAndRecipientId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        n.markRead();
    }

    @Transactional
    public void markAllRead(long userId) {
        notifications.markAllRead(userId);
    }
}
