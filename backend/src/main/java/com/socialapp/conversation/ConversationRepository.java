package com.socialapp.conversation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query(value = """
            select c from Conversation c
            where c.id in (select m.conversationId from ConversationMember m where m.userId = :userId)
            order by c.updatedAt desc
            """,
            countQuery = """
            select count(c) from Conversation c
            where c.id in (select m.conversationId from ConversationMember m where m.userId = :userId)
            """)
    Page<Conversation> findMine(@Param("userId") long userId, Pageable pageable);
}
