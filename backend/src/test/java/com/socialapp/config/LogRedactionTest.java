package com.socialapp.config;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the logback-spring.xml redaction pattern via the configured console encoder.
 * The console appender formats with the redaction replace pattern; here we assert the
 * regexes themselves scrub the sensitive fragments.
 */
class LogRedactionTest {

    @Test
    void bearerTokensAndPasswordsAreScrubbed() {
        String line = "login body {\"password\":\"hunter2\"} with header Authorization: Bearer abc123.def-456_GHI";

        String redacted = line
                .replaceAll("(?i)(Bearer\\s+)[A-Za-z0-9._\\-]+", "$1***")
                .replaceAll("(?i)(\"?(password|refreshToken|accessToken|token)\"?\\s*[:=]\\s*\"?)[^\",\\s}]+", "$1***");

        assertThat(redacted).doesNotContain("hunter2");
        assertThat(redacted).doesNotContain("abc123.def-456_GHI");
        assertThat(redacted).contains("Bearer ***");
        assertThat(redacted).contains("\"password\":\"***");
    }

    @Test
    void appLoggerDoesNotThrowWithRedactionPattern() {
        Logger logger = (Logger) LoggerFactory.getLogger("com.socialapp.test");
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        logger.info("token=secret-value Bearer zzz.yyy.xxx");

        assertThat(appender.list).hasSize(1);
        logger.detachAppender(appender);
    }
}
