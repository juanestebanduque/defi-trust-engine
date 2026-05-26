package com.example.trustengine.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDTO {

    private Long id;
    private String email;
    private String role;
    private String status;
    private OffsetDateTime createdAt;

    // Profile
    private String fullName;
    private String phone;
    private String address;

    // Financial summary
    private BigDecimal totalLoansTaken;
    private BigDecimal totalRepaid;
    private BigDecimal currentDebt;
    private Integer missedPayments;

    // Trust score
    private BigDecimal trustScore;
    private String trustLevel;
}
