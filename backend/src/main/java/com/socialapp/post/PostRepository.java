package com.socialapp.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);

    long countByAuthorId(Long authorId);

    @Query("""
            select p from Post p
            where p.author.id = :viewerId
               or (p.author.id in :friendIds and p.privacy <> com.socialapp.post.Privacy.PRIVATE)
            order by p.createdAt desc
            """)
    Page<Post> findFeed(@Param("viewerId") Long viewerId,
                        @Param("friendIds") Collection<Long> friendIds,
                        Pageable pageable);

    @Query("""
            select p from Post p
            where lower(p.content) like lower(concat('%', :q, '%'))
              and (p.author.id = :viewerId
                   or p.author.id in :friendIds
                   or p.privacy = com.socialapp.post.Privacy.PUBLIC)
            order by p.createdAt desc
            """)
    Page<Post> searchVisible(@Param("q") String q,
                             @Param("viewerId") Long viewerId,
                             @Param("friendIds") Collection<Long> friendIds,
                             Pageable pageable);
}
