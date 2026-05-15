package com.example.trustengine.controller;

import com.example.trustengine.dto.PublicProfileResponse;
import com.example.trustengine.dto.UpdateProfileRequest;
import com.example.trustengine.dto.UserProfileResponse;
import com.example.trustengine.service.PublicProfileService;
import com.example.trustengine.service.TrustScoreService;
import com.example.trustengine.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;

@Tag(name = "Usuarios", description = "Gestión de perfiles y Trust Score de usuarios")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final TrustScoreService trustScoreService;
    private final UserService userService;
    private final PublicProfileService publicProfileService;

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
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Usuario no autenticado: Falta el token");
        }
        String token = authHeader.substring(7);
        try {
            com.example.trustengine.dto.AuthResponse authResponse = userService.getUserByToken(token);
            UserProfileResponse profile = userService.getMyProfile(authResponse.getEmail());
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Usuario no autenticado: Token inválido");
        }
    }

    // ── HU-16: Perfil público ──────────────────────────────────────────────────

    @Operation(
        summary = "Ver perfil público de un usuario",
        description = "Devuelve el Trust Score, nivel y resumen de historial de pagos de un usuario. " +
                      "No expone datos privados (email, contraseña, documentos, dirección ni teléfono). " +
                      "Si la cuenta está bloqueada, el campo 'blocked' será true."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Perfil público obtenido exitosamente"),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    @GetMapping("/{id}/public-profile")
    public ResponseEntity<?> getPublicProfile(
            @Parameter(description = "ID del usuario cuyo perfil público se desea consultar", example = "2")
            @PathVariable Long id,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(401).body("Debes iniciar sesión para ver perfiles públicos.");
        }
        try {
            PublicProfileResponse profile = publicProfileService.getPublicProfile(id);
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(404).body(ex.getMessage());
        }
    }
}
