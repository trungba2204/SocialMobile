package com.socialapp.story.dto;

import com.socialapp.user.dto.UserDto;

import java.util.List;

public record StoryReelDto(
        UserDto author,
        List<StoryDto> stories,
        boolean hasUnseen
) {
}
