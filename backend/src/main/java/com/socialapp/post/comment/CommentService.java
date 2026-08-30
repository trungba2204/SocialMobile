package com.socialapp.post.comment;

import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.common.exception.ValidationException;
import com.socialapp.notification.NotificationType;
import com.socialapp.notification.spi.NotificationPort;
import com.socialapp.post.Post;
import com.socialapp.post.PostRepository;
import com.socialapp.post.comment.dto.CommentDto;
import com.socialapp.post.comment.dto.CreateCommentRequest;
import com.socialapp.user.User;
import com.socialapp.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

    private final CommentRepository comments;
    private final PostRepository posts;
    private final UserRepository users;
    private final CommentMapper mapper;
    private final NotificationPort notifications;

    public CommentService(CommentRepository comments, PostRepository posts, UserRepository users,
                          CommentMapper mapper, NotificationPort notifications) {
        this.comments = comments;
        this.posts = posts;
        this.users = users;
        this.mapper = mapper;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public Page<CommentDto> list(long postId, Pageable pageable) {
        if (!posts.existsById(postId)) {
            throw new ResourceNotFoundException("Post not found");
        }
        return comments.findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(postId, pageable)
                .map(mapper::toDto);
    }

    @Transactional
    public CommentDto create(long postId, long authorId, CreateCommentRequest request) {
        Post post = posts.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        User author = users.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.parentId() != null) {
            Comment parent = comments.findById(request.parentId())
                    .orElseThrow(() -> new ValidationException("Parent comment not found"));
            if (!parent.getPost().getId().equals(postId)) {
                throw new ValidationException("Parent comment belongs to a different post");
            }
            if (parent.getParentId() != null) {
                throw new ValidationException("Replies may only be one level deep");
            }
        }

        Comment comment = comments.save(new Comment(post, author, request.content().trim(), request.parentId()));
        if (!post.getAuthor().getId().equals(authorId)) {
            notifications.record(post.getAuthor().getId(), authorId,
                    NotificationType.POST_COMMENT, "POST", postId);
        }
        return mapper.toDto(comment);
    }

    @Transactional
    public void delete(long commentId, long requesterId) {
        Comment comment = comments.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        boolean isCommentAuthor = comment.getAuthor().getId().equals(requesterId);
        boolean isPostAuthor = comment.getPost().getAuthor().getId().equals(requesterId);
        if (!isCommentAuthor && !isPostAuthor) {
            throw new ForbiddenException("You cannot delete this comment");
        }
        comments.delete(comment);
    }
}
