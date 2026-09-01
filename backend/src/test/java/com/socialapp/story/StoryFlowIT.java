package com.socialapp.story;

import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.friend.FriendshipRepository;
import com.socialapp.friend.Friendship;
import com.socialapp.story.dto.StoryDto;
import com.socialapp.story.dto.StoryReelDto;
import com.socialapp.user.Role;
import com.socialapp.user.RoleRepository;
import com.socialapp.user.User;
import com.socialapp.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class StoryFlowIT {

    @Autowired StoryService service;
    @Autowired StoryRepository stories;
    @Autowired StoryViewRepository storyViews;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired FriendshipRepository friendships;

    private User newUser(String name) {
        Role role = roles.findByName(Role.ROLE_USER).orElseGet(() -> roles.save(new Role(Role.ROLE_USER)));
        User u = new User(name + "@example.com", name, "hash", name);
        u.addRole(role);
        return users.save(u);
    }

    @Test
    void storyLifecycleEndToEnd() {
        User a = newUser("story-a");
        User b = newUser("story-b");
        User c = newUser("story-c");
        friendships.save(Friendship.of(a.getId(), b.getId()));

        MultipartFile png = new MockMultipartFile("file", "s.png", "image/png", new byte[]{1, 2, 3, 4});
        StoryDto created = service.create(a.getId(), png, "hello");
        assertThat(created.id()).isNotNull();
        assertThat(created.expiresAt()).isAfter(Instant.now());

        // B (friend) sees A's reel, unseen; C (stranger) does not
        List<StoryReelDto> bReels = service.activeReels(b.getId());
        assertThat(bReels).anyMatch(r -> r.author().id().equals(a.getId()) && r.hasUnseen());
        assertThat(service.activeReels(c.getId()))
                .noneMatch(r -> r.author().id().equals(a.getId()));

        // C cannot fetch the story
        assertThatThrownBy(() -> service.get(created.id(), c.getId()))
                .isInstanceOf(ForbiddenException.class);

        // B views -> hasUnseen flips false; dup view is a no-op
        service.recordView(created.id(), b.getId());
        service.recordView(created.id(), b.getId());
        assertThat(storyViews.countByStoryId(created.id())).isEqualTo(1);
        assertThat(service.activeReels(b.getId()))
                .filteredOn(r -> r.author().id().equals(a.getId()))
                .allMatch(r -> !r.hasUnseen());

        // self-view is a no-op
        service.recordView(created.id(), a.getId());
        assertThat(storyViews.countByStoryId(created.id())).isEqualTo(1);

        // viewers list for owner
        assertThat(service.viewers(created.id(), a.getId(), PageRequest.of(0, 10)).getTotalElements())
                .isEqualTo(1);

        // expired story is excluded
        Story expired = stories.save(new Story(a.getId(), "/api/media/stories/old.png", null,
                Instant.now().minus(Duration.ofHours(1))));
        assertThat(service.activeReels(b.getId()).stream()
                .flatMap(r -> r.stories().stream())
                .anyMatch(s -> s.id().equals(expired.getId()))).isFalse();

        // delete by owner -> gone from B's reels
        service.delete(created.id(), a.getId());
        assertThat(service.activeReels(b.getId()))
                .noneMatch(r -> r.author().id().equals(a.getId())
                        && r.stories().stream().anyMatch(s -> s.id().equals(created.id())));
    }
}
