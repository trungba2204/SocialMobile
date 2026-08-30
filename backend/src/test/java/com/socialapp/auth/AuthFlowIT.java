package com.socialapp.auth;

import com.socialapp.auth.dto.AuthResponse;
import com.socialapp.auth.dto.TokenPair;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AuthFlowIT {

    @Autowired
    private TestRestTemplate rest;

    private HttpHeaders jsonHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }

    @Test
    void registerThenMeThenRefreshRotates() {
        Map<String, String> register = Map.of(
                "email", "flow@example.com", "username", "flowuser",
                "displayName", "Flow User", "password", "Password123");

        ResponseEntity<AuthResponse> registered = rest.postForEntity(
                "/api/auth/register", new HttpEntity<>(register, jsonHeaders()), AuthResponse.class);
        assertThat(registered.getStatusCode()).isEqualTo(HttpStatus.OK);
        String access = registered.getBody().accessToken();
        String refresh = registered.getBody().refreshToken();

        HttpHeaders authHeaders = new HttpHeaders();
        authHeaders.setBearerAuth(access);
        ResponseEntity<String> me = rest.exchange("/api/auth/me", HttpMethod.GET,
                new HttpEntity<>(authHeaders), String.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(me.getBody()).contains("flowuser");

        ResponseEntity<TokenPair> refreshed = rest.postForEntity("/api/auth/refresh",
                new HttpEntity<>(Map.of("refreshToken", refresh), jsonHeaders()), TokenPair.class);
        assertThat(refreshed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(refreshed.getBody().refreshToken()).isNotEqualTo(refresh);

        ResponseEntity<String> reused = rest.postForEntity("/api/auth/refresh",
                new HttpEntity<>(Map.of("refreshToken", refresh), jsonHeaders()), String.class);
        assertThat(reused.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void protectedEndpointRequiresToken() {
        ResponseEntity<String> me = rest.getForEntity("/api/auth/me", String.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
