package com.socialapp.friend;

import com.socialapp.common.exception.ConflictException;
import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.friend.dto.FriendRequestDto;
import com.socialapp.friend.dto.FriendStatus;
import com.socialapp.friend.spi.FriendGraphPort;
import com.socialapp.notification.NotificationType;
import com.socialapp.notification.spi.NotificationPort;
import com.socialapp.user.User;
import com.socialapp.user.UserMapper;
import com.socialapp.user.UserRepository;
import com.socialapp.user.dto.UserDto;
import com.socialapp.user.spi.ProfileStatsPort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class FriendService implements FriendGraphPort, ProfileStatsPort {

    private static final int MAX_SUGGESTIONS = 20;

    private final FriendshipRepository friendships;
    private final FriendRequestRepository requests;
    private final UserRepository users;
    private final UserMapper userMapper;
    private final NotificationPort notifications;

    public FriendService(FriendshipRepository friendships, FriendRequestRepository requests,
                         UserRepository users, UserMapper userMapper, NotificationPort notifications) {
        this.friendships = friendships;
        this.requests = requests;
        this.users = users;
        this.userMapper = userMapper;
        this.notifications = notifications;
    }

    @Transactional
    public FriendRequestDto sendRequest(long fromId, long toId) {
        if (fromId == toId) {
            throw new ConflictException("You cannot send a friend request to yourself");
        }
        if (!users.existsById(toId)) {
            throw new ResourceNotFoundException("User not found");
        }
        if (areFriends(fromId, toId)) {
            throw new ConflictException("You are already friends");
        }
        if (pendingBetween(fromId, toId)) {
            throw new ConflictException("A friend request is already pending");
        }
        FriendRequest saved = requests.save(new FriendRequest(fromId, toId));
        notifications.record(toId, fromId, NotificationType.FRIEND_REQUEST, "USER", fromId);
        return toDto(saved);
    }

    @Transactional
    public void accept(long requestId, long userId) {
        FriendRequest request = requests.findByIdAndAddresseeId(requestId, userId)
                .orElseThrow(() -> new ForbiddenException("You cannot act on this request"));
        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new ConflictException("Request is no longer pending");
        }
        request.setStatus(FriendRequestStatus.ACCEPTED);
        friendships.save(Friendship.of(request.getRequesterId(), request.getAddresseeId()));
        notifications.record(request.getRequesterId(), userId,
                NotificationType.FRIEND_ACCEPTED, "USER", userId);
    }

    @Transactional
    public void reject(long requestId, long userId) {
        FriendRequest request = requests.findByIdAndAddresseeId(requestId, userId)
                .orElseThrow(() -> new ForbiddenException("You cannot act on this request"));
        request.setStatus(FriendRequestStatus.REJECTED);
    }

    @Transactional
    public void removeFriend(long userId, long otherId) {
        long low = Math.min(userId, otherId);
        long high = Math.max(userId, otherId);
        friendships.deleteOrderedPair(low, high);
        requests.findByRequesterIdAndAddresseeId(userId, otherId).ifPresent(requests::delete);
        requests.findByRequesterIdAndAddresseeId(otherId, userId).ifPresent(requests::delete);
    }

    @Transactional(readOnly = true)
    public Page<UserDto> listFriends(long userId, Pageable pageable) {
        return friendships.findFriends(userId, pageable).map(userMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<FriendRequestDto> incomingRequests(long userId, Pageable pageable) {
        return requests.findByAddresseeIdAndStatusOrderByCreatedAtDesc(
                userId, FriendRequestStatus.PENDING, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<UserDto> suggestions(long userId) {
        Set<Long> friendIds = friendIds(userId);
        Set<Long> exclude = new HashSet<>(friendIds);
        exclude.add(userId);
        requests.findByRequesterIdAndStatus(userId, FriendRequestStatus.PENDING)
                .forEach(r -> exclude.add(r.getAddresseeId()));
        requests.findByAddresseeIdAndStatus(userId, FriendRequestStatus.PENDING)
                .forEach(r -> exclude.add(r.getRequesterId()));

        Set<Long> candidates = new HashSet<>();
        for (Long friendId : friendIds) {
            candidates.addAll(friendIds(friendId));
        }
        candidates.removeAll(exclude);

        List<Long> ordered = new ArrayList<>(candidates);
        if (ordered.size() > MAX_SUGGESTIONS) {
            ordered = ordered.subList(0, MAX_SUGGESTIONS);
        }
        return userMapper.toDtoList(users.findByIdIn(ordered));
    }

    // --- SPI: FriendGraphPort ---

    @Override
    @Transactional(readOnly = true)
    public Set<Long> friendIds(long userId) {
        return friendships.findFriendIds(userId);
    }

    // --- SPI: ProfileStatsPort ---

    @Override
    @Transactional(readOnly = true)
    public long friendCount(long userId) {
        return friendships.findAllForUser(userId).size();
    }

    @Override
    @Transactional(readOnly = true)
    public FriendStatus friendStatus(long viewerId, long targetId) {
        if (viewerId == targetId) {
            return FriendStatus.SELF;
        }
        if (areFriends(viewerId, targetId)) {
            return FriendStatus.FRIENDS;
        }
        Optional<FriendRequest> outgoing = requests.findByRequesterIdAndAddresseeId(viewerId, targetId);
        if (outgoing.isPresent() && outgoing.get().getStatus() == FriendRequestStatus.PENDING) {
            return FriendStatus.PENDING_OUT;
        }
        Optional<FriendRequest> incoming = requests.findByRequesterIdAndAddresseeId(targetId, viewerId);
        if (incoming.isPresent() && incoming.get().getStatus() == FriendRequestStatus.PENDING) {
            return FriendStatus.PENDING_IN;
        }
        return FriendStatus.NONE;
    }

    // --- helpers ---

    private boolean areFriends(long a, long b) {
        return friendships.existsOrderedPair(Math.min(a, b), Math.max(a, b));
    }

    private boolean pendingBetween(long a, long b) {
        return requests.findByRequesterIdAndAddresseeId(a, b)
                .filter(r -> r.getStatus() == FriendRequestStatus.PENDING).isPresent()
                || requests.findByRequesterIdAndAddresseeId(b, a)
                .filter(r -> r.getStatus() == FriendRequestStatus.PENDING).isPresent();
    }

    private FriendRequestDto toDto(FriendRequest request) {
        User requester = users.findById(request.getRequesterId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new FriendRequestDto(request.getId(), userMapper.toDto(requester),
                request.getStatus().name(), request.getCreatedAt());
    }
}
