package com.socialapp.notification;

import com.socialapp.common.exception.GlobalExceptionHandler;
import com.socialapp.common.security.CurrentUserArgumentResolver;
import com.socialapp.notification.dto.NotificationDto;
import com.socialapp.support.WithPrincipal;
import com.socialapp.user.dto.UserDto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class NotificationControllerTest {

    private final NotificationService service = mock(NotificationService.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new NotificationController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new CurrentUserArgumentResolver(),
                        new PageableHandlerMethodArgumentResolver())
                .build();
        WithPrincipal.set(1L, "alice");
    }

    @AfterEach
    void tearDown() {
        WithPrincipal.clear();
    }

    @Test
    void listReturnsEnvelopeAndUnreadHeader() throws Exception {
        when(service.list(anyLong(), any())).thenReturn(new PageImpl<>(List.of(
                new NotificationDto(1L, "POST_LIKE", new UserDto(2L, "bob", "Bob", null, null),
                        "POST", 10L, false, Instant.now())), PageRequest.of(0, 20), 1));
        when(service.unreadCount(1L)).thenReturn(3L);

        mvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Unread-Count", "3"))
                .andExpect(jsonPath("$.content[0].type").value("POST_LIKE"));
    }

    @Test
    void markReadReturns204() throws Exception {
        mvc.perform(post("/api/notifications/5/read")).andExpect(status().isNoContent());
    }

    @Test
    void markAllReadReturns204() throws Exception {
        mvc.perform(post("/api/notifications/read-all")).andExpect(status().isNoContent());
    }
}
