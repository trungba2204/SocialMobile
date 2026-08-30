package com.socialapp.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialapp.common.exception.GlobalExceptionHandler;
import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.common.security.CurrentUserArgumentResolver;
import com.socialapp.support.WithPrincipal;
import com.socialapp.user.dto.UserDto;
import com.socialapp.user.dto.UserProfileDto;
import com.socialapp.friend.dto.FriendStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserControllerTest {

    private final UserService userService = mock(UserService.class);
    private final ObjectMapper json = new ObjectMapper();
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new UserController(userService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new CurrentUserArgumentResolver())
                .build();
        WithPrincipal.set(1L, "alice");
    }

    @AfterEach
    void tearDown() {
        WithPrincipal.clear();
    }

    @Test
    void updateMeReturnsUpdatedUser() throws Exception {
        when(userService.updateMe(eq(1L), any()))
                .thenReturn(new UserDto(1L, "alice", "New Name", null, "hi"));

        mvc.perform(put("/api/users/me").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("displayName", "New Name"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("New Name"));
    }

    @Test
    void avatarUploadReturnsUrl() throws Exception {
        when(userService.setAvatar(eq(1L), any())).thenReturn("/api/media/avatars/x.png");

        mvc.perform(multipart("/api/users/me/avatar")
                        .file(new MockMultipartFile("file", "x.png", "image/png", new byte[]{1})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("/api/media/avatars/x.png"));
    }

    @Test
    void unknownUserReturns404Envelope() throws Exception {
        when(userService.getProfile(anyLong(), anyLong()))
                .thenThrow(new ResourceNotFoundException("User not found"));

        mvc.perform(get("/api/users/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void profileReturnsFriendStatus() throws Exception {
        when(userService.getProfile(2L, 1L)).thenReturn(new UserProfileDto(
                2L, "bob", "Bob", null, null, null, 3, 4, FriendStatus.PENDING_OUT));

        mvc.perform(get("/api/users/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.friendStatus").value("PENDING_OUT"));
    }
}
