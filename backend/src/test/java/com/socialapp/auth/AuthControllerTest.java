package com.socialapp.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialapp.common.security.CurrentUserArgumentResolver;
import com.socialapp.common.exception.GlobalExceptionHandler;
import com.socialapp.support.WithPrincipal;
import com.socialapp.user.dto.UserDto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest {

    private final AuthService authService = mock(AuthService.class);
    private final ObjectMapper json = new ObjectMapper();
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new CurrentUserArgumentResolver())
                .build();
    }

    @AfterEach
    void tearDown() {
        WithPrincipal.clear();
    }

    @Test
    void registerReturnsTokensAndNeverLeaksPassword() throws Exception {
        when(authService.register(any())).thenReturn(
                new com.socialapp.auth.dto.AuthResponse("a.jwt", "refresh-1",
                        new UserDto(1L, "alice", "Alice", null, null)));

        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "email", "a@b.com", "username", "alice",
                                "displayName", "Alice", "password", "Password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("a.jwt"))
                .andExpect(jsonPath("$.user.username").value("alice"))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void registerRejectsBadUsername() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "email", "a@b.com", "username", "AB!",
                                "displayName", "Alice", "password", "Password123"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='username')]").exists());
    }

    @Test
    void loginBadCredentialsReturns401() throws Exception {
        when(authService.login(any())).thenThrow(new BadCredentialsException("Invalid credentials"));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "emailOrUsername", "alice", "password", "nope"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meReturnsCurrentUser() throws Exception {
        WithPrincipal.set(7L, "alice");
        when(authService.currentUser(7L)).thenReturn(new UserDto(7L, "alice", "Alice", null, null));

        mvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7));
    }
}
