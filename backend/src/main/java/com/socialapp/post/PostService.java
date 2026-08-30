package com.socialapp.post;

import com.socialapp.common.exception.ForbiddenException;
import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.common.exception.ValidationException;
import com.socialapp.friend.spi.FriendGraphPort;
import com.socialapp.notification.NotificationType;
import com.socialapp.notification.spi.NotificationPort;
import com.socialapp.post.comment.CommentRepository;
import com.socialapp.post.dto.CreatePostRequest;
import com.socialapp.post.dto.LikeResponse;
import com.socialapp.post.dto.PostDto;
import com.socialapp.post.dto.SharePostRequest;
import com.socialapp.post.dto.UpdatePostRequest;
import com.socialapp.post.like.PostLike;
import com.socialapp.post.like.PostLikeRepository;
import com.socialapp.post.share.Share;
import com.socialapp.post.share.ShareRepository;
import com.socialapp.storage.StorageService;
import com.socialapp.storage.StoredFile;
import com.socialapp.user.User;
import com.socialapp.user.UserRepository;
import com.socialapp.user.spi.PostStatsPort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class PostService implements PostStatsPort {

    private static final int MAX_MEDIA = 4;

    private final PostRepository posts;
    private final PostLikeRepository likes;
    private final ShareRepository shares;
    private final CommentRepository comments;
    private final UserRepository users;
    private final StorageService storage;
    private final PostMapper postMapper;
    private final FriendGraphPort friendGraph;
    private final NotificationPort notifications;

    public PostService(PostRepository posts, PostLikeRepository likes, ShareRepository shares,
                       CommentRepository comments, UserRepository users, StorageService storage,
                       PostMapper postMapper, FriendGraphPort friendGraph, NotificationPort notifications) {
        this.posts = posts;
        this.likes = likes;
        this.shares = shares;
        this.comments = comments;
        this.users = users;
        this.storage = storage;
        this.postMapper = postMapper;
        this.friendGraph = friendGraph;
        this.notifications = notifications;
    }

    @Transactional
    public PostDto create(long authorId, CreatePostRequest request, List<MultipartFile> media) {
        boolean hasText = StringUtils.hasText(request.content());
        boolean hasMedia = media != null && !media.isEmpty();
        if (!hasText && !hasMedia) {
            throw new ValidationException("A post must have text or media");
        }
        if (hasMedia && media.size() > MAX_MEDIA) {
            throw new ValidationException("A post may include at most " + MAX_MEDIA + " media items");
        }
        User author = users.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Post post = new Post(author, hasText ? request.content().trim() : null, request.privacy());
        post.setFeeling(trimToNull(request.feeling()));
        post.setLocation(trimToNull(request.location()));

        if (hasMedia) {
            int position = 0;
            for (MultipartFile file : media) {
                StoredFile stored = storage.store(file, "posts");
                MediaType type = isVideo(file.getContentType()) ? MediaType.VIDEO : MediaType.IMAGE;
                post.addMedia(new PostMedia(stored.url(), type, position++));
            }
        }
        post = posts.save(post);
        return toDto(post, authorId);
    }

    @Transactional(readOnly = true)
    public PostDto get(long postId, long viewerId) {
        Post post = requireVisible(postId, viewerId);
        return toDto(post, viewerId);
    }

    @Transactional(readOnly = true)
    public Page<PostDto> feed(long viewerId, Pageable pageable) {
        Page<Post> page = posts.findFeed(viewerId, friendIdsOrSentinel(viewerId), pageable);
        return mapPage(page, viewerId);
    }

    @Transactional(readOnly = true)
    public Page<PostDto> search(String query, long viewerId, Pageable pageable) {
        if (query == null || query.trim().length() < 2) {
            return Page.empty(pageable);
        }
        Page<Post> page = posts.searchVisible(query.trim(), viewerId, friendIdsOrSentinel(viewerId), pageable);
        return mapPage(page, viewerId);
    }

    @Transactional(readOnly = true)
    public Page<PostDto> byAuthor(long authorId, long viewerId, Pageable pageable) {
        Page<Post> page = posts.findByAuthorIdOrderByCreatedAtDesc(authorId, pageable);
        return mapPage(page, viewerId);
    }

    @Transactional
    public PostDto update(long postId, long requesterId, UpdatePostRequest request) {
        Post post = posts.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        if (!post.getAuthor().getId().equals(requesterId)) {
            throw new ForbiddenException("You can only edit your own posts");
        }
        if (request.content() != null) {
            post.setContent(request.content().isBlank() ? null : request.content().trim());
        }
        if (request.privacy() != null) {
            post.setPrivacy(request.privacy());
        }
        if (request.feeling() != null) {
            post.setFeeling(trimToNull(request.feeling()));
        }
        if (request.location() != null) {
            post.setLocation(trimToNull(request.location()));
        }
        return toDto(post, requesterId);
    }

    @Transactional
    public void delete(long postId, long requesterId) {
        Post post = posts.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        if (!post.getAuthor().getId().equals(requesterId)) {
            throw new ForbiddenException("You can only delete your own posts");
        }
        post.getMedia().forEach(m -> storage.delete(m.getUrl()));
        likes.deleteByPostId(postId);
        shares.deleteByPostId(postId);
        comments.deleteByPostId(postId);
        posts.delete(post);
    }

    @Transactional
    public LikeResponse like(long postId, long userId) {
        Post post = requireVisible(postId, userId);
        if (!likes.existsByPostIdAndUserId(postId, userId)) {
            likes.save(new PostLike(postId, userId));
            if (!post.getAuthor().getId().equals(userId)) {
                notifications.record(post.getAuthor().getId(), userId,
                        NotificationType.POST_LIKE, "POST", postId);
            }
        }
        return new LikeResponse(true, likes.countByPostId(postId));
    }

    @Transactional
    public LikeResponse unlike(long postId, long userId) {
        likes.deleteByPostIdAndUserId(postId, userId);
        return new LikeResponse(false, likes.countByPostId(postId));
    }

    @Transactional
    public PostDto share(long postId, long userId, SharePostRequest request) {
        Post post = requireVisible(postId, userId);
        if (shares.existsByPostIdAndUserId(postId, userId)) {
            throw new com.socialapp.common.exception.ConflictException("You already shared this post");
        }
        shares.save(new Share(postId, userId, request == null ? null : trimToNull(request.caption())));
        if (!post.getAuthor().getId().equals(userId)) {
            notifications.record(post.getAuthor().getId(), userId,
                    NotificationType.POST_SHARE, "POST", postId);
        }
        return toDto(post, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public long postCount(long userId) {
        return posts.countByAuthorId(userId);
    }

    // --- helpers ---

    private Post requireVisible(long postId, long viewerId) {
        Post post = posts.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        if (canView(post, viewerId)) {
            return post;
        }
        throw new ResourceNotFoundException("Post not found");
    }

    private boolean canView(Post post, long viewerId) {
        Long authorId = post.getAuthor().getId();
        if (authorId.equals(viewerId)) {
            return true;
        }
        return switch (post.getPrivacy()) {
            case PUBLIC -> true;
            case FRIENDS -> friendGraph.friendIds(viewerId).contains(authorId);
            case PRIVATE -> false;
        };
    }

    private Page<PostDto> mapPage(Page<Post> page, long viewerId) {
        List<Post> content = page.getContent();
        List<Long> ids = content.stream().map(Post::getId).toList();
        Set<Long> liked = ids.isEmpty() ? Set.of()
                : new HashSet<>(likes.findLikedPostIds(viewerId, ids));
        List<PostDto> dtos = new ArrayList<>(content.size());
        for (Post post : content) {
            dtos.add(postMapper.toDto(post,
                    likes.countByPostId(post.getId()),
                    comments.countByPostId(post.getId()),
                    shares.countByPostId(post.getId()),
                    liked.contains(post.getId())));
        }
        return new org.springframework.data.domain.PageImpl<>(dtos, page.getPageable(), page.getTotalElements());
    }

    private PostDto toDto(Post post, long viewerId) {
        return postMapper.toDto(post,
                likes.countByPostId(post.getId()),
                comments.countByPostId(post.getId()),
                shares.countByPostId(post.getId()),
                likes.existsByPostIdAndUserId(post.getId(), viewerId));
    }

    private Collection<Long> friendIdsOrSentinel(long viewerId) {
        Set<Long> ids = new HashSet<>(friendGraph.friendIds(viewerId));
        ids.add(-1L);
        return ids;
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static boolean isVideo(String contentType) {
        return contentType != null && contentType.startsWith("video/");
    }
}
