package com.example.trustengine.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAnalysisDTO {

    private Long borrowerId;
    private String borrowerEmail;
    private String borrowerName;

    // Trust Score breakdown
    private BigDecimal trustScore;
    private String trustLevel;
    private BigDecimal punctualityScore;
    private BigDecimal activityScore;
    private BigDecimal stabilityScore;

    // Loan history counts
    private int totalLoans;
    private int activeLoans;
    private int paidLoans;
    private int defaultedLoans;

    // Payment metrics (CA2: delays reflected as risk)
    private int totalInstallments;
    private int paidOnTime;
    private int latePayments;
    private int pendingOverdue;
    private long totalLateDays;
    private double averageDaysLate;

    // Financial summary
    private BigDecimal totalLoansTaken;
    private BigDecimal totalRepaid;
    private BigDecimal currentDebt;
    private int missedPayments;

    // Risk assessment
    private List<RiskFactor> riskFactors;

    // CA3: data sufficiency indicator
    private String dataAvailability; // SUFFICIENT, LIMITED, NONE
    private String dataAvailabilityMessage;

    private String overallRiskRating; // BAJO, MEDIO, ALTO
    private String lenderRecommendation;
    private LocalDate analysisDate;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskFactor {
        private String type; // POSITIVE, NEGATIVE, WARNING
        private String description;
    }
}
