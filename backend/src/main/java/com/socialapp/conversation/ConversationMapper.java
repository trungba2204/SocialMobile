package com.socialapp.conversation;

import com.socialapp.conversation.dto.ConversationDto;
import com.socialapp.conversation.dto.LastMessageDto;
import com.socialapp.conversation.dto.MessageDto;
import com.socialapp.user.UserMapper;
import com.socialapp.user.UserRepository;
import com.socialapp.user.dto.UserDto;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ConversationMapper {

    private final ConversationMemberRepository members;
    private final MessageRepository messages;
    private final UserRepository users;
    private final UserMapper userMapper;

    public ConversationMapper(ConversationMemberRepository members, MessageRepository messages,
                              UserRepository users, UserMapper userMapper) {
        this.members = members;
        this.messages = messages;
        this.users = users;
        this.userMapper = userMapper;
    }

    public ConversationDto toDto(Conversation c, long callerId) {
        List<ConversationMember> mem = members.findByConversationId(c.getId());
        ConversationMember peer = mem.stream()
                .filter(m -> !m.getUserId().equals(callerId)).findFirst().orElse(null);
        ConversationMember mine = mem.stream()
                .filter(m -> m.getUserId().equals(callerId)).findFirst().orElse(null);

        UserDto peerDto = peer == null ? null
                : users.findById(peer.getUserId()).map(userMapper::toDto).orElse(null);

        LastMessageDto last = messages.findTopByConversationIdOrderByCreatedAtDesc(c.getId())
                .map(m -> new LastMessageDto(m.getId(), m.getContent(), m.getSenderId(), m.getCreatedAt()))
                .orElse(null);

        int unread = mine == null ? 0 : mine.getUnreadCount();
        return new ConversationDto(c.getId(), peerDto, last, unread, c.getUpdatedAt());
    }

    public MessageDto toDto(Message m) {
        UserDto sender = users.findById(m.getSenderId()).map(userMapper::toDto).orElse(null);
        return new MessageDto(m.getId(), m.getConversationId(), sender, m.getContent(), m.getCreatedAt());
    }
}
