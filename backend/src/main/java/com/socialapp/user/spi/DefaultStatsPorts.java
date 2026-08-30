package com.socialapp.user.spi;

import com.socialapp.friend.dto.FriendStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Fallback no-op implementations so the user module works before (or in tests
 * without) the friend and post modules. Real beans are marked {@code @Primary}.
 */
@Configuration
public class DefaultStatsPorts {

    @Bean
    @ConditionalOnMissingBean(ProfileStatsPort.class)
    public ProfileStatsPort noopProfileStatsPort() {
        return new ProfileStatsPort() {
            @Override
            public long friendCount(long userId) {
                return 0;
            }

            @Override
            public FriendStatus friendStatus(long viewerId, long targetId) {
                return viewerId == targetId ? FriendStatus.SELF : FriendStatus.NONE;
            }
        };
    }

    @Bean
    @ConditionalOnMissingBean(PostStatsPort.class)
    public PostStatsPort noopPostStatsPort() {
        return userId -> 0L;
    }
}
