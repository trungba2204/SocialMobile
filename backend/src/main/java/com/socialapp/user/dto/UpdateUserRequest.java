package com.socialapp.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(max = 60) String displayName,
        @Size(max = 280) String bio
) {
}
