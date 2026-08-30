package com.socialapp.notification;

import com.socialapp.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock NotificationRepository notifications;
    @Mock NotificationMapper mapper;

    NotificationService service;

    @BeforeEach
    void setup() {
        service = new NotificationService(notifications, mapper);
    }

    @Test
    void recordPersistsUnreadNotification() {
        service.record(1L, 2L, NotificationType.POST_LIKE, "POST", 10L);

        var captor = org.mockito.ArgumentCaptor.forClass(Notification.class);
        verify(notifications).save(captor.capture());
        assertThat(captor.getValue().isRead()).isFalse();
        assertThat(captor.getValue().getRecipientId()).isEqualTo(1L);
        assertThat(captor.getValue().getType()).isEqualTo(NotificationType.POST_LIKE);
    }

    @Test
    void markReadOnAnotherUsersNotificationThrows() {
        when(notifications.findByIdAndRecipientId(5L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.markRead(5L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void markAllReadDelegatesToRepository() {
        service.markAllRead(1L);
        verify(notifications).markAllRead(1L);
    }

    @Test
    void markReadFlipsFlag() {
        Notification n = new Notification(1L, 2L, NotificationType.POST_COMMENT, "POST", 3L);
        when(notifications.findByIdAndRecipientId(7L, 1L)).thenReturn(Optional.of(n));

        service.markRead(7L, 1L);

        assertThat(n.isRead()).isTrue();
    }
}
