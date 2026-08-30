package com.socialapp.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    StoredFile store(MultipartFile file, String keyPrefix);

    void delete(String key);

    Resource load(String key);
}
