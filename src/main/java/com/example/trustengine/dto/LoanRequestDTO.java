package com.example.trustengine.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
public class LoanRequestDTO {

    private Long loanId;
    private Long borrowerId;
    private String borrowerEmail;
    private BigDecimal amount;
    private BigDecimal interestRate;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal trustScore;
    private boolean saved;
    private OffsetDateTime createdAt;
}
