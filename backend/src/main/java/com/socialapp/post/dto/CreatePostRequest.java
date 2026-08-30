package com.socialapp.post.dto;

import com.socialapp.post.Privacy;
import jakarta.validation.constraints.Size;

public record CreatePostRequest(
        @Size(max = 5000) String content,
        Privacy privacy,
        @Size(max = 80) String feeling,
        @Size(max = 160) String location
) {
}
