package com.socialapp.conversation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {

    Optional<ConversationMember> findByConversationIdAndUserId(Long conversationId, Long userId);

    List<ConversationMember> findByConversationId(Long conversationId);

    List<ConversationMember> findByUserId(Long userId);

    long countByConversationId(Long conversationId);

    /**
     * Conversation ids that have BOTH users as members. Callers must still verify
     * the conversation has exactly two members (no third participant).
     */
    @Query("""
            select m.conversationId from ConversationMember m
            where m.userId in (:a, :b)
            group by m.conversationId
            having count(m) = 2
            """)
    List<Long> directCandidates(@Param("a") long a, @Param("b") long b);
}
