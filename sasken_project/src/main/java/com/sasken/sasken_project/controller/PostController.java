package com.sasken.sasken_project.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sasken.sasken_project.entity.Post;
import com.sasken.sasken_project.service.PostService;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class PostController {

    @Autowired
    private PostService postService;

    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        List<Post> posts = postService.getAllPosts();
        return new ResponseEntity<>(posts, HttpStatus.OK);
    }

    @GetMapping("/drafts")
    public ResponseEntity<List<Post>> getAllDrafts() {
        List<Post> drafts = postService.getAllDrafts();
        return new ResponseEntity<>(drafts, HttpStatus.OK);
    }

    @GetMapping("/review")
    public ResponseEntity<List<Post>> getPostsForReview() {
        List<Post> reviewPosts = postService.getAllForReview();
        return new ResponseEntity<>(reviewPosts, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id) {
        Optional<Post> post = postService.getPostById(id);
        return post.map(p -> new ResponseEntity<>(p, HttpStatus.OK))
                   .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND)); // FIXED
    }

    @PostMapping("/create")
    public ResponseEntity<Post> createPost(@RequestBody Post post) {
        try {
            Post createdPost = postService.createPost(post);
            return new ResponseEntity<>(createdPost, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST); // FIXED
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> updatePost(@PathVariable Long id, @RequestBody Post post) {
        Post updatedPost = postService.updatePost(id, post);
        if (updatedPost != null) {
            return new ResponseEntity<>(updatedPost, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND); // FIXED
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<Post> publishPost(@PathVariable Long id) {
        Post publishedPost = postService.publishPost(id);
        if (publishedPost != null) {
            return new ResponseEntity<>(publishedPost, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND); // FIXED
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<Post> submitForReview(@PathVariable Long id) {
        Post reviewPost = postService.submitForReview(id);
        if (reviewPost != null) {
            return new ResponseEntity<>(reviewPost, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND); // FIXED
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        try {
            postService.deletePost(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT); // FIXED
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // FIXED
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Post>> searchPosts(@RequestParam String keyword) {
        List<Post> posts = postService.searchPosts(keyword);
        return new ResponseEntity<>(posts, HttpStatus.OK);
    }
}
