package com.socialapp.auth.jwt;

import com.socialapp.common.security.AuthPrincipal;
import com.socialapp.user.Role;
import com.socialapp.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtProperties props(String secret, Duration access, Duration refresh) {
        JwtProperties p = new JwtProperties();
        p.setSecret(secret);
        p.setAccessTtl(access);
        p.setRefreshTtl(refresh);
        return p;
    }

    private User userWithId(long id, String username, String... roles) {
        User u = new User(username + "@x.com", username, "hash", username);
        for (String r : roles) {
            u.addRole(new Role(r));
        }
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    @Test
    void roundTripsClaims() {
        JwtService svc = new JwtService(props("s".repeat(40), Duration.ofMinutes(15), Duration.ofDays(7)));
        String token = svc.generateAccessToken(userWithId(42L, "alice", Role.ROLE_USER));

        AuthPrincipal p = svc.parse(token).orElseThrow();

        assertThat(p.userId()).isEqualTo(42L);
        assertThat(p.username()).isEqualTo("alice");
        assertThat(p.roles()).contains("ROLE_USER");
    }

    @Test
    void rejectsExpired() {
        JwtService svc = new JwtService(props("s".repeat(40), Duration.ofSeconds(-10), Duration.ofDays(7)));
        assertThat(svc.parse(svc.generateAccessToken(userWithId(1L, "x")))).isEmpty();
    }

    @Test
    void rejectsWrongSignature() {
        String token = new JwtService(props("a".repeat(40), Duration.ofMinutes(5), Duration.ofDays(7)))
                .generateAccessToken(userWithId(1L, "x"));
        Optional<AuthPrincipal> parsed = new JwtService(props("b".repeat(40), Duration.ofMinutes(5), Duration.ofDays(7)))
                .parse(token);
        assertThat(parsed).isEmpty();
    }
}
