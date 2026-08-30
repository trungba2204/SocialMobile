package com.socialapp.user.spi;

import com.socialapp.friend.dto.FriendStatus;

/**
 * SPI implemented by the friend module so the user module can assemble a full
 * profile without a compile-time dependency on it. A default no-op bean is
 * provided; the real implementation overrides it via {@code @Primary}.
 */
public interface ProfileStatsPort {

    long friendCount(long userId);

    FriendStatus friendStatus(long viewerId, long targetId);
}
