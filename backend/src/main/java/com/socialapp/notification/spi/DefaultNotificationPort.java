package com.socialapp.notification.spi;

import com.socialapp.notification.NotificationType;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DefaultNotificationPort {

    @Bean
    @ConditionalOnMissingBean(NotificationPort.class)
    public NotificationPort noopNotificationPort() {
        return new NotificationPort() {
            @Override
            public void record(long recipientId, long actorId, NotificationType type,
                               String entityType, Long entityId) {
                // no-op fallback
            }
        };
    }
}
