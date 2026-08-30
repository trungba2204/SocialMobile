package com.socialapp.auth.dto;

import com.socialapp.user.dto.UserDto;

public record AuthResponse(String accessToken, String refreshToken, UserDto user) {
}
