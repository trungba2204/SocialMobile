package com.socialapp.user.dto;

import com.socialapp.friend.dto.FriendStatus;

public record UserProfileDto(
        Long id,
        String username,
        String displayName,
        String avatarUrl,
        String bio,
        String coverUrl,
        long friendCount,
        long postCount,
        FriendStatus friendStatus
) {
}
