package com.sasken.sasken_project.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sasken.sasken_project.entity.DashboardAnalytics;
import com.sasken.sasken_project.service.DashboardService;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/analytics")
    public ResponseEntity<DashboardAnalytics> getDashboardAnalytics() {
        try {
            DashboardAnalytics analytics = dashboardService.getDashboardAnalytics();
            return new ResponseEntity<>(analytics, HttpStatus.OK);
        } catch (Exception e) {
            // CORRECTED: Removed backslash before underscore
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/latest")
    public ResponseEntity<DashboardAnalytics> getLatestAnalytics() {
        DashboardAnalytics analytics = dashboardService.getLatestAnalytics();
        if (analytics != null) {
            return new ResponseEntity<>(analytics, HttpStatus.OK);
        }
        // CORRECTED: Removed backslash before underscore
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}
