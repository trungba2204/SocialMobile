package com.socialapp.post;

import com.socialapp.common.security.AuthPrincipal;
import com.socialapp.common.security.CurrentUser;
import com.socialapp.common.web.PageMapper;
import com.socialapp.common.web.PageResponse;
import com.socialapp.post.dto.CreatePostRequest;
import com.socialapp.post.dto.LikeResponse;
import com.socialapp.post.dto.PostDto;
import com.socialapp.post.dto.SharePostRequest;
import com.socialapp.post.dto.UpdatePostRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public PageResponse<PostDto> feed(@CurrentUser AuthPrincipal principal,
                                      @PageableDefault(size = 20) Pageable pageable) {
        return PageMapper.of(postService.feed(principal.userId(), pageable), p -> p);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PostDto create(@CurrentUser AuthPrincipal principal,
                          @Valid @RequestPart("post") CreatePostRequest post,
                          @RequestPart(value = "media", required = false) List<MultipartFile> media) {
        return postService.create(principal.userId(), post, media);
    }

    @GetMapping("/{id}")
    public PostDto get(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        return postService.get(id, principal.userId());
    }

    @PutMapping("/{id}")
    public PostDto update(@PathVariable long id, @CurrentUser AuthPrincipal principal,
                          @Valid @RequestBody UpdatePostRequest request) {
        return postService.update(id, principal.userId(), request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        postService.delete(id, principal.userId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    public LikeResponse like(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        return postService.like(id, principal.userId());
    }

    @DeleteMapping("/{id}/like")
    public LikeResponse unlike(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        return postService.unlike(id, principal.userId());
    }

    @PostMapping("/{id}/share")
    public PostDto share(@PathVariable long id, @CurrentUser AuthPrincipal principal,
                         @Valid @RequestBody(required = false) SharePostRequest request) {
        return postService.share(id, principal.userId(), request);
    }
}
