package com.socialapp.friend.dto;

import com.socialapp.user.dto.UserDto;

import java.time.Instant;

public record FriendRequestDto(
        Long id,
        UserDto requester,
        String status,
        Instant createdAt
) {
}
