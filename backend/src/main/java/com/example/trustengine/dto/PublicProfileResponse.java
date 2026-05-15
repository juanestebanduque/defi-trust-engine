package com.example.trustengine.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDate;

@Schema(description = "Perfil público de un usuario: Trust Score y resumen de pagos sin datos privados")
public record PublicProfileResponse(

        @Schema(description = "ID del usuario", example = "42")
        Long userId,

        @Schema(description = "Nombre para mostrar (sin email ni documentos)", example = "María García")
        String displayName,

        @Schema(description = "Valor del Trust Score (0–100)", example = "78.50")
        BigDecimal trustScore,

        @Schema(description = "Nivel: ALTO, MEDIO o BAJO", example = "ALTO")
        String level,

        @Schema(description = "Descripción legible del nivel")
        String levelDescription,

        @Schema(description = "Total de préstamos tomados históricamente", example = "3500.00")
        BigDecimal totalLoansTaken,

        @Schema(description = "Total repagado hasta la fecha", example = "2800.00")
        BigDecimal totalRepaid,

        @Schema(description = "Número de pagos perdidos", example = "1")
        Integer missedPayments,

        @Schema(description = "Deuda pendiente actual", example = "700.00")
        BigDecimal pendingBalance,

        @Schema(description = "Indica si la cuenta está bloqueada", example = "false")
        boolean blocked,

        @Schema(description = "Fecha en que se calculó el score", example = "2026-05-15")
        LocalDate scoreDate
) {}
