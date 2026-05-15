package com.example.trustengine.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDate;

@Schema(description = "Tarjeta pública de un usuario en el directorio de prestamistas")
public record UserCardResponse(

        @Schema(description = "ID del usuario", example = "3")
        Long userId,

        @Schema(description = "Nombre para mostrar (sin email ni datos privados)", example = "María García")
        String displayName,

        @Schema(description = "Trust Score en escala 0–100", example = "75.00")
        BigDecimal trustScore,

        @Schema(description = "Nivel: ALTO, MEDIO o BAJO", example = "ALTO")
        String level,

        @Schema(description = "Descripción del nivel de confianza")
        String levelDescription,

        @Schema(description = "Fecha de registro en la plataforma")
        LocalDate memberSince,

        @Schema(description = "True si el usuario autenticado ya guardó este prestamista")
        boolean saved
) {}
