package com.socialapp.story;

import com.socialapp.story.dto.StoryDto;
import com.socialapp.user.UserMapper;
import com.socialapp.user.UserRepository;
import com.socialapp.user.dto.UserDto;
import org.springframework.stereotype.Component;

@Component
public class StoryMapper {

    private final UserRepository users;
    private final UserMapper userMapper;

    public StoryMapper(UserRepository users, UserMapper userMapper) {
        this.users = users;
        this.userMapper = userMapper;
    }

    public StoryDto toDto(Story story, boolean viewedByMe, long viewerCount) {
        UserDto author = users.findById(story.getAuthorId()).map(userMapper::toDto).orElse(null);
        return new StoryDto(story.getId(), author, story.getMediaUrl(), story.getCaption(),
                story.getCreatedAt(), story.getExpiresAt(), viewedByMe, viewerCount);
    }
}
