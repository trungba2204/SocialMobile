package com.socialapp.post.comment.dto;

import com.socialapp.user.dto.UserDto;

import java.time.Instant;

public record CommentDto(
        Long id,
        Long postId,
        UserDto author,
        String content,
        Long parentId,
        Instant createdAt
) {
}
