package com.example.trustengine.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanContractDTO {

    private Long loanId;
    private String contractNumber;
    private LocalDate generatedAt;
    private String status;

    // Borrower (CA2: all agreed conditions need parties)
    private String borrowerName;
    private String borrowerEmail;
    private String borrowerAddress;
    private String borrowerPhone;
    private String borrowerBlockchainId;

    // Lender (null when PENDING)
    private String lenderName;
    private String lenderEmail;

    // CA2: all agreed conditions
    private BigDecimal amount;
    private BigDecimal interestRate;
    private Integer termMonths;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal monthlyPayment;
    private BigDecimal totalPayment;
    private BigDecimal pendingBalance;

    // Payment schedule
    private List<InstallmentDetail> installments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstallmentDetail {
        private Integer number;
        private LocalDate dueDate;
        private BigDecimal amount;
        private String status;
        private LocalDate paidAt;
    }
}
