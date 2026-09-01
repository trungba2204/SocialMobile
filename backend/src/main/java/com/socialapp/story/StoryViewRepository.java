package com.socialapp.story;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface StoryViewRepository extends JpaRepository<StoryView, Long> {

    boolean existsByStoryIdAndViewerId(Long storyId, Long viewerId);

    @Query("select v.storyId from StoryView v where v.viewerId = :viewerId and v.storyId in :storyIds")
    List<Long> findStoryIdsViewedBy(@Param("viewerId") Long viewerId,
                                    @Param("storyIds") Collection<Long> storyIds);

    long deleteByStoryId(Long storyId);

    long countByStoryId(Long storyId);

    Page<StoryView> findByStoryIdOrderByCreatedAtDesc(Long storyId, Pageable pageable);
}
