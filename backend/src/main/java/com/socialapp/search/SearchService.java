package com.socialapp.search;

import com.socialapp.post.PostService;
import com.socialapp.post.dto.PostDto;
import com.socialapp.user.UserMapper;
import com.socialapp.user.UserRepository;
import com.socialapp.user.dto.UserDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SearchService {

    private static final int MIN_QUERY_LENGTH = 2;

    private final UserRepository users;
    private final UserMapper userMapper;
    private final PostService postService;

    public SearchService(UserRepository users, UserMapper userMapper, PostService postService) {
        this.users = users;
        this.userMapper = userMapper;
        this.postService = postService;
    }

    @Transactional(readOnly = true)
    public Page<UserDto> users(String query, Pageable pageable) {
        String q = query == null ? "" : query.trim();
        if (q.length() < MIN_QUERY_LENGTH) {
            return Page.empty(pageable);
        }
        return users.findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(q, q, pageable)
                .map(userMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<PostDto> posts(String query, long viewerId, Pageable pageable) {
        return postService.search(query, viewerId, pageable);
    }
}
