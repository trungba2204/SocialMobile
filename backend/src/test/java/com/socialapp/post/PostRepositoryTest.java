package com.socialapp.post;

import com.socialapp.user.User;
import com.socialapp.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class PostRepositoryTest {

    @Autowired PostRepository posts;
    @Autowired UserRepository users;

    private User me;
    private User friend;
    private User stranger;

    @BeforeEach
    void seed() {
        me = users.save(new User("me@x.com", "me", "h", "Me"));
        friend = users.save(new User("fr@x.com", "friend", "h", "Friend"));
        stranger = users.save(new User("st@x.com", "stranger", "h", "Stranger"));

        posts.save(new Post(me, "mine private", Privacy.PRIVATE));
        posts.save(new Post(friend, "friend friends-only", Privacy.FRIENDS));
        posts.save(new Post(friend, "friend public", Privacy.PUBLIC));
        posts.save(new Post(stranger, "stranger friends-only", Privacy.FRIENDS));
        posts.save(new Post(stranger, "stranger public", Privacy.PUBLIC));
        posts.save(new Post(stranger, "stranger private", Privacy.PRIVATE));
    }

    @Test
    void feedIsOwnPlusFriendsRespectingPrivacy() {
        posts.save(new Post(me, "mine public", Privacy.PUBLIC));
        posts.save(new Post(me, "mine friends-only", Privacy.FRIENDS));
        posts.save(new Post(friend, "friend private", Privacy.PRIVATE));

        Page<Post> feed = posts.findFeed(me.getId(), Set.of(friend.getId(), -1L), PageRequest.of(0, 50));

        List<String> contents = feed.getContent().stream().map(Post::getContent).toList();
        assertThat(contents).contains("mine private", "mine public", "mine friends-only",
                "friend friends-only", "friend public");
        assertThat(contents).doesNotContain("friend private",
                "stranger friends-only", "stranger public", "stranger private");
    }

    @Test
    void feedIsNewestFirst() {
        Page<Post> feed = posts.findFeed(me.getId(), Set.of(-1L), PageRequest.of(0, 20));
        List<Post> content = feed.getContent();
        for (int i = 1; i < content.size(); i++) {
            assertThat(content.get(i - 1).getCreatedAt())
                    .isAfterOrEqualTo(content.get(i).getCreatedAt());
        }
    }
}
