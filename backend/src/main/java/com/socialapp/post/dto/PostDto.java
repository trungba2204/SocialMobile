package com.socialapp.post.dto;

import com.socialapp.user.dto.UserDto;

import java.time.Instant;
import java.util.List;

public record PostDto(
        Long id,
        UserDto author,
        String content,
        String privacy,
        String feeling,
        String location,
        List<PostMediaDto> media,
        Instant createdAt,
        long likeCount,
        long commentCount,
        long shareCount,
        boolean likedByMe
) {
}
