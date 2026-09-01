package com.socialapp.conversation;

import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.common.exception.ValidationException;
import com.socialapp.conversation.dto.ConversationDto;
import com.socialapp.conversation.dto.MessageDto;
import com.socialapp.notification.NotificationType;
import com.socialapp.notification.spi.NotificationPort;
import com.socialapp.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversationService {

    private final ConversationRepository conversations;
    private final ConversationMemberRepository members;
    private final MessageRepository messages;
    private final UserRepository users;
    private final ConversationMapper mapper;
    private final NotificationPort notifications;

    public ConversationService(ConversationRepository conversations, ConversationMemberRepository members,
                               MessageRepository messages, UserRepository users,
                               ConversationMapper mapper, NotificationPort notifications) {
        this.conversations = conversations;
        this.members = members;
        this.messages = messages;
        this.users = users;
        this.mapper = mapper;
        this.notifications = notifications;
    }

    /** Result of get-or-create; {@code created} drives the 201 vs 200 status. */
    public record GetOrCreate(ConversationDto conversation, boolean created) {
    }

    @Transactional(readOnly = true)
    public Page<ConversationDto> listMine(long userId, Pageable pageable) {
        return conversations.findMine(userId, pageable).map(c -> mapper.toDto(c, userId));
    }

    @Transactional
    public GetOrCreate getOrCreateDirect(long userId, long peerUserId) {
        if (userId == peerUserId) {
            throw new ValidationException("You cannot start a conversation with yourself");
        }
        if (!users.existsById(peerUserId)) {
            throw new ResourceNotFoundException("User not found");
        }
        for (Long candidateId : members.directCandidates(userId, peerUserId)) {
            if (members.countByConversationId(candidateId) == 2) {
                Conversation existing = conversations.findById(candidateId)
                        .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
                return new GetOrCreate(mapper.toDto(existing, userId), false);
            }
        }
        Conversation created = conversations.save(new Conversation(false, null));
        members.save(new ConversationMember(created.getId(), userId));
        members.save(new ConversationMember(created.getId(), peerUserId));
        return new GetOrCreate(mapper.toDto(created, userId), true);
    }

    @Transactional(readOnly = true)
    public ConversationDto get(long conversationId, long userId) {
        requireMember(conversationId, userId);
        Conversation c = conversations.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        return mapper.toDto(c, userId);
    }

    @Transactional(readOnly = true)
    public Page<MessageDto> messages(long conversationId, long userId, Pageable pageable) {
        requireMember(conversationId, userId);
        return messages.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable).map(mapper::toDto);
    }

    @Transactional
    public MessageDto send(long conversationId, long userId, String content) {
        requireMember(conversationId, userId);
        Conversation c = conversations.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        Message saved = messages.save(new Message(conversationId, userId, content));
        c.setLastMessageId(saved.getId());
        conversations.save(c);

        for (ConversationMember member : members.findByConversationId(conversationId)) {
            if (member.getUserId().equals(userId)) {
                member.setLastReadMessageId(saved.getId());
            } else {
                member.incrementUnread();
                notifications.record(member.getUserId(), userId, NotificationType.MESSAGE,
                        "CONVERSATION", conversationId);
            }
            members.save(member);
        }
        return mapper.toDto(saved);
    }

    @Transactional
    public void markRead(long conversationId, long userId) {
        ConversationMember mine = requireMember(conversationId, userId);
        mine.setUnreadCount(0);
        messages.findTopByConversationIdOrderByCreatedAtDesc(conversationId)
                .ifPresent(m -> mine.setLastReadMessageId(m.getId()));
        members.save(mine);
    }

    private ConversationMember requireMember(long conversationId, long userId) {
        return members.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this conversation"));
    }
}
