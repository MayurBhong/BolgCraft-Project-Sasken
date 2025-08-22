package com.sasken.sasken_project.service; // FIXED: Removed backslash

import org.springframework.beans.factory.annotation.Autowired; // FIXED: Removed backslash
import org.springframework.stereotype.Service; // FIXED: Correct import for nested enum

import com.sasken.sasken_project.entity.DashboardAnalytics; // FIXED: Removed backslash
import com.sasken.sasken_project.entity.Post.PostStatus; // FIXED: Removed backslash
import com.sasken.sasken_project.repository.DashboardRepository;
import com.sasken.sasken_project.repository.PostRepository;

@Service
public class DashboardService {

    @Autowired
    private DashboardRepository dashboardRepository;

    @Autowired
    private PostRepository postRepository;

    public DashboardAnalytics getDashboardAnalytics() {
        // Calculate real-time analytics by counting posts with different statuses
        Long totalPosts = postRepository.countByStatus(PostStatus.PUBLISHED);
        Long totalDrafts = postRepository.countByStatus(PostStatus.DRAFT);
        Long totalReviews = postRepository.countByStatus(PostStatus.REVIEWED);

        return new DashboardAnalytics(totalPosts, totalDrafts, totalReviews, "Recent activity updated");
    }

    public DashboardAnalytics getLatestAnalytics() {
        // Retrieve the most recently saved analytics snapshot
        return dashboardRepository.findTopByOrderByCreatedAtDesc();
    }

    // Optional: Method to save analytics snapshot for historical data
    public DashboardAnalytics saveAnalyticsSnapshot() {
        DashboardAnalytics currentAnalytics = getDashboardAnalytics();
        return dashboardRepository.save(currentAnalytics);
    }
}
