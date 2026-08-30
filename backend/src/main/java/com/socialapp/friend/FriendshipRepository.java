package com.socialapp.friend;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    @Query("""
            select case when count(f) > 0 then true else false end from Friendship f
            where (f.userLowId = :low and f.userHighId = :high)
            """)
    boolean existsOrderedPair(@Param("low") long low, @Param("high") long high);

    @Query("select f from Friendship f where f.userLowId = :userId or f.userHighId = :userId")
    List<Friendship> findAllForUser(@Param("userId") long userId);

    @Modifying
    @Query("delete from Friendship f where (f.userLowId = :low and f.userHighId = :high)")
    void deleteOrderedPair(@Param("low") long low, @Param("high") long high);

    @Query("""
            select case when f.userLowId = :userId then f.userHighId else f.userLowId end
            from Friendship f where f.userLowId = :userId or f.userHighId = :userId
            """)
    Set<Long> findFriendIds(@Param("userId") long userId);

    @Query("""
            select u from com.socialapp.user.User u where u.id in (
              select case when f.userLowId = :userId then f.userHighId else f.userLowId end
              from Friendship f where f.userLowId = :userId or f.userHighId = :userId
            )
            """)
    Page<com.socialapp.user.User> findFriends(@Param("userId") long userId, Pageable pageable);
}
