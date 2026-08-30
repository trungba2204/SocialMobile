package com.socialapp.user;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository repo;

    private User user(String username, String displayName) {
        return new User(username + "@example.com", username, "hash", displayName);
    }

    @Test
    void findByUsernameAndExistsByEmail() {
        repo.save(user("alice", "Alice Nguyen"));

        assertThat(repo.findByUsername("alice")).isPresent();
        assertThat(repo.existsByEmail("alice@example.com")).isTrue();
        assertThat(repo.existsByUsername("bob")).isFalse();
    }

    @Test
    void searchMatchesUsernameOrDisplayNameCaseInsensitive() {
        repo.save(user("alice", "Alice Nguyen"));
        repo.save(user("bob", "Bobby Tables"));

        Page<User> byUsername = repo.findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
                "ALI", "ALI", PageRequest.of(0, 10));
        assertThat(byUsername).extracting(User::getUsername).containsExactly("alice");

        Page<User> byDisplayName = repo.findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
                "tables", "tables", PageRequest.of(0, 10));
        assertThat(byDisplayName).extracting(User::getUsername).containsExactly("bob");
    }
}
