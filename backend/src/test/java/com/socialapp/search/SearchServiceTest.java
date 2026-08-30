package com.socialapp.search;

import com.socialapp.post.PostService;
import com.socialapp.user.User;
import com.socialapp.user.UserMapper;
import com.socialapp.user.UserRepository;
import com.socialapp.user.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock UserRepository users;
    @Mock UserMapper userMapper;
    @Mock PostService postService;

    SearchService service;

    @BeforeEach
    void setup() {
        service = new SearchService(users, userMapper, postService);
    }

    @Test
    void userSearchReturnsMatches() {
        User u = new User("a@x.com", "alice", "h", "Alice");
        when(users.findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
                eq("ali"), eq("ali"), any()))
                .thenReturn(new PageImpl<>(List.of(u)));
        when(userMapper.toDto(u)).thenReturn(new UserDto(1L, "alice", "Alice", null, null));

        Page<UserDto> result = service.users("ali", PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void shortQueryReturnsEmptyWithoutHittingRepo() {
        Page<UserDto> result = service.users("a", PageRequest.of(0, 20));

        assertThat(result).isEmpty();
        verify(users, never()).findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
                any(), any(), any());
    }

    @Test
    void postSearchDelegatesToPostService() {
        when(postService.search("hello", 1L, PageRequest.of(0, 20)))
                .thenReturn(Page.empty());

        service.posts("hello", 1L, PageRequest.of(0, 20));

        verify(postService).search("hello", 1L, PageRequest.of(0, 20));
    }
}
