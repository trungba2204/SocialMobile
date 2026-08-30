package com.socialapp.friend;

import com.socialapp.common.exception.ConflictException;
import com.socialapp.common.exception.GlobalExceptionHandler;
import com.socialapp.common.security.CurrentUserArgumentResolver;
import com.socialapp.friend.dto.FriendRequestDto;
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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FriendControllerTest {

    private final FriendService friendService = mock(FriendService.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new FriendController(friendService))
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
    void sendReturnsDto() throws Exception {
        when(friendService.sendRequest(1L, 2L)).thenReturn(new FriendRequestDto(
                5L, new UserDto(1L, "alice", "Alice", null, null), "PENDING", Instant.now()));

        mvc.perform(post("/api/friends/requests/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void sendDuplicateReturns409() throws Exception {
        when(friendService.sendRequest(1L, 2L)).thenThrow(new ConflictException("dupe"));
        mvc.perform(post("/api/friends/requests/2")).andExpect(status().isConflict());
    }

    @Test
    void acceptReturns204() throws Exception {
        mvc.perform(post("/api/friends/requests/9/accept")).andExpect(status().isNoContent());
    }

    @Test
    void incomingRequestsReturnEnvelope() throws Exception {
        when(friendService.incomingRequests(any(Long.class), any())).thenReturn(new PageImpl<>(
                List.of(new FriendRequestDto(5L, new UserDto(2L, "bob", "Bob", null, null),
                        "PENDING", Instant.now())),
                PageRequest.of(0, 20), 1));

        mvc.perform(get("/api/friends/requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].requester.username").value("bob"));
    }
}
