package com.socialapp.user;

import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.storage.StorageService;
import com.socialapp.storage.StoredFile;
import com.socialapp.user.dto.UpdateUserRequest;
import com.socialapp.user.dto.UserDto;
import com.socialapp.user.dto.UserProfileDto;
import com.socialapp.user.spi.PostStatsPort;
import com.socialapp.user.spi.ProfileStatsPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collection;
import java.util.List;

@Service
public class UserService {

    private final UserRepository users;
    private final UserMapper userMapper;
    private final StorageService storage;
    private final ProfileStatsPort profileStats;
    private final PostStatsPort postStats;

    public UserService(UserRepository users, UserMapper userMapper, StorageService storage,
                       ProfileStatsPort profileStats, PostStatsPort postStats) {
        this.users = users;
        this.userMapper = userMapper;
        this.storage = storage;
        this.profileStats = profileStats;
        this.postStats = postStats;
    }

    @Transactional(readOnly = true)
    public UserProfileDto getProfile(long targetId, long viewerId) {
        User user = users.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new UserProfileDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getBio(),
                user.getCoverUrl(),
                profileStats.friendCount(targetId),
                postStats.postCount(targetId),
                profileStats.friendStatus(viewerId, targetId));
    }

    @Transactional
    public UserDto updateMe(long userId, UpdateUserRequest request) {
        User user = require(userId);
        if (StringUtils.hasText(request.displayName())) {
            user.setDisplayName(request.displayName().trim());
        }
        if (request.bio() != null) {
            user.setBio(request.bio().isBlank() ? null : request.bio().trim());
        }
        return userMapper.toDto(user);
    }

    @Transactional
    public String setAvatar(long userId, MultipartFile file) {
        User user = require(userId);
        String previous = user.getAvatarUrl();
        StoredFile stored = storage.store(file, "avatars");
        user.setAvatarUrl(stored.url());
        deleteQuietly(previous);
        return stored.url();
    }

    @Transactional
    public String setCover(long userId, MultipartFile file) {
        User user = require(userId);
        String previous = user.getCoverUrl();
        StoredFile stored = storage.store(file, "covers");
        user.setCoverUrl(stored.url());
        deleteQuietly(previous);
        return stored.url();
    }

    @Transactional(readOnly = true)
    public List<User> resolve(Collection<Long> ids) {
        return users.findByIdIn(ids);
    }

    private User require(long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void deleteQuietly(String url) {
        if (StringUtils.hasText(url)) {
            storage.delete(url);
        }
    }
}
