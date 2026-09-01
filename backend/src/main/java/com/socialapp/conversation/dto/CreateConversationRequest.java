package com.socialapp.conversation.dto;

import jakarta.validation.constraints.NotNull;

public record CreateConversationRequest(
        @NotNull Long peerUserId
) {
}
