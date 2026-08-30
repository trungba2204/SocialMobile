package com.socialapp.common.web;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PageMapperTest {

    @Test
    void mapsContentAndMetadata() {
        Page<Integer> src = new PageImpl<>(List.of(1, 2), PageRequest.of(1, 2), 10);

        PageResponse<String> out = PageMapper.of(src, String::valueOf);

        assertThat(out.content()).containsExactly("1", "2");
        assertThat(out.page()).isEqualTo(1);
        assertThat(out.size()).isEqualTo(2);
        assertThat(out.totalElements()).isEqualTo(10);
        assertThat(out.totalPages()).isEqualTo(5);
        assertThat(out.last()).isFalse();
    }
}
