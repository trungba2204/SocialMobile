package com.socialapp.user.dto;

public record UserDto(
        Long id,
        String username,
        String displayName,
        String avatarUrl,
        String bio
) {
}
