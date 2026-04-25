package com.example.trustengine.controller;

import com.example.trustengine.dto.UpdateProfileRequest;
import com.example.trustengine.service.TrustScoreService;
import com.example.trustengine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final TrustScoreService trustScoreService;
    private final UserService userService;

    /** Devuelve el último Trust Score de un usuario dado su ID. */
    @GetMapping("/{userId}/trust-score")
    public ResponseEntity<BigDecimal> getTrustScore(@PathVariable Long userId) {
        BigDecimal score = trustScoreService.getLatestScore(userId);
        return ResponseEntity.ok(score);
    }

    /** Actualiza el perfil financiero y datos del usuario. */
    @PutMapping("/{userId}/profile")
    public ResponseEntity<String> updateProfile(@PathVariable Long userId, @RequestBody UpdateProfileRequest request) {
        userService.updateUserProfile(userId, request);
        return ResponseEntity.ok("Perfil actualizado exitosamente.");
    }
}
