package com.socialapp.friend;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    Optional<FriendRequest> findByRequesterIdAndAddresseeId(Long requesterId, Long addresseeId);

    Optional<FriendRequest> findByIdAndAddresseeId(Long id, Long addresseeId);

    Page<FriendRequest> findByAddresseeIdAndStatusOrderByCreatedAtDesc(
            Long addresseeId, FriendRequestStatus status, Pageable pageable);

    List<FriendRequest> findByRequesterIdAndStatus(Long requesterId, FriendRequestStatus status);

    List<FriendRequest> findByAddresseeIdAndStatus(Long addresseeId, FriendRequestStatus status);
}
