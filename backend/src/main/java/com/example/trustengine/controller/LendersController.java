package com.example.trustengine.controller;

import com.example.trustengine.dto.UserCardResponse;
import com.example.trustengine.service.LendersService;
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
import java.util.List;

@Tag(name = "Directorio de Prestamistas", description = "Búsqueda y guardado de prestamistas en la plataforma")
@RestController
@RequestMapping("/api/lenders")
@RequiredArgsConstructor
public class LendersController {

    private final LendersService lendersService;

    // ── Directorio ─────────────────────────────────────────────────────────────

    @Operation(
        summary     = "Directorio de prestamistas",
        description = "Devuelve la lista de usuarios activos con su Trust Score. " +
                      "Permite filtrar por nombre y rango de score. " +
                      "Excluye al usuario autenticado. Ordenado por score descendente."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista obtenida exitosamente"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    @GetMapping("/directory")
    public ResponseEntity<?> getDirectory(
            @Parameter(description = "Filtro parcial por nombre (case-insensitive)", example = "María")
            @RequestParam(required = false) String name,

            @Parameter(description = "Score mínimo en escala 0–100", example = "40")
            @RequestParam(required = false) BigDecimal minScore,

            @Parameter(description = "Score máximo en escala 0–100", example = "100")
            @RequestParam(required = false) BigDecimal maxScore,

            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(401).body("Debes iniciar sesión para ver el directorio.");
        }
        List<UserCardResponse> result = lendersService.getDirectory(name, minScore, maxScore, principal.getName());
        return ResponseEntity.ok(result);
    }

    // ── Guardar / quitar prestamista ──────────────────────────────────────────

    @Operation(summary = "Guardar un prestamista", description = "Agrega un usuario a la lista de prestamistas guardados del usuario autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Guardado exitosamente"),
        @ApiResponse(responseCode = "400", description = "No puedes guardarte a ti mismo"),
        @ApiResponse(responseCode = "401", description = "No autenticado"),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PostMapping("/{lenderId}/save")
    public ResponseEntity<?> saveLender(
            @Parameter(description = "ID del prestamista a guardar", example = "3")
            @PathVariable Long lenderId,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(401).body("No autenticado.");
        }
        try {
            lendersService.saveLender(principal.getName(), lenderId);
            return ResponseEntity.ok("Prestamista guardado.");
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(404).body(ex.getMessage());
        }
    }

    @Operation(summary = "Eliminar prestamista guardado", description = "Quita un usuario de la lista de prestamistas guardados del usuario autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Eliminado exitosamente"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    @DeleteMapping("/{lenderId}/save")
    public ResponseEntity<?> unsaveLender(
            @Parameter(description = "ID del prestamista a quitar", example = "3")
            @PathVariable Long lenderId,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(401).body("No autenticado.");
        }
        lendersService.unsaveLender(principal.getName(), lenderId);
        return ResponseEntity.noContent().build();
    }
}
