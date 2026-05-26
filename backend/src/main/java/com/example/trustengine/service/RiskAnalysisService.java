package com.example.trustengine.service;

import com.example.trustengine.dto.RiskAnalysisDTO;
import com.example.trustengine.entity.*;
import com.example.trustengine.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RiskAnalysisService {

    private final UserRepository userRepository;
    private final TrustScoreService trustScoreService;
    private final LoanRepository loanRepository;
    private final LoanInstallmentRepository installmentRepository;
    private final FinancialSummaryRepository financialSummaryRepository;
    private final ProfileRepository profileRepository;

    public RiskAnalysisDTO getRiskAnalysis(Long borrowerId) {
        User borrower = userRepository.findById(borrowerId)
                .orElseThrow(() -> new RuntimeException("Prestatario no encontrado"));

        Profile profile = profileRepository.findByUserId(borrowerId).orElse(null);
        String borrowerName = (profile != null && profile.getFullName() != null)
                ? profile.getFullName()
                : borrower.getEmail();

        // Recalculate trust score components
        BigDecimal punctuality = trustScoreService.calculatePunctuality(borrowerId);
        BigDecimal activity    = trustScoreService.calculateActivity(borrowerId);
        BigDecimal stability   = trustScoreService.calculateStability(borrowerId);
        TrustScore ts = trustScoreService.calculateAndSave(borrower, punctuality, activity, stability);
        String trustLevel = trustScoreService.determineLevel(ts.getScoreValue());

        // Loan history
        List<Loan> loans = loanRepository.findByBorrowerId(borrowerId);
        int totalLoans = loans.size();
        int activeLoans = 0, paidLoans = 0, defaultedLoans = 0;
        for (Loan loan : loans) {
            switch (loan.getStatus()) {
                case "ACTIVE"  -> activeLoans++;
                case "PAID"    -> paidLoans++;
                case "DEFAULT" -> defaultedLoans++;
            }
        }

        // Payment metrics (CA2: count and characterize delays)
        int totalInstallments = 0, paidOnTime = 0, latePayments = 0, pendingOverdue = 0;
        long totalLateDays = 0;

        for (Loan loan : loans) {
            List<LoanInstallment> installments =
                    installmentRepository.findByLoanIdOrderByInstallmentNumberAsc(loan.getId());
            for (LoanInstallment inst : installments) {
                if ("PAID".equals(inst.getStatus())) {
                    totalInstallments++;
                    if (inst.getPaidAt() != null) {
                        LocalDate paidDate = inst.getPaidAt().toLocalDate();
                        if (!paidDate.isAfter(inst.getDueDate())) {
                            paidOnTime++;
                        } else {
                            latePayments++;
                            totalLateDays += ChronoUnit.DAYS.between(inst.getDueDate(), paidDate);
                        }
                    } else {
                        paidOnTime++;
                    }
                } else if ("PENDING".equals(inst.getStatus()) && inst.getDueDate().isBefore(LocalDate.now())) {
                    totalInstallments++;
                    pendingOverdue++;
                }
            }
        }

        double averageDaysLate = latePayments > 0
                ? (double) totalLateDays / latePayments
                : 0.0;

        // Financial summary
        FinancialSummary fs = financialSummaryRepository.findByUserId(borrowerId).orElse(null);
        BigDecimal totalLoansTaken = fs != null ? fs.getTotalLoansTaken() : BigDecimal.ZERO;
        BigDecimal totalRepaid     = fs != null ? fs.getTotalRepaid()     : BigDecimal.ZERO;
        BigDecimal currentDebt     = fs != null ? fs.getCurrentDebt()     : BigDecimal.ZERO;
        int missedPayments         = fs != null ? fs.getMissedPayments()  : 0;

        // CA3: data availability assessment
        String dataAvailability;
        String dataAvailabilityMessage;
        if (totalLoans == 0 && totalLoansTaken.compareTo(BigDecimal.ZERO) == 0) {
            dataAvailability = "NONE";
            dataAvailabilityMessage =
                    "Sin historial crediticio: la evaluación de riesgo es muy limitada por falta de datos.";
        } else if (totalInstallments < 5) {
            dataAvailability = "LIMITED";
            dataAvailabilityMessage =
                    "Historial insuficiente: la evaluación puede no reflejar el comportamiento real del prestatario.";
        } else {
            dataAvailability = "SUFFICIENT";
            dataAvailabilityMessage = "Historial suficiente para una evaluación confiable.";
        }

        // Build risk factors list (CA1 + CA2)
        List<RiskAnalysisDTO.RiskFactor> riskFactors = new ArrayList<>();
        buildRiskFactors(riskFactors, trustLevel, paidOnTime, paidLoans, latePayments,
                averageDaysLate, pendingOverdue, defaultedLoans, missedPayments,
                currentDebt, dataAvailability, dataAvailabilityMessage, totalLoans);

        String overallRisk = computeOverallRisk(trustLevel, pendingOverdue, defaultedLoans,
                latePayments, totalInstallments);
        String recommendation = buildRecommendation(overallRisk, dataAvailability);

        return RiskAnalysisDTO.builder()
                .borrowerId(borrowerId)
                .borrowerEmail(borrower.getEmail())
                .borrowerName(borrowerName)
                .trustScore(ts.getScoreValue())
                .trustLevel(trustLevel)
                .punctualityScore(punctuality.setScale(2, RoundingMode.HALF_UP))
                .activityScore(activity.setScale(2, RoundingMode.HALF_UP))
                .stabilityScore(stability.setScale(2, RoundingMode.HALF_UP))
                .totalLoans(totalLoans)
                .activeLoans(activeLoans)
                .paidLoans(paidLoans)
                .defaultedLoans(defaultedLoans)
                .totalInstallments(totalInstallments)
                .paidOnTime(paidOnTime)
                .latePayments(latePayments)
                .pendingOverdue(pendingOverdue)
                .totalLateDays(totalLateDays)
                .averageDaysLate(Math.round(averageDaysLate * 10.0) / 10.0)
                .totalLoansTaken(totalLoansTaken)
                .totalRepaid(totalRepaid)
                .currentDebt(currentDebt)
                .missedPayments(missedPayments)
                .riskFactors(riskFactors)
                .dataAvailability(dataAvailability)
                .dataAvailabilityMessage(dataAvailabilityMessage)
                .overallRiskRating(overallRisk)
                .lenderRecommendation(recommendation)
                .analysisDate(LocalDate.now())
                .build();
    }

    private void buildRiskFactors(
            List<RiskAnalysisDTO.RiskFactor> factors,
            String trustLevel, int paidOnTime, int paidLoans,
            int latePayments, double avgDaysLate,
            int pendingOverdue, int defaultedLoans, int missedPayments,
            BigDecimal currentDebt, String dataAvailability,
            String dataAvailabilityMessage, int totalLoans) {

        // Positive factors
        if (paidOnTime > 0) {
            factors.add(factor("POSITIVE", paidOnTime + " cuota(s) pagada(s) a tiempo"));
        }
        if (paidLoans > 0) {
            factors.add(factor("POSITIVE", paidLoans + " préstamo(s) cancelado(s) completamente"));
        }
        if ("ALTO".equals(trustLevel)) {
            factors.add(factor("POSITIVE", "Trust Score alto: reputación financiera excelente"));
        }
        if (currentDebt.compareTo(BigDecimal.ZERO) == 0 && totalLoans > 0) {
            factors.add(factor("POSITIVE", "Sin deuda activa actualmente"));
        }

        // Negative factors (CA2: late payments as elevated risk)
        if (latePayments > 0) {
            String avg = avgDaysLate > 0
                    ? String.format(" (promedio %.1f días de retraso)", avgDaysLate)
                    : "";
            factors.add(factor("NEGATIVE", latePayments + " cuota(s) pagada(s) con retraso" + avg));
        }
        if (pendingOverdue > 0) {
            factors.add(factor("NEGATIVE",
                    pendingOverdue + " cuota(s) vencida(s) sin pagar — riesgo de incumplimiento"));
        }
        if (defaultedLoans > 0) {
            factors.add(factor("NEGATIVE",
                    defaultedLoans + " préstamo(s) en estado de incumplimiento (DEFAULT)"));
        }
        if (missedPayments > 0) {
            factors.add(factor("NEGATIVE", missedPayments + " pago(s) omitido(s) registrado(s)"));
        }
        if ("BAJO".equals(trustLevel)) {
            factors.add(factor("NEGATIVE", "Trust Score bajo: reputación financiera insuficiente"));
        }

        // Warnings
        if (currentDebt.compareTo(BigDecimal.ZERO) > 0) {
            factors.add(factor("WARNING",
                    "Deuda activa: $" + currentDebt.setScale(2, RoundingMode.HALF_UP)));
        }
        if ("MEDIO".equals(trustLevel)) {
            factors.add(factor("WARNING",
                    "Trust Score medio: historial financiero aceptable pero mejorable"));
        }
        // CA3: insufficient data as a warning factor
        if ("NONE".equals(dataAvailability) || "LIMITED".equals(dataAvailability)) {
            factors.add(factor("WARNING", dataAvailabilityMessage));
        }
    }

    private RiskAnalysisDTO.RiskFactor factor(String type, String description) {
        return RiskAnalysisDTO.RiskFactor.builder().type(type).description(description).build();
    }

    private String computeOverallRisk(String trustLevel, int pendingOverdue,
                                      int defaultedLoans, int latePayments,
                                      int totalInstallments) {
        if (defaultedLoans > 0 || pendingOverdue > 2) return "ALTO";
        if ("BAJO".equals(trustLevel)) return "ALTO";
        if (pendingOverdue > 0) return "MEDIO";
        if (totalInstallments > 0 && (double) latePayments / totalInstallments > 0.30) return "MEDIO";
        if ("MEDIO".equals(trustLevel)) return "MEDIO";
        return "BAJO";
    }

    private String buildRecommendation(String overallRisk, String dataAvailability) {
        if ("NONE".equals(dataAvailability)) {
            return "Prestatario sin historial crediticio. Se recomienda precaución y solicitar garantías adicionales antes de invertir.";
        }
        return switch (overallRisk) {
            case "BAJO"  -> "Prestatario confiable con buen historial de pagos. Inversión recomendada con bajo riesgo.";
            case "MEDIO" -> "Riesgo moderado. Evalúe cuidadosamente el monto y considere tasas acordes al perfil del prestatario.";
            case "ALTO"  -> "Alto riesgo de incumplimiento detectado. Se recomienda no invertir o exigir garantías adicionales.";
            default      -> "Evalúe el perfil del prestatario antes de tomar una decisión de inversión.";
        };
    }
}
