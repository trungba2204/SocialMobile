package com.socialapp.support;

import com.socialapp.common.security.AuthPrincipal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Set;

public final class WithPrincipal {

    private WithPrincipal() {
    }

    public static AuthPrincipal set(long userId, String username) {
        AuthPrincipal principal = new AuthPrincipal(userId, username, Set.of("ROLE_USER"));
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        return principal;
    }

    public static void clear() {
        SecurityContextHolder.clearContext();
    }
}
