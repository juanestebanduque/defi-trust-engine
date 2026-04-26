package com.example.trustengine.controller;

import com.example.trustengine.dto.UpdateProfileRequest;
import com.example.trustengine.dto.UserProfileResponse;
import com.example.trustengine.service.TrustScoreService;
import com.example.trustengine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;

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

    /** Devuelve el perfil completo del usuario autenticado (cuenta + perfil + resumen financiero). */
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // 1. Verificamos que el header exista y tenga el formato correcto
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Usuario no autenticado: Falta el token");
        }
        // 2. Extraemos el token puro
        String token = authHeader.substring(7);
        try {
            // Utilizamos el método que ya tienes en UserService para sacar la información del usuario desde el token
            // Como getUserByToken valida el token por dentro, si es inválido saltará al catch
            com.example.trustengine.dto.AuthResponse authResponse = userService.getUserByToken(token);
            
            // 3. Obtenemos el perfil con el email que venía dentro del token válido
            UserProfileResponse profile = userService.getMyProfile(authResponse.getEmail());
            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            // Si el token expiró o es inválido, retornamos 401
            return ResponseEntity.status(401).body("Usuario no autenticado: Token inválido");
        }
    }
}
