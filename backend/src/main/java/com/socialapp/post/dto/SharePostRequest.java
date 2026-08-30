package com.socialapp.post.dto;

import jakarta.validation.constraints.Size;

public record SharePostRequest(@Size(max = 280) String caption) {
}
