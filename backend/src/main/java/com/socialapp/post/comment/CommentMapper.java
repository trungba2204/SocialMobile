package com.socialapp.post.comment;

import com.socialapp.post.comment.dto.CommentDto;
import com.socialapp.user.UserMapper;
import org.springframework.stereotype.Component;

@Component
public class CommentMapper {

    private final UserMapper userMapper;

    public CommentMapper(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public CommentDto toDto(Comment comment) {
        return new CommentDto(
                comment.getId(),
                comment.getPost().getId(),
                userMapper.toDto(comment.getAuthor()),
                comment.getContent(),
                comment.getParentId(),
                comment.getCreatedAt());
    }
}
