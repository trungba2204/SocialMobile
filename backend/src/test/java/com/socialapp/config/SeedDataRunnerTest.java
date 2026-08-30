package com.socialapp.config;

import com.socialapp.friend.FriendRequestRepository;
import com.socialapp.friend.FriendRequestStatus;
import com.socialapp.notification.NotificationRepository;
import com.socialapp.post.PostRepository;
import com.socialapp.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "app.seed.enabled=true")
class SeedDataRunnerTest {

    @Autowired SeedDataRunner runner;
    @Autowired UserRepository users;
    @Autowired PostRepository posts;
    @Autowired FriendRequestRepository friendRequests;
    @Autowired NotificationRepository notifications;

    @Test
    void seedsExpectedDataAndIsIdempotent() {
        runner.run(null);
        long usersAfterFirst = users.count();
        long postsAfterFirst = posts.count();

        runner.run(null);

        assertThat(usersAfterFirst).isEqualTo(12);
        assertThat(users.count()).isEqualTo(usersAfterFirst);
        assertThat(posts.count()).isEqualTo(postsAfterFirst);
        assertThat(postsAfterFirst).isGreaterThanOrEqualTo(30);

        var alice = users.findByUsername("alice").orElseThrow();
        assertThat(friendRequests.findByAddresseeIdAndStatusOrderByCreatedAtDesc(
                alice.getId(), FriendRequestStatus.PENDING, PageRequest.of(0, 10)))
                .isNotEmpty();
        assertThat(notifications.countByRecipientIdAndReadFalse(alice.getId())).isGreaterThan(0);
    }
}
