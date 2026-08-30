package com.socialapp.friend;

import com.socialapp.user.User;
import com.socialapp.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class FriendshipRepositoryTest {

    @Autowired FriendshipRepository friendships;
    @Autowired UserRepository users;

    private User a;
    private User b;

    @BeforeEach
    void seed() {
        a = users.save(new User("a@x.com", "aaa", "h", "A"));
        b = users.save(new User("b@x.com", "bbb", "h", "B"));
    }

    @Test
    void ofStoresCanonicalOrderAndPairLookupIsSymmetric() {
        friendships.save(Friendship.of(b.getId(), a.getId()));

        long low = Math.min(a.getId(), b.getId());
        long high = Math.max(a.getId(), b.getId());
        assertThat(friendships.existsOrderedPair(low, high)).isTrue();
        assertThat(friendships.findFriendIds(a.getId())).containsExactly(b.getId());
        assertThat(friendships.findFriendIds(b.getId())).containsExactly(a.getId());
        assertThat(friendships.findFriends(a.getId(), PageRequest.of(0, 10)))
                .extracting(User::getUsername).containsExactly("bbb");
    }
}
