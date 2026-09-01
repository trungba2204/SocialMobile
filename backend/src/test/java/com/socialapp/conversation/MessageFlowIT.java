package com.socialapp.conversation;

import com.socialapp.notification.NotificationRepository;
import com.socialapp.notification.NotificationType;
import com.socialapp.user.Role;
import com.socialapp.user.RoleRepository;
import com.socialapp.user.User;
import com.socialapp.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class MessageFlowIT {

    @Autowired ConversationService service;
    @Autowired ConversationMemberRepository members;
    @Autowired MessageRepository messages;
    @Autowired NotificationRepository notifications;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;

    @Test
    void sendMessageEndToEnd() {
        Role role = roles.findByName(Role.ROLE_USER).orElseGet(() -> roles.save(new Role(Role.ROLE_USER)));
        User alice = newUser("alice-it", role);
        User ben = newUser("ben-it", role);

        var created = service.getOrCreateDirect(alice.getId(), ben.getId());
        long cid = created.conversation().id();
        assertThat(created.created()).isTrue();

        // dedupe
        var again = service.getOrCreateDirect(alice.getId(), ben.getId());
        assertThat(again.conversation().id()).isEqualTo(cid);
        assertThat(again.created()).isFalse();

        service.send(cid, alice.getId(), "hello");
        service.send(cid, alice.getId(), "there");

        assertThat(messages.countByConversationId(cid)).isEqualTo(2);

        var benMember = members.findByConversationIdAndUserId(cid, ben.getId()).orElseThrow();
        assertThat(benMember.getUnreadCount()).isEqualTo(2);

        var benNotifs = notifications.findByRecipientIdOrderByCreatedAtDesc(ben.getId(), PageRequest.of(0, 10));
        assertThat(benNotifs.getContent()).hasSize(2);
        assertThat(benNotifs.getContent()).allMatch(n -> n.getType() == NotificationType.MESSAGE);
        assertThat(benNotifs.getContent()).allMatch(n -> "CONVERSATION".equals(n.getEntityType()));

        service.markRead(cid, ben.getId());
        assertThat(members.findByConversationIdAndUserId(cid, ben.getId()).orElseThrow().getUnreadCount())
                .isEqualTo(0);
    }

    private User newUser(String name, Role role) {
        User u = new User(name + "@example.com", name, "hash", name);
        u.addRole(role);
        return users.save(u);
    }
}
