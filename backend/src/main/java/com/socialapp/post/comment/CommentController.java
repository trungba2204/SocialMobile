package com.socialapp.post.comment;

import com.socialapp.common.security.AuthPrincipal;
import com.socialapp.common.security.CurrentUser;
import com.socialapp.common.web.PageMapper;
import com.socialapp.common.web.PageResponse;
import com.socialapp.post.comment.dto.CommentDto;
import com.socialapp.post.comment.dto.CreateCommentRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/api/posts/{postId}/comments")
    public PageResponse<CommentDto> list(@PathVariable long postId,
                                         @PageableDefault(size = 20) Pageable pageable) {
        return PageMapper.of(commentService.list(postId, pageable), c -> c);
    }

    @PostMapping("/api/posts/{postId}/comments")
    public CommentDto create(@PathVariable long postId, @CurrentUser AuthPrincipal principal,
                             @Valid @RequestBody CreateCommentRequest request) {
        return commentService.create(postId, principal.userId(), request);
    }

    @DeleteMapping("/api/comments/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        commentService.delete(id, principal.userId());
        return ResponseEntity.noContent().build();
    }
}
