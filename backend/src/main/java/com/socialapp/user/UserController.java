package com.socialapp.user;

import com.socialapp.common.security.AuthPrincipal;
import com.socialapp.common.security.CurrentUser;
import com.socialapp.common.web.PageMapper;
import com.socialapp.common.web.PageResponse;
import com.socialapp.post.PostService;
import com.socialapp.post.dto.PostDto;
import com.socialapp.user.dto.UpdateUserRequest;
import com.socialapp.user.dto.UserDto;
import com.socialapp.user.dto.UserProfileDto;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final PostService postService;

    public UserController(UserService userService, PostService postService) {
        this.userService = userService;
        this.postService = postService;
    }

    @GetMapping("/{id}")
    public UserProfileDto getById(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        return userService.getProfile(id, principal.userId());
    }

    @PutMapping("/me")
    public UserDto updateMe(@CurrentUser AuthPrincipal principal,
                            @Valid @RequestBody UpdateUserRequest request) {
        return userService.updateMe(principal.userId(), request);
    }

    @PostMapping("/me/avatar")
    public Map<String, String> setAvatar(@CurrentUser AuthPrincipal principal,
                                         @RequestParam("file") MultipartFile file) {
        return Map.of("url", userService.setAvatar(principal.userId(), file));
    }

    @PostMapping("/me/cover")
    public Map<String, String> setCover(@CurrentUser AuthPrincipal principal,
                                        @RequestParam("file") MultipartFile file) {
        return Map.of("url", userService.setCover(principal.userId(), file));
    }

    @GetMapping("/{id}/posts")
    public PageResponse<PostDto> postsByUser(@PathVariable long id,
                                             @CurrentUser AuthPrincipal principal,
                                             @PageableDefault(size = 20) Pageable pageable) {
        return PageMapper.of(postService.byAuthor(id, principal.userId(), pageable), p -> p);
    }
}
