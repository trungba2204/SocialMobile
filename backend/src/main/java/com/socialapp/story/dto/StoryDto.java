package com.socialapp.story.dto;

import com.socialapp.user.dto.UserDto;

import java.time.Instant;

public record StoryDto(
        Long id,
        UserDto author,
        String mediaUrl,
        String caption,
        Instant createdAt,
        Instant expiresAt,
        boolean viewedByMe,
        long viewerCount
) {
}
