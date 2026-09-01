package com.socialapp.conversation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.common.exception.GlobalExceptionHandler;
import com.socialapp.common.security.CurrentUserArgumentResolver;
import com.socialapp.conversation.dto.ConversationDto;
import com.socialapp.conversation.dto.MessageDto;
import com.socialapp.support.WithPrincipal;
import com.socialapp.user.dto.UserDto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ConversationControllerTest {

    private final ConversationService service = mock(ConversationService.class);
    private final ObjectMapper json = new ObjectMapper();
    private MockMvc mvc;

    private static final UserDto PEER = new UserDto(2L, "ben", "Ben", null, null);

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new ConversationController(service))
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

    private ConversationDto conv() {
        return new ConversationDto(7L, PEER, null, 0, Instant.now());
    }

    @Test
    void listReturnsEnvelope() throws Exception {
        when(service.listMine(anyLong(), any()))
                .thenReturn(new PageImpl<>(List.of(conv()), PageRequest.of(0, 20), 1));
        mvc.perform(get("/api/conversations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(7))
                .andExpect(jsonPath("$.content[0].peer.username").value("ben"));
    }

    @Test
    void createReturns201WhenCreated() throws Exception {
        when(service.getOrCreateDirect(1L, 2L))
                .thenReturn(new ConversationService.GetOrCreate(conv(), true));
        mvc.perform(post("/api/conversations").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("peerUserId", 2))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    void createReturns200WhenExisting() throws Exception {
        when(service.getOrCreateDirect(1L, 2L))
                .thenReturn(new ConversationService.GetOrCreate(conv(), false));
        mvc.perform(post("/api/conversations").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("peerUserId", 2))))
                .andExpect(status().isOk());
    }

    @Test
    void getByNonMemberReturns403() throws Exception {
        when(service.get(anyLong(), anyLong())).thenThrow(new ForbiddenException("nope"));
        mvc.perform(get("/api/conversations/7")).andExpect(status().isForbidden());
    }

    @Test
    void listMessagesReturnsEnvelope() throws Exception {
        when(service.messages(anyLong(), anyLong(), any())).thenReturn(new PageImpl<>(List.of(
                new MessageDto(1L, 7L, PEER, "hi", Instant.now())), PageRequest.of(0, 20), 1));
        mvc.perform(get("/api/conversations/7/messages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].content").value("hi"));
    }

    @Test
    void sendReturns201() throws Exception {
        when(service.send(anyLong(), anyLong(), any()))
                .thenReturn(new MessageDto(9L, 7L, PEER, "hey", Instant.now()));
        mvc.perform(post("/api/conversations/7/messages").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("content", "hey"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(9));
    }

    @Test
    void sendBlankContentReturns400() throws Exception {
        mvc.perform(post("/api/conversations/7/messages").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("content", "   "))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors").exists());
    }

    @Test
    void markReadReturns204() throws Exception {
        mvc.perform(post("/api/conversations/7/read")).andExpect(status().isNoContent());
    }
}
