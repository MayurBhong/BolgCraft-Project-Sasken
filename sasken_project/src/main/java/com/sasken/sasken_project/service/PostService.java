package com.sasken.sasken_project.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sasken.sasken_project.entity.Post;
import com.sasken.sasken_project.entity.Post.PostStatus;
import com.sasken.sasken_project.repository.PostRepository;

@Service
@Transactional(readOnly = true) // Default to read-only transactions for performance
public class PostService {

    @Autowired
    private PostRepository postRepository;

    // Get all published posts
    public List<Post> getAllPosts() {
        return postRepository.findAllPublished();
    }

    // Get all draft posts
    public List<Post> getAllDrafts() {
        return postRepository.findAllDrafts();
    }

    // Get all posts under review
    public List<Post> getAllForReview() {
        return postRepository.findAllReviewed();
    }

    // Get a specific post by ID
    public Optional<Post> getPostById(Long id) {
        return postRepository.findById(id);
    }

    // Create a new post (starts as draft)
    @Transactional // Write transaction needed
    public Post createPost(Post post) {
        post.setStatus(PostStatus.DRAFT); // New posts start as drafts
        return postRepository.save(post);
    }

    // Update an existing post
    @Transactional
    public Post updatePost(Long id, Post updatedPost) {
        Optional<Post> existingPost = postRepository.findById(id);
        if (existingPost.isPresent()) {
            Post post = existingPost.get();
            post.setTitle(updatedPost.getTitle());
            post.setContent(updatedPost.getContent());
            post.setAuthor(updatedPost.getAuthor());
            // Note: Status is not updated here - use specific methods for status changes
            return postRepository.save(post);
        }
        return null; // Post not found
    }

    // Publish a post (change status from DRAFT/REVIEWED to PUBLISHED)
    @Transactional
    public Post publishPost(Long id) {
        Optional<Post> post = postRepository.findById(id);
        if (post.isPresent()) {
            Post p = post.get();
            p.setStatus(PostStatus.PUBLISHED);
            return postRepository.save(p);
        }
        return null;
    }

    // Submit post for review (change status to REVIEWED)
    @Transactional
    public Post submitForReview(Long id) {
        Optional<Post> post = postRepository.findById(id);
        if (post.isPresent()) {
            Post p = post.get();
            p.setStatus(PostStatus.REVIEWED);
            return postRepository.save(p);
        }
        return null;
    }

    // Delete a post permanently
    @Transactional
    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    // Search posts by title (case-insensitive)
    public List<Post> searchPosts(String keyword) {
        return postRepository.findByTitleContainingIgnoreCase(keyword);
    }

    // Additional useful methods
    public List<Post> getPostsByAuthor(String author) {
        return postRepository.findByAuthor(author);
    }

    public List<Post> getPostsByStatus(PostStatus status) {
        return postRepository.findByStatus(status);
    }

    // New method: increment like count
    @Transactional
    public Post likePost(Long id) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            post.setLikes(post.getLikes() + 1);
            return postRepository.save(post);
        }
        return null;
    }

    // New method: add comment
    @Transactional
    public Post addComment(Long id, String comment) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            post.getComments().add(comment);
            return postRepository.save(post);
        }
        return null;
    }

    // New method: add feedback
    @Transactional
    public Post addFeedback(Long id, String feedback) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            post.getFeedback().add(feedback);
            return postRepository.save(post);
        }
        return null;
    }
}
