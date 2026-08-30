package com.socialapp.search;

import com.socialapp.common.security.AuthPrincipal;
import com.socialapp.common.security.CurrentUser;
import com.socialapp.common.web.PageMapper;
import com.socialapp.common.web.PageResponse;
import com.socialapp.post.dto.PostDto;
import com.socialapp.user.dto.UserDto;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/users")
    public PageResponse<UserDto> users(@RequestParam("q") String query,
                                       @PageableDefault(size = 20) Pageable pageable) {
        return PageMapper.of(searchService.users(query, pageable), u -> u);
    }

    @GetMapping("/posts")
    public PageResponse<PostDto> posts(@RequestParam("q") String query,
                                       @CurrentUser AuthPrincipal principal,
                                       @PageableDefault(size = 20) Pageable pageable) {
        return PageMapper.of(searchService.posts(query, principal.userId(), pageable), p -> p);
    }
}
