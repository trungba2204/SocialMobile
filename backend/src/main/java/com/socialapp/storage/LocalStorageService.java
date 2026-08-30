package com.socialapp.storage;

import com.socialapp.common.exception.ResourceNotFoundException;
import com.socialapp.common.exception.ValidationException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class LocalStorageService implements StorageService {

    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
    private static final long MAX_VIDEO_BYTES = 50L * 1024 * 1024;

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "video/mp4", "mp4");

    private static final Set<String> VIDEO_TYPES = Set.of("video/mp4");

    private final Path root;
    private final String publicPrefix;

    public LocalStorageService(StorageProperties properties) {
        this.root = Paths.get(properties.getDir()).toAbsolutePath().normalize();
        this.publicPrefix = "/api/media";
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create storage directory " + root, e);
        }
    }

    @Override
    public StoredFile store(MultipartFile file, String keyPrefix) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("File is required");
        }
        String contentType = file.getContentType();
        String ext = EXTENSIONS.get(contentType);
        if (ext == null) {
            throw new ValidationException("Unsupported file type: " + contentType);
        }
        long max = VIDEO_TYPES.contains(contentType) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
        if (file.getSize() > max) {
            throw new ValidationException("File exceeds maximum allowed size");
        }

        String safePrefix = sanitizePrefix(keyPrefix);
        String filename = UUID.randomUUID() + "." + ext;
        String key = safePrefix + "/" + filename;
        Path target = root.resolve(key).normalize();
        if (!target.startsWith(root)) {
            throw new ValidationException("Invalid storage path");
        }
        try {
            Files.createDirectories(target.getParent());
            file.transferTo(target);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file", e);
        }
        return new StoredFile(key, publicPrefix + "/" + key);
    }

    @Override
    public void delete(String key) {
        if (!StringUtils.hasText(key)) {
            return;
        }
        try {
            Path target = root.resolve(stripPublicPrefix(key)).normalize();
            if (target.startsWith(root)) {
                Files.deleteIfExists(target);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to delete file", e);
        }
    }

    @Override
    public Resource load(String key) {
        Path target = root.resolve(stripPublicPrefix(key)).normalize();
        if (!target.startsWith(root)) {
            throw new ResourceNotFoundException("File not found");
        }
        try {
            Resource resource = new UrlResource(target.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("File not found");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File not found");
        }
    }

    private String stripPublicPrefix(String key) {
        return key.startsWith(publicPrefix + "/") ? key.substring(publicPrefix.length() + 1) : key;
    }

    private String sanitizePrefix(String prefix) {
        String cleaned = prefix == null ? "misc" : prefix.replaceAll("[^a-zA-Z0-9_-]", "");
        return cleaned.isBlank() ? "misc" : cleaned;
    }
}
