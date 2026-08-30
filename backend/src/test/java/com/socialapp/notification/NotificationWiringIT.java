package com.socialapp.notification;

import com.socialapp.post.PostRepository;
import com.socialapp.post.Privacy;
import com.socialapp.post.PostService;
import com.socialapp.post.dto.CreatePostRequest;
import com.socialapp.user.Role;
import com.socialapp.user.RoleRepository;
import com.socialapp.user.User;
import com.socialapp.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class NotificationWiringIT {

    @Autowired PostService postService;
    @Autowired PostRepository postRepository;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired NotificationRepository notifications;

    @Test
    void likingAPostNotifiesTheAuthor() {
        Role role = roles.findByName(Role.ROLE_USER)
                .orElseGet(() -> roles.save(new Role(Role.ROLE_USER)));
        User author = newUser("author");
        author.addRole(role);
        author = users.save(author);
        User liker = users.save(newUser("liker"));

        var post = postService.create(author.getId(),
                new CreatePostRequest("hello world", Privacy.PUBLIC, null, null), null);

        postService.like(post.id(), liker.getId());

        var page = notifications.findByRecipientIdOrderByCreatedAtDesc(
                author.getId(), PageRequest.of(0, 10));
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getType()).isEqualTo(NotificationType.POST_LIKE);
        assertThat(page.getContent().get(0).getActorId()).isEqualTo(liker.getId());
    }

    private User newUser(String name) {
        return new User(name + "@example.com", name, "hash", name);
    }
}
