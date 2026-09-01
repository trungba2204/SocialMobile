package com.socialapp.story;

import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.common.exception.GlobalExceptionHandler;
import com.socialapp.common.exception.ValidationException;
import com.socialapp.common.security.CurrentUserArgumentResolver;
import com.socialapp.story.dto.StoryDto;
import com.socialapp.story.dto.StoryReelDto;
import com.socialapp.support.WithPrincipal;
import com.socialapp.user.dto.UserDto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StoryControllerTest {

    private final StoryService service = mock(StoryService.class);
    private MockMvc mvc;

    private static final UserDto AUTHOR = new UserDto(1L, "alice", "Alice", null, null);

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new StoryController(service))
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

    private StoryDto dto() {
        return new StoryDto(7L, AUTHOR, "/api/media/stories/x.png", "hi",
                Instant.now(), Instant.now().plusSeconds(86400), false, 0L);
    }

    @Test
    void createReturns201() throws Exception {
        when(service.create(anyLong(), any(), any())).thenReturn(dto());
        MockMultipartFile file = new MockMultipartFile("file", "s.png", "image/png", new byte[]{1, 2});
        mvc.perform(multipart("/api/stories").file(file).param("caption", "hi"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.mediaUrl").value("/api/media/stories/x.png"));
    }

    @Test
    void createMissingFileReturns400() throws Exception {
        when(service.create(anyLong(), any(), any()))
                .thenThrow(new ValidationException("A story requires an image file"));
        mvc.perform(multipart("/api/stories"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reelsReturnsArray() throws Exception {
        when(service.activeReels(1L)).thenReturn(List.of(
                new StoryReelDto(AUTHOR, List.of(dto()), false)));
        mvc.perform(get("/api/stories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].author.username").value("alice"))
                .andExpect(jsonPath("$[0].stories[0].id").value(7));
    }

    @Test
    void getForbiddenReturns403() throws Exception {
        when(service.get(anyLong(), anyLong())).thenThrow(new ForbiddenException("no"));
        mvc.perform(get("/api/stories/7")).andExpect(status().isForbidden());
    }

    @Test
    void deleteReturns204() throws Exception {
        mvc.perform(delete("/api/stories/7")).andExpect(status().isNoContent());
    }

    @Test
    void viewReturns204() throws Exception {
        mvc.perform(post("/api/stories/7/view")).andExpect(status().isNoContent());
    }

    @Test
    void viewersReturnsEnvelope() throws Exception {
        when(service.viewers(anyLong(), anyLong(), any())).thenReturn(
                new PageImpl<>(List.of(new UserDto(2L, "ben", "Ben", null, null)),
                        PageRequest.of(0, 20), 1));
        mvc.perform(get("/api/stories/7/viewers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].username").value("ben"));
    }

    @Test
    void viewersForbiddenReturns403() throws Exception {
        doThrow(new ForbiddenException("no")).when(service).viewers(anyLong(), anyLong(), any());
        mvc.perform(get("/api/stories/7/viewers")).andExpect(status().isForbidden());
    }
}
