package com.socialapp.friend;

import com.socialapp.common.exception.ConflictException;
import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.notification.NotificationType;
import com.socialapp.notification.spi.NotificationPort;
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

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FriendServiceTest {

    @Mock FriendshipRepository friendships;
    @Mock FriendRequestRepository requests;
    @Mock UserRepository users;
    @Mock UserMapper userMapper;
    @Mock NotificationPort notifications;

    FriendService service;

    @BeforeEach
    void setup() {
        service = new FriendService(friendships, requests, users, userMapper, notifications);
        lenient().when(users.existsById(any())).thenReturn(true);
        lenient().when(userMapper.toDto(any())).thenReturn(new UserDto(2L, "bob", "Bob", null, null));
        lenient().when(users.findById(any())).thenAnswer(i -> {
            User u = new User("u@x.com", "u", "h", "U");
            ReflectionTestUtils.setField(u, "id", i.getArgument(0));
            return Optional.of(u);
        });
    }

    @Test
    void sendRequestHappyPathNotifies() {
        when(friendships.existsOrderedPair(1L, 2L)).thenReturn(false);
        when(requests.findByRequesterIdAndAddresseeId(any(), any())).thenReturn(Optional.empty());
        when(requests.save(any())).thenAnswer(i -> {
            FriendRequest r = i.getArgument(0);
            ReflectionTestUtils.setField(r, "id", 5L);
            ReflectionTestUtils.setField(r, "createdAt", java.time.Instant.now());
            return r;
        });

        service.sendRequest(1L, 2L);

        verify(notifications).record(eq(2L), eq(1L), eq(NotificationType.FRIEND_REQUEST), eq("USER"), eq(1L));
    }

    @Test
    void sendRequestToSelfConflicts() {
        assertThatThrownBy(() -> service.sendRequest(1L, 1L)).isInstanceOf(ConflictException.class);
    }

    @Test
    void sendRequestWhenReversePendingConflicts() {
        when(friendships.existsOrderedPair(1L, 2L)).thenReturn(false);
        FriendRequest reverse = new FriendRequest(2L, 1L);
        when(requests.findByRequesterIdAndAddresseeId(1L, 2L)).thenReturn(Optional.empty());
        when(requests.findByRequesterIdAndAddresseeId(2L, 1L)).thenReturn(Optional.of(reverse));

        assertThatThrownBy(() -> service.sendRequest(1L, 2L)).isInstanceOf(ConflictException.class);
    }

    @Test
    void acceptByNonAddresseeForbidden() {
        when(requests.findByIdAndAddresseeId(9L, 3L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.accept(9L, 3L)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void acceptCreatesFriendshipAndNotifies() {
        FriendRequest req = new FriendRequest(1L, 2L);
        ReflectionTestUtils.setField(req, "id", 9L);
        when(requests.findByIdAndAddresseeId(9L, 2L)).thenReturn(Optional.of(req));

        service.accept(9L, 2L);

        assertThat(req.getStatus()).isEqualTo(FriendRequestStatus.ACCEPTED);
        verify(friendships).save(any(Friendship.class));
        verify(notifications).record(eq(1L), eq(2L), eq(NotificationType.FRIEND_ACCEPTED), eq("USER"), eq(2L));
    }

    @Test
    void removeFriendDeletesOrderedPair() {
        when(requests.findByRequesterIdAndAddresseeId(any(), any())).thenReturn(Optional.empty());
        service.removeFriend(5L, 2L);
        verify(friendships).deleteOrderedPair(2L, 5L);
    }

    @Test
    void suggestionsExcludeSelfFriendsAndPending() {
        when(friendships.findFriendIds(1L)).thenReturn(Set.of(2L));
        when(friendships.findFriendIds(2L)).thenReturn(Set.of(1L, 3L, 4L));
        when(requests.findByRequesterIdAndStatus(1L, FriendRequestStatus.PENDING))
                .thenReturn(List.of(new FriendRequest(1L, 3L)));
        when(requests.findByAddresseeIdAndStatus(1L, FriendRequestStatus.PENDING)).thenReturn(List.of());
        when(users.findByIdIn(any())).thenReturn(List.of());

        service.suggestions(1L);

        verify(users).findByIdIn(argThatContainsOnly4());
    }

    private static java.util.Collection<Long> argThatContainsOnly4() {
        return org.mockito.ArgumentMatchers.argThat(c -> c.size() == 1 && c.contains(4L));
    }
}
