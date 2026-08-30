package com.socialapp.friend;

import com.socialapp.common.security.AuthPrincipal;
import com.socialapp.common.security.CurrentUser;
import com.socialapp.common.web.PageMapper;
import com.socialapp.common.web.PageResponse;
import com.socialapp.friend.dto.FriendRequestDto;
import com.socialapp.user.dto.UserDto;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    @GetMapping
    public PageResponse<UserDto> friends(@CurrentUser AuthPrincipal principal,
                                         @PageableDefault(size = 20) Pageable pageable) {
        return PageMapper.of(friendService.listFriends(principal.userId(), pageable), u -> u);
    }

    @GetMapping("/requests")
    public PageResponse<FriendRequestDto> requests(@CurrentUser AuthPrincipal principal,
                                                   @PageableDefault(size = 20) Pageable pageable) {
        return PageMapper.of(friendService.incomingRequests(principal.userId(), pageable), r -> r);
    }

    @GetMapping("/suggestions")
    public List<UserDto> suggestions(@CurrentUser AuthPrincipal principal) {
        return friendService.suggestions(principal.userId());
    }

    @PostMapping("/requests/{userId}")
    public FriendRequestDto send(@PathVariable long userId, @CurrentUser AuthPrincipal principal) {
        return friendService.sendRequest(principal.userId(), userId);
    }

    @PostMapping("/requests/{id}/accept")
    public ResponseEntity<Void> accept(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        friendService.accept(id, principal.userId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        friendService.reject(id, principal.userId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> remove(@PathVariable long userId, @CurrentUser AuthPrincipal principal) {
        friendService.removeFriend(principal.userId(), userId);
        return ResponseEntity.noContent().build();
    }
}
