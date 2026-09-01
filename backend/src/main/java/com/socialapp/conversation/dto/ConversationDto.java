package com.socialapp.conversation.dto;

import com.socialapp.user.dto.UserDto;

import java.time.Instant;

public record ConversationDto(
        Long id,
        UserDto peer,
        LastMessageDto lastMessage,
        int unreadCount,
        Instant updatedAt
) {
}
