package com.socialapp.notification;

import com.socialapp.notification.dto.NotificationDto;
import com.socialapp.user.User;
import com.socialapp.user.UserMapper;
import com.socialapp.user.UserRepository;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    private final UserRepository users;
    private final UserMapper userMapper;

    public NotificationMapper(UserRepository users, UserMapper userMapper) {
        this.users = users;
        this.userMapper = userMapper;
    }

    public NotificationDto toDto(Notification n) {
        User actor = users.findById(n.getActorId()).orElse(null);
        return new NotificationDto(
                n.getId(),
                n.getType().name(),
                actor == null ? null : userMapper.toDto(actor),
                n.getEntityType(),
                n.getEntityId(),
                n.isRead(),
                n.getCreatedAt());
    }
}
