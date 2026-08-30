package com.socialapp.storage;

import com.socialapp.common.exception.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalStorageServiceTest {

    private LocalStorageService service;
    private Path root;

    @BeforeEach
    void setup(@TempDir Path tmp) {
        this.root = tmp;
        StorageProperties props = new StorageProperties();
        props.setDir(tmp.toString());
        this.service = new LocalStorageService(props);
    }

    @Test
    void storesImageAndReturnsPublicUrl() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "a.png", "image/png", new byte[]{1, 2, 3});

        StoredFile stored = service.store(file, "avatars");

        assertThat(stored.url()).startsWith("/api/media/avatars/");
        assertThat(stored.key()).startsWith("avatars/");
        assertThat(Files.exists(root.resolve(stored.key()))).isTrue();
    }

    @Test
    void rejectsUnsupportedType() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "a.txt", "text/plain", new byte[]{1});
        assertThatThrownBy(() -> service.store(file, "avatars"))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void loadThenDelete() {
        StoredFile stored = service.store(
                new MockMultipartFile("file", "a.png", "image/png", new byte[]{9}), "posts");

        assertThat(service.load(stored.key()).exists()).isTrue();

        service.delete(stored.url());
        assertThat(Files.exists(root.resolve(stored.key()))).isFalse();
    }
}
