package com.socialapp.post;

import com.socialapp.common.exception.ConflictException;
import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.common.exception.ValidationException;
import com.socialapp.friend.spi.FriendGraphPort;
import com.socialapp.notification.NotificationType;
import com.socialapp.notification.spi.NotificationPort;
import com.socialapp.post.comment.CommentRepository;
import com.socialapp.post.dto.CreatePostRequest;
import com.socialapp.post.dto.LikeResponse;
import com.socialapp.post.dto.SharePostRequest;
import com.socialapp.post.like.PostLikeRepository;
import com.socialapp.post.share.ShareRepository;
import com.socialapp.storage.StorageService;
import com.socialapp.storage.StoredFile;
import com.socialapp.user.User;
import com.socialapp.user.UserMapper;
import com.socialapp.user.UserRepository;
import com.socialapp.user.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock PostRepository posts;
    @Mock PostLikeRepository likes;
    @Mock ShareRepository shares;
    @Mock CommentRepository comments;
    @Mock UserRepository users;
    @Mock StorageService storage;
    @Mock FriendGraphPort friendGraph;
    @Mock NotificationPort notifications;
    @Mock UserMapper userMapper;

    PostService service;

    private User author;

    @BeforeEach
    void setup() {
        service = new PostService(posts, likes, shares, comments, users, storage,
                new PostMapper(userMapper), friendGraph, notifications);
        author = user(1L, "author");
        lenient().when(userMapper.toDto(any())).thenReturn(new UserDto(1L, "author", "Author", null, null));
        lenient().when(friendGraph.friendIds(anyLong())).thenReturn(Set.of());
    }

    private User user(long id, String name) {
        User u = new User(name + "@x.com", name, "h", name);
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    private Post post(long id, User a, Privacy privacy) {
        Post p = new Post(a, "hello", privacy);
        ReflectionTestUtils.setField(p, "id", id);
        return p;
    }

    @Test
    void createStoresMediaWithPositions() {
        when(users.findById(1L)).thenReturn(Optional.of(author));
        when(posts.save(any())).thenAnswer(i -> {
            Post p = i.getArgument(0);
            ReflectionTestUtils.setField(p, "id", 10L);
            ReflectionTestUtils.setField(p, "createdAt", java.time.Instant.now());
            return p;
        });
        when(storage.store(any(), eq("posts")))
                .thenReturn(new StoredFile("posts/a.jpg", "/api/media/posts/a.jpg"),
                        new StoredFile("posts/b.jpg", "/api/media/posts/b.jpg"));

        var dto = service.create(1L, new CreatePostRequest("hi", Privacy.PUBLIC, null, null), List.of(
                new MockMultipartFile("media", "a.jpg", "image/jpeg", new byte[]{1}),
                new MockMultipartFile("media", "b.jpg", "image/jpeg", new byte[]{2})));

        assertThat(dto.media()).hasSize(2);
        assertThat(dto.media().get(0).position()).isEqualTo(0);
        assertThat(dto.media().get(1).position()).isEqualTo(1);
    }

    @Test
    void createRejectsEmptyPost() {
        assertThatThrownBy(() -> service.create(1L,
                new CreatePostRequest(null, Privacy.PUBLIC, null, null), List.of()))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void createRejectsTooMuchMedia() {
        List<org.springframework.web.multipart.MultipartFile> files = List.of(
                new MockMultipartFile("media", "a", "image/jpeg", new byte[]{1}),
                new MockMultipartFile("media", "b", "image/jpeg", new byte[]{1}),
                new MockMultipartFile("media", "c", "image/jpeg", new byte[]{1}),
                new MockMultipartFile("media", "d", "image/jpeg", new byte[]{1}),
                new MockMultipartFile("media", "e", "image/jpeg", new byte[]{1}));
        assertThatThrownBy(() -> service.create(1L,
                new CreatePostRequest("x", Privacy.PUBLIC, null, null), files))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void getPrivatePostByNonAuthorIsHidden() {
        when(posts.findById(5L)).thenReturn(Optional.of(post(5L, author, Privacy.PRIVATE)));
        assertThatThrownBy(() -> service.get(5L, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void likeIsIdempotentAndNotifiesAuthorOnce() {
        Post p = post(7L, author, Privacy.PUBLIC);
        when(posts.findById(7L)).thenReturn(Optional.of(p));
        when(likes.existsByPostIdAndUserId(7L, 2L)).thenReturn(false, true);
        when(likes.countByPostId(7L)).thenReturn(1L);

        LikeResponse first = service.like(7L, 2L);
        LikeResponse second = service.like(7L, 2L);

        assertThat(first.liked()).isTrue();
        assertThat(second.likeCount()).isEqualTo(1L);
        verify(likes).save(any());
        verify(notifications).record(eq(1L), eq(2L), eq(NotificationType.POST_LIKE), eq("POST"), eq(7L));
    }

    @Test
    void likingOwnPostDoesNotNotify() {
        Post p = post(7L, author, Privacy.PUBLIC);
        when(posts.findById(7L)).thenReturn(Optional.of(p));
        when(likes.existsByPostIdAndUserId(7L, 1L)).thenReturn(false);

        service.like(7L, 1L);

        verify(notifications, never()).record(anyLong(), anyLong(), any(), any(), any());
    }

    @Test
    void deleteByNonAuthorForbidden() {
        when(posts.findById(9L)).thenReturn(Optional.of(post(9L, author, Privacy.PUBLIC)));
        assertThatThrownBy(() -> service.delete(9L, 2L)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void duplicateShareConflicts() {
        Post p = post(3L, author, Privacy.PUBLIC);
        when(posts.findById(3L)).thenReturn(Optional.of(p));
        when(shares.existsByPostIdAndUserId(3L, 2L)).thenReturn(true);
        assertThatThrownBy(() -> service.share(3L, 2L, new SharePostRequest(null)))
                .isInstanceOf(ConflictException.class);
    }
}
