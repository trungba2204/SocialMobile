package com.socialapp.search;

import com.socialapp.common.exception.GlobalExceptionHandler;
import com.socialapp.common.security.CurrentUserArgumentResolver;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SearchControllerTest {

    private final SearchService searchService = mock(SearchService.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new SearchController(searchService))
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
    void userSearchReturnsEnvelope() throws Exception {
        when(searchService.users(eq("bob"), any())).thenReturn(new PageImpl<>(
                List.of(new UserDto(2L, "bob", "Bob", null, null)), PageRequest.of(0, 20), 1));

        mvc.perform(get("/api/search/users?q=bob"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].username").value("bob"));
    }

    @Test
    void missingQueryReturns400() throws Exception {
        mvc.perform(get("/api/search/users"))
                .andExpect(status().isBadRequest());
    }
}
