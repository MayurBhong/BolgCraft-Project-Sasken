package com.sasken.sasken_project.repository; // FIXED: Removed backslash

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sasken.sasken_project.entity.Post; // FIXED: Removed backslash
import com.sasken.sasken_project.entity.Post.PostStatus; // FIXED: Removed backslash

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    // Find posts by status
    List<Post> findByStatus(PostStatus status);
    
    // Find posts by author
    List<Post> findByAuthor(String author);
    
    // Search posts by title (case-insensitive)
    List<Post> findByTitleContainingIgnoreCase(String title);
    
    // Custom queries for specific post states
    @Query("SELECT p FROM Post p WHERE p.status = 'DRAFT' ORDER BY p.updatedAt DESC")
    List<Post> findAllDrafts();
    
    @Query("SELECT p FROM Post p WHERE p.status = 'REVIEWED' ORDER BY p.updatedAt DESC")
    List<Post> findAllReviewed();
    
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' ORDER BY p.createdAt DESC")
    List<Post> findAllPublished();
    
    // Count posts by status (used by DashboardService)
    @Query("SELECT COUNT(p) FROM Post p WHERE p.status = :status")
    Long countByStatus(@Param("status") PostStatus status);
}
