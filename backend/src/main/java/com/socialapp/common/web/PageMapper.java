package com.socialapp.common.web;

import org.springframework.data.domain.Page;

import java.util.function.Function;

public final class PageMapper {

    private PageMapper() {
    }

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
