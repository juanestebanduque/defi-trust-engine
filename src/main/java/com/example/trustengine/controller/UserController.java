package com.example.trustengine.controller;

import com.example.trustengine.service.TrustScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final TrustScoreService trustScoreService;

    /** Devuelve el último Trust Score de un usuario dado su ID. */
    @GetMapping("/{userId}/trust-score")
    public ResponseEntity<BigDecimal> getTrustScore(@PathVariable Long userId) {
        BigDecimal score = trustScoreService.getLatestScore(userId);
        return ResponseEntity.ok(score);
    }
}
