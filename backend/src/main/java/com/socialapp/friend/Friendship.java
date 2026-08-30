package com.socialapp.friend;

import com.socialapp.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "friendships",
        uniqueConstraints = @UniqueConstraint(name = "uk_friendship_pair",
                columnNames = {"user_low_id", "user_high_id"}),
        indexes = {
                @Index(name = "ix_friendship_low", columnList = "user_low_id"),
                @Index(name = "ix_friendship_high", columnList = "user_high_id")
        })
public class Friendship extends BaseEntity {

    @Column(name = "user_low_id", nullable = false)
    private Long userLowId;

    @Column(name = "user_high_id", nullable = false)
    private Long userHighId;

    protected Friendship() {
    }

    private Friendship(Long low, Long high) {
        this.userLowId = low;
        this.userHighId = high;
    }

    public static Friendship of(long a, long b) {
        if (a == b) {
            throw new IllegalArgumentException("Cannot befriend yourself");
        }
        return a < b ? new Friendship(a, b) : new Friendship(b, a);
    }

    public Long getUserLowId() {
        return userLowId;
    }

    public Long getUserHighId() {
        return userHighId;
    }
}
