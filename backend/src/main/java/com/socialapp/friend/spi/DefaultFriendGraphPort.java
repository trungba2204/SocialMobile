package com.socialapp.friend.spi;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Set;

@Configuration
public class DefaultFriendGraphPort {

    @Bean
    @ConditionalOnMissingBean(FriendGraphPort.class)
    public FriendGraphPort emptyFriendGraphPort() {
        return userId -> Set.of();
    }
}
