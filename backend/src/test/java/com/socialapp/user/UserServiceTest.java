package com.socialapp.user;

import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.friend.dto.FriendStatus;
import com.socialapp.storage.StorageService;
import com.socialapp.storage.StoredFile;
import com.socialapp.user.dto.UpdateUserRequest;
import com.socialapp.user.dto.UserProfileDto;
import com.socialapp.user.spi.PostStatsPort;
import com.socialapp.user.spi.ProfileStatsPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository users;
    @Mock UserMapper userMapper;
    @Mock StorageService storage;
    @Mock ProfileStatsPort profileStats;
    @Mock PostStatsPort postStats;

    UserService service;

    @BeforeEach
    void setup() {
        service = new UserService(users, userMapper, storage, profileStats, postStats);
    }

    private User user(long id) {
        User u = new User("a@b.com", "alice", "hash", "Alice");
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    @Test
    void getProfileAssemblesStats() {
        when(users.findById(2L)).thenReturn(Optional.of(user(2L)));
        when(profileStats.friendCount(2L)).thenReturn(5L);
        when(postStats.postCount(2L)).thenReturn(9L);
        when(profileStats.friendStatus(1L, 2L)).thenReturn(FriendStatus.FRIENDS);

        UserProfileDto dto = service.getProfile(2L, 1L);

        assertThat(dto.friendCount()).isEqualTo(5L);
        assertThat(dto.postCount()).isEqualTo(9L);
        assertThat(dto.friendStatus()).isEqualTo(FriendStatus.FRIENDS);
    }

    @Test
    void getProfileUnknownIdThrows() {
        when(users.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getProfile(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateMeOnlyTouchesProvidedFields() {
        User u = user(1L);
        u.setDisplayName("Old");
        u.setBio("old bio");
        when(users.findById(1L)).thenReturn(Optional.of(u));

        service.updateMe(1L, new UpdateUserRequest("New Name", null));

        assertThat(u.getDisplayName()).isEqualTo("New Name");
        assertThat(u.getBio()).isEqualTo("old bio");
    }

    @Test
    void setAvatarStoresAndDeletesPrevious() {
        User u = user(1L);
        u.setAvatarUrl("/api/media/avatars/old.png");
        when(users.findById(1L)).thenReturn(Optional.of(u));
        when(storage.store(any(), eq("avatars"))).thenReturn(
                new StoredFile("avatars/new.png", "/api/media/avatars/new.png"));

        String url = service.setAvatar(1L, new MockMultipartFile("file", new byte[]{1}));

        assertThat(url).isEqualTo("/api/media/avatars/new.png");
        assertThat(u.getAvatarUrl()).isEqualTo("/api/media/avatars/new.png");
        verify(storage).delete("/api/media/avatars/old.png");
    }
}
