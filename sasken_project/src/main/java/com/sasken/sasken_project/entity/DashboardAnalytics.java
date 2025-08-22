package com.sasken.sasken_project.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "dashboard_analytics") // FIXED: Removed backslashes
public class DashboardAnalytics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "total_posts") // FIXED: Removed backslashes
    private Long totalPosts;

    @Column(name = "total_drafts") // FIXED: Removed backslashes
    private Long totalDrafts;

    @Column(name = "total_reviews") // FIXED: Removed backslashes
    private Long totalReviews;

    @Column(name = "recent_activity") // FIXED: Removed backslashes
    private String recentActivity;

    @Column(name = "created_at") // FIXED: Removed backslashes
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public DashboardAnalytics() {}

    public DashboardAnalytics(Long totalPosts, Long totalDrafts, Long totalReviews, String recentActivity) {
        this.totalPosts = totalPosts;
        this.totalDrafts = totalDrafts;
        this.totalReviews = totalReviews;
        this.recentActivity = recentActivity;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTotalPosts() { return totalPosts; }
    public void setTotalPosts(Long totalPosts) { this.totalPosts = totalPosts; }

    public Long getTotalDrafts() { return totalDrafts; }
    public void setTotalDrafts(Long totalDrafts) { this.totalDrafts = totalDrafts; }

    public Long getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Long totalReviews) { this.totalReviews = totalReviews; }

    public String getRecentActivity() { return recentActivity; }
    public void setRecentActivity(String recentActivity) { this.recentActivity = recentActivity; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; } // ADDED: Missing setter

    @Override
    public String toString() {
        return "DashboardAnalytics{" +
                "id=" + id +
                ", totalPosts=" + totalPosts +
                ", totalDrafts=" + totalDrafts +
                ", totalReviews=" + totalReviews +
                ", recentActivity='" + recentActivity + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
