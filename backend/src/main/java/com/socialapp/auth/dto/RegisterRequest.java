package com.socialapp.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Pattern(regexp = "^[a-z0-9_]{3,20}$",
                message = "must be 3-20 chars of lowercase letters, digits or underscore") String username,
        @NotBlank @Size(max = 60) String displayName,
        @NotBlank @Size(min = 8, max = 100)
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                message = "must contain at least one letter and one digit") String password
) {
}
