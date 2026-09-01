package com.socialapp.story.dto;

import jakarta.validation.constraints.Size;

/**
 * Not bound as a request body (stories are created via multipart: a "file" part
 * plus an optional "caption" form field). Kept for the caption constraint.
 */
public record CreateStoryRequest(
        @Size(max = 200, message = "Caption must be at most 200 characters") String caption
) {
}
