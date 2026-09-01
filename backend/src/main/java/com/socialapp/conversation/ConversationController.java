package com.socialapp.conversation;

import com.socialapp.common.security.AuthPrincipal;
import com.socialapp.common.security.CurrentUser;
import com.socialapp.common.web.PageMapper;
import com.socialapp.common.web.PageResponse;
import com.socialapp.conversation.ConversationService.GetOrCreate;
import com.socialapp.conversation.dto.ConversationDto;
import com.socialapp.conversation.dto.CreateConversationRequest;
import com.socialapp.conversation.dto.MessageDto;
import com.socialapp.conversation.dto.SendMessageRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public PageResponse<ConversationDto> list(@CurrentUser AuthPrincipal principal,
                                              @PageableDefault(size = 20) Pageable pageable) {
        return PageMapper.of(conversationService.listMine(principal.userId(), pageable), c -> c);
    }

    @PostMapping
    public ResponseEntity<ConversationDto> create(@Valid @RequestBody CreateConversationRequest request,
                                                  @CurrentUser AuthPrincipal principal) {
        GetOrCreate result = conversationService.getOrCreateDirect(principal.userId(), request.peerUserId());
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(result.conversation());
    }

    @GetMapping("/{id}")
    public ConversationDto get(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        return conversationService.get(id, principal.userId());
    }

    @GetMapping("/{id}/messages")
    public PageResponse<MessageDto> messages(@PathVariable long id, @CurrentUser AuthPrincipal principal,
                                             @PageableDefault(size = 20) Pageable pageable) {
        return PageMapper.of(conversationService.messages(id, principal.userId(), pageable), m -> m);
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageDto> send(@PathVariable long id,
                                           @Valid @RequestBody SendMessageRequest request,
                                           @CurrentUser AuthPrincipal principal) {
        MessageDto dto = conversationService.send(id, principal.userId(), request.content());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        conversationService.markRead(id, principal.userId());
        return ResponseEntity.noContent().build();
    }
}
