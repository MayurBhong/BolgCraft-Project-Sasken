package com.sasken.sasken_project.repository; // FIXED: Removed backslash

import org.springframework.data.jpa.repository.JpaRepository; // FIXED: Removed backslash
import org.springframework.stereotype.Repository;

import com.sasken.sasken_project.entity.DashboardAnalytics;

@Repository
public interface DashboardRepository extends JpaRepository<DashboardAnalytics, Long> {
    // This method finds the most recent analytics entry
    DashboardAnalytics findTopByOrderByCreatedAtDesc();
}
