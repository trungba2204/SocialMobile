package com.socialapp.conversation;

import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.common.exception.ValidationException;
import com.socialapp.conversation.dto.ConversationDto;
import com.socialapp.notification.NotificationType;
import com.socialapp.notification.spi.NotificationPort;
import com.socialapp.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock ConversationRepository conversations;
    @Mock ConversationMemberRepository members;
    @Mock MessageRepository messages;
    @Mock UserRepository users;
    @Mock ConversationMapper mapper;
    @Mock NotificationPort notifications;

    ConversationService service;

    @BeforeEach
    void setup() {
        service = new ConversationService(conversations, members, messages, users, mapper, notifications);
        lenient().when(mapper.toDto(any(Conversation.class), anyLong()))
                .thenReturn(new ConversationDto(1L, null, null, 0, null));
    }

    @Test
    void getOrCreateDirectCreatesConversationAndTwoMembers() {
        when(users.existsById(2L)).thenReturn(true);
        when(members.directCandidates(1L, 2L)).thenReturn(List.of());
        Conversation saved = new Conversation(false, null);
        when(conversations.save(any(Conversation.class))).thenReturn(saved);

        ConversationService.GetOrCreate result = service.getOrCreateDirect(1L, 2L);

        assertThat(result.created()).isTrue();
        verify(conversations).save(any(Conversation.class));
        verify(members, org.mockito.Mockito.times(2)).save(any(ConversationMember.class));
    }

    @Test
    void getOrCreateDirectReturnsExistingOnDedupe() {
        when(users.existsById(2L)).thenReturn(true);
        when(members.directCandidates(1L, 2L)).thenReturn(List.of(9L));
        when(members.countByConversationId(9L)).thenReturn(2L);
        when(conversations.findById(9L)).thenReturn(Optional.of(new Conversation(false, null)));

        ConversationService.GetOrCreate result = service.getOrCreateDirect(1L, 2L);

        assertThat(result.created()).isFalse();
        verify(conversations, never()).save(any(Conversation.class));
    }

    @Test
    void getOrCreateDirectWithSelfThrows() {
        assertThatThrownBy(() -> service.getOrCreateDirect(1L, 1L))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void getOrCreateDirectWithUnknownPeerThrows() {
        when(users.existsById(99L)).thenReturn(false);
        assertThatThrownBy(() -> service.getOrCreateDirect(1L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void sendPersistsMessageBumpsConversationIncrementsOtherUnreadAndNotifies() {
        ConversationMember sender = new ConversationMember(5L, 1L);
        ConversationMember peer = new ConversationMember(5L, 2L);
        when(members.findByConversationIdAndUserId(5L, 1L)).thenReturn(Optional.of(sender));
        when(conversations.findById(5L)).thenReturn(Optional.of(new Conversation(false, null)));
        Message persisted = new Message(5L, 1L, "hi");
        when(messages.save(any(Message.class))).thenReturn(persisted);
        when(members.findByConversationId(5L)).thenReturn(List.of(sender, peer));

        service.send(5L, 1L, "hi");

        verify(messages).save(any(Message.class));
        verify(conversations).save(any(Conversation.class));
        assertThat(peer.getUnreadCount()).isEqualTo(1);
        assertThat(sender.getUnreadCount()).isEqualTo(0);
        verify(notifications).record(eq(2L), eq(1L), eq(NotificationType.MESSAGE),
                eq("CONVERSATION"), eq(5L));
    }

    @Test
    void sendByNonMemberThrowsForbidden() {
        when(members.findByConversationIdAndUserId(5L, 3L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.send(5L, 3L, "hi"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void getByNonMemberThrowsForbidden() {
        when(members.findByConversationIdAndUserId(5L, 3L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.get(5L, 3L)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void messagesByNonMemberThrowsForbidden() {
        when(members.findByConversationIdAndUserId(5L, 3L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.messages(5L, 3L, org.springframework.data.domain.PageRequest.of(0, 20)))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void markReadClearsUnreadAndSetsLastRead() {
        ConversationMember mine = new ConversationMember(5L, 1L);
        mine.setUnreadCount(4);
        when(members.findByConversationIdAndUserId(5L, 1L)).thenReturn(Optional.of(mine));
        Message latest = new Message(5L, 2L, "yo");
        when(messages.findTopByConversationIdOrderByCreatedAtDesc(5L)).thenReturn(Optional.of(latest));

        service.markRead(5L, 1L);

        assertThat(mine.getUnreadCount()).isEqualTo(0);
        verify(members).save(mine);
    }
}
