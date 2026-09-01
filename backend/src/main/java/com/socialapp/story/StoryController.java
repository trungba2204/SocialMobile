package com.socialapp.story;

import com.socialapp.common.security.AuthPrincipal;
import com.socialapp.common.security.CurrentUser;
import com.socialapp.common.web.PageMapper;
import com.socialapp.common.web.PageResponse;
import com.socialapp.story.dto.StoryDto;
import com.socialapp.story.dto.StoryReelDto;
import com.socialapp.user.dto.UserDto;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/stories")
public class StoryController {

    private final StoryService storyService;

    public StoryController(StoryService storyService) {
        this.storyService = storyService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StoryDto> create(@CurrentUser AuthPrincipal principal,
                                           @RequestPart(value = "file", required = false) MultipartFile file,
                                           @RequestParam(value = "caption", required = false) String caption) {
        StoryDto dto = storyService.create(principal.userId(), file, caption);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping
    public List<StoryReelDto> reels(@CurrentUser AuthPrincipal principal) {
        return storyService.activeReels(principal.userId());
    }

    @GetMapping("/{id}")
    public StoryDto get(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        return storyService.get(id, principal.userId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        storyService.delete(id, principal.userId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<Void> view(@PathVariable long id, @CurrentUser AuthPrincipal principal) {
        storyService.recordView(id, principal.userId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/viewers")
    public PageResponse<UserDto> viewers(@PathVariable long id, @CurrentUser AuthPrincipal principal,
                                         @PageableDefault(size = 20) Pageable pageable) {
        return PageMapper.of(storyService.viewers(id, principal.userId(), pageable), u -> u);
    }
}
