package com.socialapp.post.comment;

import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.common.exception.ValidationException;
import com.socialapp.notification.NotificationType;
import com.socialapp.notification.spi.NotificationPort;
import com.socialapp.post.Post;
import com.socialapp.post.PostRepository;
import com.socialapp.post.Privacy;
import com.socialapp.post.comment.dto.CreateCommentRequest;
import com.socialapp.user.User;
import com.socialapp.user.UserMapper;
import com.socialapp.user.UserRepository;
import com.socialapp.user.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock CommentRepository comments;
    @Mock PostRepository posts;
    @Mock UserRepository users;
    @Mock NotificationPort notifications;
    @Mock UserMapper userMapper;

    CommentService service;

    private User postAuthor;
    private User commenter;
    private Post post;

    @BeforeEach
    void setup() {
        service = new CommentService(comments, posts, users, new CommentMapper(userMapper), notifications);
        postAuthor = user(1L, "author");
        commenter = user(2L, "commenter");
        post = new Post(postAuthor, "hi", Privacy.PUBLIC);
        ReflectionTestUtils.setField(post, "id", 10L);
        lenient().when(userMapper.toDto(any())).thenReturn(new UserDto(2L, "commenter", "C", null, null));
        lenient().when(comments.save(any())).thenAnswer(i -> {
            Comment c = i.getArgument(0);
            ReflectionTestUtils.setField(c, "id", 99L);
            ReflectionTestUtils.setField(c, "createdAt", java.time.Instant.now());
            return c;
        });
    }

    private User user(long id, String name) {
        User u = new User(name + "@x.com", name, "h", name);
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    @Test
    void createTopLevelNotifiesPostAuthor() {
        when(posts.findById(10L)).thenReturn(Optional.of(post));
        when(users.findById(2L)).thenReturn(Optional.of(commenter));

        service.create(10L, 2L, new CreateCommentRequest("nice", null));

        verify(notifications).record(eq(1L), eq(2L), eq(NotificationType.POST_COMMENT), eq("POST"), eq(10L));
    }

    @Test
    void commentingOnOwnPostDoesNotNotify() {
        when(posts.findById(10L)).thenReturn(Optional.of(post));
        when(users.findById(1L)).thenReturn(Optional.of(postAuthor));

        service.create(10L, 1L, new CreateCommentRequest("mine", null));

        verify(notifications, never()).record(anyLong(), anyLong(), any(), any(), any());
    }

    @Test
    void replyToParentOnDifferentPostRejected() {
        when(posts.findById(10L)).thenReturn(Optional.of(post));
        when(users.findById(2L)).thenReturn(Optional.of(commenter));
        Post otherPost = new Post(postAuthor, "other", Privacy.PUBLIC);
        ReflectionTestUtils.setField(otherPost, "id", 11L);
        Comment parent = new Comment(otherPost, commenter, "parent", null);
        when(comments.findById(5L)).thenReturn(Optional.of(parent));

        assertThatThrownBy(() -> service.create(10L, 2L, new CreateCommentRequest("reply", 5L)))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void deleteByOutsiderForbidden() {
        Comment c = new Comment(post, commenter, "x", null);
        ReflectionTestUtils.setField(c, "id", 7L);
        when(comments.findById(7L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.delete(7L, 3L)).isInstanceOf(ForbiddenException.class);
    }
}
