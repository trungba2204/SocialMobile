package com.socialapp.auth;

import com.socialapp.auth.dto.AuthResponse;
import com.socialapp.auth.dto.LoginRequest;
import com.socialapp.auth.dto.RegisterRequest;
import com.socialapp.auth.dto.TokenPair;
import com.socialapp.auth.jwt.JwtService;
import com.socialapp.common.exception.ConflictException;
import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.user.Role;
import com.socialapp.user.RoleRepository;
import com.socialapp.user.User;
import com.socialapp.user.UserMapper;
import com.socialapp.user.UserRepository;
import com.socialapp.user.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository users;
    @Mock RoleRepository roles;
    @Mock RefreshTokenRepository refreshTokens;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock UserMapper userMapper;

    @InjectMocks AuthService service;

    @BeforeEach
    void stubCommon() {
        lenient().when(jwtService.generateAccessToken(any())).thenReturn("access.jwt");
        lenient().when(jwtService.refreshExpiry()).thenReturn(Instant.now().plusSeconds(3600));
        lenient().when(userMapper.toDto(any())).thenReturn(new UserDto(1L, "alice", "Alice", null, null));
    }

    private User persistedUser(String rawPasswordHash) {
        User u = new User("a@b.com", "alice", rawPasswordHash, "Alice");
        ReflectionTestUtils.setField(u, "id", 1L);
        return u;
    }

    @Test
    void registerHashesPasswordAndReturnsTokens() {
        when(users.existsByEmail(any())).thenReturn(false);
        when(users.existsByUsername(any())).thenReturn(false);
        when(roles.findByName(Role.ROLE_USER)).thenReturn(Optional.of(new Role(Role.ROLE_USER)));
        when(passwordEncoder.encode("Password123")).thenReturn("$2a$hash");
        when(users.save(any())).thenAnswer(i -> {
            User u = i.getArgument(0);
            ReflectionTestUtils.setField(u, "id", 1L);
            return u;
        });

        AuthResponse res = service.register(
                new RegisterRequest("a@b.com", "alice", "Alice", "Password123"));

        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(users).save(cap.capture());
        assertThat(cap.getValue().getPasswordHash()).isEqualTo("$2a$hash");
        assertThat(res.accessToken()).isEqualTo("access.jwt");
        assertThat(res.refreshToken()).isNotBlank();
        verify(refreshTokens).save(any(RefreshToken.class));
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(users.existsByEmail("a@b.com")).thenReturn(true);
        assertThatThrownBy(() -> service.register(
                new RegisterRequest("a@b.com", "alice", "Alice", "Password123")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void loginRejectsWrongPassword() {
        when(users.findByEmailOrUsername("alice", "alice"))
                .thenReturn(Optional.of(persistedUser("$2a$stored")));
        when(passwordEncoder.matches("wrong", "$2a$stored")).thenReturn(false);

        assertThatThrownBy(() -> service.login(new LoginRequest("alice", "wrong")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void refreshRotatesToken() {
        User u = persistedUser("$2a$stored");
        RefreshToken existing = new RefreshToken("old-token", u, Instant.now().plusSeconds(3600));
        when(refreshTokens.findByTokenAndRevokedFalse("old-token")).thenReturn(Optional.of(existing));

        TokenPair pair = service.refresh("old-token");

        assertThat(existing.isRevoked()).isTrue();
        assertThat(pair.accessToken()).isEqualTo("access.jwt");
        assertThat(pair.refreshToken()).isNotEqualTo("old-token");
        verify(refreshTokens).save(any(RefreshToken.class));
    }

    @Test
    void refreshRejectsUnknownToken() {
        when(refreshTokens.findByTokenAndRevokedFalse("nope")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.refresh("nope")).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void logoutRevokesToken() {
        User u = persistedUser("$2a$stored");
        RefreshToken existing = new RefreshToken("tok", u, Instant.now().plusSeconds(3600));
        when(refreshTokens.findByToken("tok")).thenReturn(Optional.of(existing));

        service.logout("tok");

        assertThat(existing.isRevoked()).isTrue();
    }
}
