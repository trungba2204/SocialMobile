package com.socialapp.notification.spi;

import com.socialapp.notification.NotificationType;

/**
 * SPI other modules use to raise a notification without depending on the
 * notification service directly. A no-op default bean is provided; the real
 * implementation overrides it via {@code @Primary}.
 */
public interface NotificationPort {

    void record(long recipientId, long actorId, NotificationType type, String entityType, Long entityId);
}
