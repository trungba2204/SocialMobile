package com.socialapp.notification.dto;

import com.socialapp.user.dto.UserDto;

import java.time.Instant;

public record NotificationDto(
        Long id,
        String type,
        UserDto actor,
        String entityType,
        Long entityId,
        boolean isRead,
        Instant createdAt
) {
}
