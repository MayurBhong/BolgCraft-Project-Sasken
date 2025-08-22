package com.sasken.sasken_project; // FIXED: Removed backslash

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SaskenProjectApplication {

    public static void main(String[] args) {
        SpringApplication.run(SaskenProjectApplication.class, args);
        System.out.println("Sasken Project Application Started Successfully!");
        System.out.println("Dashboard API: http://localhost:8080/api/dashboard/analytics");
        System.out.println("Posts API: http://localhost:8080/api/posts");
        System.out.println("Database: MySQL on localhost:3306/sasken_db");
    }
}
