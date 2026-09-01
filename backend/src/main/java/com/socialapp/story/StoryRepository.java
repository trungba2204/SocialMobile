package com.socialapp.story;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface StoryRepository extends JpaRepository<Story, Long> {

    @Query("""
            select s from Story s
            where s.authorId in :authorIds and s.expiresAt > :now
            order by s.authorId asc, s.createdAt asc
            """)
    List<Story> findActiveByAuthors(@Param("authorIds") Collection<Long> authorIds,
                                    @Param("now") Instant now);

    long deleteByAuthorIdAndExpiresAtBefore(Long authorId, Instant cutoff);
}
