package com.example.trustengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    // --- Datos de cuenta ---
    private Long id;
    private String email;
    private String role;
    private String status;
    private OffsetDateTime createdAt;

    // --- Datos de perfil ---
    private String fullName;
    private String phone;
    private String address;
    private String blockchainHashId;

    // --- Resumen financiero ---
    private BigDecimal totalLoansTaken;
    private BigDecimal totalRepaid;
    private Integer missedPayments;
    private BigDecimal currentDebt;
}
