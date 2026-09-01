package com.socialapp.conversation.dto;

import java.time.Instant;

public record LastMessageDto(
        Long id,
        String content,
        Long senderId,
        Instant createdAt
) {
}
