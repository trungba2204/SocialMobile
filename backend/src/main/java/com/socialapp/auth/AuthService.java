package com.socialapp.auth;

import com.socialapp.auth.dto.AuthResponse;
import com.socialapp.auth.dto.LoginRequest;
import com.socialapp.auth.dto.RegisterRequest;
import com.socialapp.auth.dto.TokenPair;
import com.socialapp.auth.jwt.JwtService;
import com.socialapp.common.exception.ConflictException;
import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.user.Role;
import com.socialapp.user.RoleRepository;
import com.socialapp.user.User;
import com.socialapp.user.UserMapper;
import com.socialapp.user.UserRepository;
import com.socialapp.user.dto.UserDto;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository users;
    private final RoleRepository roles;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    public AuthService(UserRepository users, RoleRepository roles, RefreshTokenRepository refreshTokens,
                       PasswordEncoder passwordEncoder, JwtService jwtService, UserMapper userMapper) {
        this.users = users;
        this.roles = roles;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userMapper = userMapper;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email())) {
            throw new ConflictException("Email is already registered");
        }
        if (users.existsByUsername(req.username())) {
            throw new ConflictException("Username is already taken");
        }
        Role userRole = roles.findByName(Role.ROLE_USER)
                .orElseGet(() -> roles.save(new Role(Role.ROLE_USER)));

        User user = new User(req.email(), req.username(),
                passwordEncoder.encode(req.password()), req.displayName());
        user.addRole(userRole);
        user = users.save(user);

        return issue(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmailOrUsername(req.emailOrUsername(), req.emailOrUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        if (!user.isActive()) {
            throw new ForbiddenException("Account is disabled");
        }
        return issue(user);
    }

    @Transactional
    public TokenPair refresh(String rawRefresh) {
        RefreshToken current = refreshTokens.findByTokenAndRevokedFalse(rawRefresh)
                .orElseThrow(() -> new ForbiddenException("Invalid refresh token"));
        if (!current.isActive()) {
            throw new ForbiddenException("Refresh token expired");
        }
        current.revoke();
        User user = current.getUser();
        String access = jwtService.generateAccessToken(user);
        String newRefresh = persistRefreshToken(user);
        return new TokenPair(access, newRefresh);
    }

    @Transactional
    public void logout(String rawRefresh) {
        refreshTokens.findByToken(rawRefresh).ifPresent(RefreshToken::revoke);
    }

    @Transactional(readOnly = true)
    public UserDto currentUser(Long userId) {
        return userMapper.toDto(users.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    private AuthResponse issue(User user) {
        String access = jwtService.generateAccessToken(user);
        String refresh = persistRefreshToken(user);
        return new AuthResponse(access, refresh, userMapper.toDto(user));
    }

    private String persistRefreshToken(User user) {
        String value = UUID.randomUUID().toString();
        refreshTokens.save(new RefreshToken(value, user, jwtService.refreshExpiry()));
        return value;
    }
}
