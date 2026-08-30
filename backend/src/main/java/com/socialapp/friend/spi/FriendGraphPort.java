package com.socialapp.friend.spi;

import java.util.Set;

/**
 * SPI the post/search modules use to read a user's friend set without a
 * compile-time dependency on the friend module. A default bean returning an
 * empty set is provided; the real implementation overrides it via {@code @Primary}.
 */
public interface FriendGraphPort {

    Set<Long> friendIds(long userId);
}
