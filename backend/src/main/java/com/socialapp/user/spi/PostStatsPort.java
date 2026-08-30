package com.socialapp.user.spi;

/**
 * SPI implemented by the post module so the user module can report a user's post
 * count. A default no-op bean is provided; the real implementation overrides it
 * via {@code @Primary}.
 */
public interface PostStatsPort {

    long postCount(long userId);
}
