package com.socialapp.storage;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final StorageService storageService;

    public MediaController(StorageService storageService) {
        this.storageService = storageService;
    }

    @GetMapping("/{prefix}/{filename}")
    public ResponseEntity<Resource> serve(@PathVariable String prefix, @PathVariable String filename) {
        Resource resource = storageService.load(prefix + "/" + filename);
        MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            String probe = resource.getFile().toPath() != null
                    ? java.nio.file.Files.probeContentType(resource.getFile().toPath()) : null;
            if (probe != null) {
                contentType = MediaType.parseMediaType(probe);
            }
        } catch (IOException | UnsupportedOperationException ignored) {
            // fall back to octet-stream
        }
        return ResponseEntity.ok()
                .contentType(contentType)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(resource);
    }
}
