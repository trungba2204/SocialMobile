package com.socialapp.auth;

import com.socialapp.auth.dto.AuthResponse;
import com.socialapp.auth.dto.LoginRequest;
import com.socialapp.auth.dto.LogoutRequest;
import com.socialapp.auth.dto.RefreshRequest;
import com.socialapp.auth.dto.RegisterRequest;
import com.socialapp.auth.dto.TokenPair;
import com.socialapp.common.security.AuthPrincipal;
import com.socialapp.common.security.CurrentUser;
import com.socialapp.user.dto.UserDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public TokenPair refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserDto me(@CurrentUser AuthPrincipal principal) {
        return authService.currentUser(principal.userId());
    }
}
