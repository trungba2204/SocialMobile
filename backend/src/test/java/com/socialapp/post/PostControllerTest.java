package com.socialapp.post;

import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.common.exception.GlobalExceptionHandler;
import com.socialapp.common.security.CurrentUserArgumentResolver;
import com.socialapp.post.dto.LikeResponse;
import com.socialapp.post.dto.PostDto;
import com.socialapp.support.WithPrincipal;
import com.socialapp.user.dto.UserDto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PostControllerTest {

    private final PostService postService = mock(PostService.class);
    private MockMvc mvc;

    private PostDto samplePost() {
        return new PostDto(1L, new UserDto(1L, "alice", "Alice", null, null),
                "hello", "PUBLIC", null, null, List.of(), Instant.now(), 0, 0, 0, false);
    }

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new PostController(postService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new CurrentUserArgumentResolver(),
                        new org.springframework.data.web.PageableHandlerMethodArgumentResolver())
                .build();
        WithPrincipal.set(1L, "alice");
    }

    @AfterEach
    void tearDown() {
        WithPrincipal.clear();
    }

    @Test
    void feedReturnsPaginationEnvelope() throws Exception {
        Page<PostDto> page = new PageImpl<>(List.of(samplePost()), PageRequest.of(0, 20), 1);
        when(postService.feed(eq(1L), any())).thenReturn(page);

        mvc.perform(get("/api/posts?page=0&size=20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.last").value(true));
    }

    @Test
    void createMultipartReturnsPost() throws Exception {
        when(postService.create(eq(1L), any(), any())).thenReturn(samplePost());

        MockMultipartFile postPart = new MockMultipartFile("post", "post", "application/json",
                "{\"content\":\"hi\",\"privacy\":\"PUBLIC\"}".getBytes());
        MockMultipartFile media = new MockMultipartFile("media", "a.jpg", "image/jpeg", new byte[]{1});

        mvc.perform(multipart("/api/posts").file(postPart).file(media)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void likeReturnsCount() throws Exception {
        when(postService.like(2L, 1L)).thenReturn(new LikeResponse(true, 1));

        mvc.perform(post("/api/posts/2/like"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true))
                .andExpect(jsonPath("$.likeCount").value(1));
    }

    @Test
    void deleteByNonAuthorReturns403() throws Exception {
        doThrow(new ForbiddenException("nope")).when(postService).delete(anyLong(), anyLong());

        mvc.perform(delete("/api/posts/5"))
                .andExpect(status().isForbidden());
    }
}
