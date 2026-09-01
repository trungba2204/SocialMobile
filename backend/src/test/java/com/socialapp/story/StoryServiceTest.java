package com.socialapp.story;

import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.friend.spi.FriendGraphPort;
import com.socialapp.storage.StorageService;
import com.socialapp.storage.StoredFile;
import com.socialapp.story.dto.StoryDto;
import com.socialapp.story.dto.StoryReelDto;
import com.socialapp.user.UserRepository;
import com.socialapp.user.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoryServiceTest {

    @Mock StoryRepository stories;
    @Mock StoryViewRepository storyViews;
    @Mock UserRepository users;
    @Mock StorageService storage;
    @Mock StoryMapper mapper;
    @Mock FriendGraphPort friendGraph;

    StoryService service;

    @BeforeEach
    void setup() {
        service = new StoryService(stories, storyViews, users, storage, mapper, friendGraph);
        lenient().when(mapper.toDto(any(Story.class), anyBoolean(), anyLong()))
                .thenAnswer(inv -> {
                    Story s = inv.getArgument(0);
                    boolean viewed = inv.getArgument(1);
                    return new StoryDto(s.getId(), new UserDto(s.getAuthorId(), "u" + s.getAuthorId(),
                            "U" + s.getAuthorId(), null, null), s.getMediaUrl(), s.getCaption(),
                            s.getCreatedAt(), s.getExpiresAt(), viewed, inv.getArgument(2));
                });
        lenient().when(storyViews.countByStoryId(anyLong())).thenReturn(0L);
    }

    private Story story(long id, long authorId, Instant createdAt) {
        Story s = new Story(authorId, "/api/media/stories/" + id + ".png", null,
                createdAt.plus(Duration.ofHours(24)));
        ReflectionTestUtils.setField(s, "id", id);
        ReflectionTestUtils.setField(s, "createdAt", createdAt);
        return s;
    }

    @Test
    void createStoresFileSetsExpiryAndSaves() {
        MultipartFile file = new MockMultipartFile("file", "s.png", "image/png", new byte[]{1, 2, 3});
        when(users.existsById(1L)).thenReturn(true);
        when(storage.store(file, "stories")).thenReturn(new StoredFile("k", "/api/media/stories/x.png"));
        when(stories.save(any(Story.class))).thenAnswer(inv -> {
            Story s = inv.getArgument(0);
            ReflectionTestUtils.setField(s, "id", 10L);
            ReflectionTestUtils.setField(s, "createdAt", Instant.now());
            return s;
        });

        StoryDto dto = service.create(1L, file, "  hello  ");

        verify(storage).store(file, "stories");
        ArgumentCaptor<Story> captor = ArgumentCaptor.forClass(Story.class);
        verify(stories).save(captor.capture());
        Story saved = captor.getValue();
        assertThat(saved.getCaption()).isEqualTo("hello");
        assertThat(saved.getMediaUrl()).isEqualTo("/api/media/stories/x.png");
        long hours = ChronoUnit.HOURS.between(Instant.now(), saved.getExpiresAt());
        assertThat(hours).isBetween(23L, 24L);
        assertThat(dto.mediaUrl()).isEqualTo("/api/media/stories/x.png");
    }

    @Test
    void createWithoutFileThrows() {
        assertThatThrownBy(() -> service.create(1L, null, null))
                .isInstanceOf(com.socialapp.common.exception.ValidationException.class);
    }

    @Test
    void activeReelsOwnFirstAndHasUnseenPerFriend() {
        Instant now = Instant.now();
        Story own = story(1L, 1L, now.minus(Duration.ofHours(1)));
        Story friend2 = story(2L, 2L, now.minus(Duration.ofHours(5)));
        Story friend3 = story(3L, 3L, now.minus(Duration.ofHours(2)));
        when(friendGraph.friendIds(1L)).thenReturn(Set.of(2L, 3L));
        when(stories.findActiveByAuthors(any(), any())).thenReturn(List.of(own, friend2, friend3));
        when(storyViews.findStoryIdsViewedBy(eq(1L), any())).thenReturn(List.of(3L));

        List<StoryReelDto> reels = service.activeReels(1L);

        assertThat(reels).hasSize(3);
        assertThat(reels.get(0).author().id()).isEqualTo(1L);
        assertThat(reels.get(0).hasUnseen()).isFalse();
        // friend3's story is newer than friend2's -> friend3 reel comes first
        assertThat(reels.get(1).author().id()).isEqualTo(3L);
        assertThat(reels.get(1).hasUnseen()).isFalse();
        assertThat(reels.get(2).author().id()).isEqualTo(2L);
        assertThat(reels.get(2).hasUnseen()).isTrue();
    }

    @Test
    void activeReelsEmptyWhenNoStories() {
        when(friendGraph.friendIds(1L)).thenReturn(Set.of());
        when(stories.findActiveByAuthors(any(), any())).thenReturn(List.of());
        assertThat(service.activeReels(1L)).isEmpty();
    }

    @Test
    void getByNonFriendNonOwnerThrowsForbidden() {
        Story s = story(5L, 9L, Instant.now());
        when(stories.findById(5L)).thenReturn(Optional.of(s));
        when(friendGraph.friendIds(1L)).thenReturn(Set.of(2L));
        assertThatThrownBy(() -> service.get(5L, 1L)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void getByFriendSucceeds() {
        Story s = story(5L, 9L, Instant.now());
        when(stories.findById(5L)).thenReturn(Optional.of(s));
        when(friendGraph.friendIds(1L)).thenReturn(Set.of(9L));
        when(storyViews.existsByStoryIdAndViewerId(5L, 1L)).thenReturn(false);
        StoryDto dto = service.get(5L, 1L);
        assertThat(dto.id()).isEqualTo(5L);
    }

    @Test
    void deleteByNonOwnerThrows() {
        Story s = story(5L, 9L, Instant.now());
        when(stories.findById(5L)).thenReturn(Optional.of(s));
        assertThatThrownBy(() -> service.delete(5L, 1L)).isInstanceOf(ForbiddenException.class);
        verify(stories, never()).delete(any());
    }

    @Test
    void deleteByOwnerRemovesStoryAndViews() {
        Story s = story(5L, 1L, Instant.now());
        when(stories.findById(5L)).thenReturn(Optional.of(s));
        service.delete(5L, 1L);
        verify(storyViews).deleteByStoryId(5L);
        verify(stories).delete(s);
    }

    @Test
    void recordViewByOwnerIsNoOp() {
        Story s = story(5L, 1L, Instant.now());
        when(stories.findById(5L)).thenReturn(Optional.of(s));
        service.recordView(5L, 1L);
        verify(storyViews, never()).save(any());
    }

    @Test
    void recordViewByViewerSavesOnceThenNoOp() {
        Story s = story(5L, 1L, Instant.now());
        when(stories.findById(5L)).thenReturn(Optional.of(s));
        when(storyViews.existsByStoryIdAndViewerId(5L, 2L)).thenReturn(false, true);

        service.recordView(5L, 2L);
        service.recordView(5L, 2L);

        verify(storyViews, org.mockito.Mockito.times(1)).save(any(StoryView.class));
    }

    @Test
    void viewersByNonOwnerThrows() {
        Story s = story(5L, 1L, Instant.now());
        when(stories.findById(5L)).thenReturn(Optional.of(s));
        assertThatThrownBy(() -> service.viewers(5L, 2L, PageRequest.of(0, 20)))
                .isInstanceOf(ForbiddenException.class);
    }
}
