package com.example.trustengine.controller;

import com.example.trustengine.dto.TrustScoreResponseDTO;
import com.example.trustengine.service.TrustScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/trust-scores")
@RequiredArgsConstructor
public class TrustScoreController {

    private final TrustScoreService trustScoreService;

    /** CA1 + CA2 + CA3: Obtener el Trust Score actual con nivel y desglose. */
    @GetMapping("/me")
    public ResponseEntity<?> getMyTrustScore(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Usuario no autenticado");
        }

        try {
            TrustScoreResponseDTO response = trustScoreService.getTrustScoreForUser(principal.getName());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al consultar el trust score: " + e.getMessage());
        }
    }
}
