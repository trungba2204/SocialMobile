package com.socialapp.story;

import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.common.exception.ValidationException;
import com.socialapp.friend.spi.FriendGraphPort;
import com.socialapp.storage.StorageService;
import com.socialapp.storage.StoredFile;
import com.socialapp.story.dto.StoryDto;
import com.socialapp.story.dto.StoryReelDto;
import com.socialapp.user.UserRepository;
import com.socialapp.user.dto.UserDto;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class StoryService {

    private static final int MAX_CAPTION = 200;
    private static final int MAX_REELS = 50;
    private static final Duration TTL = Duration.ofHours(24);

    private final StoryRepository stories;
    private final StoryViewRepository storyViews;
    private final UserRepository users;
    private final StorageService storage;
    private final StoryMapper mapper;
    private final FriendGraphPort friendGraph;

    public StoryService(StoryRepository stories, StoryViewRepository storyViews, UserRepository users,
                        StorageService storage, StoryMapper mapper, FriendGraphPort friendGraph) {
        this.stories = stories;
        this.storyViews = storyViews;
        this.users = users;
        this.storage = storage;
        this.mapper = mapper;
        this.friendGraph = friendGraph;
    }

    @Transactional
    public StoryDto create(long authorId, MultipartFile file, String caption) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("A story requires an image file");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ValidationException("Story media must be an image");
        }
        String trimmed = StringUtils.hasText(caption) ? caption.trim() : null;
        if (trimmed != null && trimmed.length() > MAX_CAPTION) {
            throw new ValidationException("Caption must be at most " + MAX_CAPTION + " characters");
        }
        if (!users.existsById(authorId)) {
            throw new ResourceNotFoundException("User not found");
        }
        StoredFile stored = storage.store(file, "stories");
        Story story = new Story(authorId, stored.url(), trimmed, Instant.now().plus(TTL));
        story = stories.save(story);
        return mapper.toDto(story, false, 0L);
    }

    @Transactional(readOnly = true)
    public List<StoryReelDto> activeReels(long viewerId) {
        Set<Long> authorIds = new HashSet<>(friendGraph.friendIds(viewerId));
        authorIds.add(viewerId);

        List<Story> active = stories.findActiveByAuthors(authorIds, Instant.now());
        if (active.isEmpty()) {
            return List.of();
        }
        List<Long> ids = active.stream().map(Story::getId).toList();
        Set<Long> viewed = new HashSet<>(storyViews.findStoryIdsViewedBy(viewerId, ids));

        Map<Long, List<Story>> byAuthor = new LinkedHashMap<>();
        for (Story s : active) {
            byAuthor.computeIfAbsent(s.getAuthorId(), k -> new ArrayList<>()).add(s);
        }

        List<StoryReelDto> reels = new ArrayList<>();
        for (Map.Entry<Long, List<Story>> entry : byAuthor.entrySet()) {
            long authorId = entry.getKey();
            boolean own = authorId == viewerId;
            List<Story> authorStories = entry.getValue();
            authorStories.sort(Comparator.comparing(Story::getCreatedAt));

            List<StoryDto> dtos = new ArrayList<>(authorStories.size());
            boolean hasUnseen = false;
            for (Story s : authorStories) {
                boolean seen = own || viewed.contains(s.getId());
                if (!seen) {
                    hasUnseen = true;
                }
                dtos.add(mapper.toDto(s, seen, storyViews.countByStoryId(s.getId())));
            }
            UserDto author = dtos.isEmpty() ? null : dtos.get(0).author();
            reels.add(new StoryReelDto(author, dtos, !own && hasUnseen));
        }

        reels.sort((a, b) -> {
            boolean aOwn = a.author() != null && a.author().id() == viewerId;
            boolean bOwn = b.author() != null && b.author().id() == viewerId;
            if (aOwn != bOwn) {
                return aOwn ? -1 : 1;
            }
            return newestCreatedAt(b).compareTo(newestCreatedAt(a));
        });

        return reels.size() > MAX_REELS ? reels.subList(0, MAX_REELS) : reels;
    }

    @Transactional(readOnly = true)
    public StoryDto get(long storyId, long viewerId) {
        Story story = requireStory(storyId);
        if (!visible(story, viewerId)) {
            throw new ForbiddenException("You cannot view this story");
        }
        if (story.getExpiresAt().isBefore(Instant.now())) {
            throw new ResourceNotFoundException("Story not found");
        }
        boolean viewed = story.getAuthorId() == viewerId
                || storyViews.existsByStoryIdAndViewerId(storyId, viewerId);
        return mapper.toDto(story, viewed, storyViews.countByStoryId(storyId));
    }

    @Transactional
    public void delete(long storyId, long requesterId) {
        Story story = requireStory(storyId);
        if (story.getAuthorId() != requesterId) {
            throw new ForbiddenException("You can only delete your own stories");
        }
        storyViews.deleteByStoryId(storyId);
        stories.delete(story);
        storage.delete(story.getMediaUrl());
    }

    @Transactional
    public void recordView(long storyId, long viewerId) {
        Story story = requireStory(storyId);
        if (story.getAuthorId() == viewerId) {
            return;
        }
        if (!visible(story, viewerId)) {
            return;
        }
        if (story.getExpiresAt().isBefore(Instant.now())) {
            return;
        }
        if (storyViews.existsByStoryIdAndViewerId(storyId, viewerId)) {
            return;
        }
        try {
            storyViews.save(new StoryView(storyId, viewerId));
        } catch (DataIntegrityViolationException race) {
            // concurrent duplicate view — treat as a no-op
        }
    }

    @Transactional(readOnly = true)
    public Page<UserDto> viewers(long storyId, long ownerId, Pageable pageable) {
        Story story = requireStory(storyId);
        if (story.getAuthorId() != ownerId) {
            throw new ForbiddenException("You can only see viewers of your own stories");
        }
        return storyViews.findByStoryIdOrderByCreatedAtDesc(storyId, pageable)
                .map(v -> users.findById(v.getViewerId())
                        .map(u -> new UserDto(u.getId(), u.getUsername(), u.getDisplayName(),
                                u.getAvatarUrl(), u.getBio()))
                        .orElse(null));
    }

    private Story requireStory(long storyId) {
        return stories.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("Story not found"));
    }

    private boolean visible(Story story, long viewerId) {
        return story.getAuthorId() == viewerId
                || friendGraph.friendIds(viewerId).contains(story.getAuthorId());
    }

    private static Instant newestCreatedAt(StoryReelDto reel) {
        return reel.stories().stream()
                .map(StoryDto::createdAt)
                .max(Comparator.naturalOrder())
                .orElse(Instant.EPOCH);
    }
}
