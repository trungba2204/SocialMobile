package com.socialapp.conversation.dto;

import com.socialapp.user.dto.UserDto;

import java.time.Instant;

public record MessageDto(
        Long id,
        Long conversationId,
        UserDto sender,
        String content,
        Instant createdAt
) {
}
