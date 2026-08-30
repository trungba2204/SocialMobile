package com.socialapp.post.comment;

import com.socialapp.common.exception.GlobalExceptionHandler;
import com.socialapp.common.security.CurrentUserArgumentResolver;
import com.socialapp.post.comment.dto.CommentDto;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CommentControllerTest {

    private final CommentService commentService = mock(CommentService.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new CommentController(commentService))
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
    void listReturnsEnvelope() throws Exception {
        CommentDto dto = new CommentDto(1L, 2L, new UserDto(1L, "alice", "Alice", null, null),
                "nice", null, Instant.now());
        when(commentService.list(eq(2L), any()))
                .thenReturn(new PageImpl<>(List.of(dto), PageRequest.of(0, 20), 1));

        mvc.perform(get("/api/posts/2/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].content").value("nice"));
    }

    @Test
    void createBlankContentReturns400() throws Exception {
        mvc.perform(post("/api/posts/2/comments").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='content')]").exists());
    }
}
