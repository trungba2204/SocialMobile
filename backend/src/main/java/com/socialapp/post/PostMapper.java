package com.socialapp.post;

import com.socialapp.post.dto.PostDto;
import com.socialapp.post.dto.PostMediaDto;
import com.socialapp.user.UserMapper;
import org.springframework.stereotype.Component;

@Component
public class PostMapper {

    private final UserMapper userMapper;

    public PostMapper(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public PostDto toDto(Post post, long likeCount, long commentCount, long shareCount, boolean likedByMe) {
        return new PostDto(
                post.getId(),
                userMapper.toDto(post.getAuthor()),
                post.getContent(),
                post.getPrivacy().name(),
                post.getFeeling(),
                post.getLocation(),
                post.getMedia().stream()
                        .map(m -> new PostMediaDto(m.getUrl(), m.getType().name(), m.getPosition()))
                        .toList(),
                post.getCreatedAt(),
                likeCount,
                commentCount,
                shareCount,
                likedByMe);
    }
}
