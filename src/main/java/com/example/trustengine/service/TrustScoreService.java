package com.example.trustengine.service;

import com.example.trustengine.entity.FinancialSummary;
import com.example.trustengine.entity.TrustScore;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.FinancialSummaryRepository;
import com.example.trustengine.repository.TrustScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.example.trustengine.dto.TrustScoreResponseDTO;
import com.example.trustengine.repository.*;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class TrustScoreService {

    private final TrustScoreRepository trustScoreRepository;
    private final FinancialSummaryRepository financialSummaryRepository;
    private final UserRepository userRepository;
    private final LoanRepository loanRepository;
    private final LoanInstallmentRepository installmentRepository;
    private final TransactionRepository transactionRepository;

    /** Devuelve el objeto de respuesta completo con nivel calculado. */
    public TrustScoreResponseDTO getTrustScoreForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // CA3: Recalculamos siempre para asegurar "Tiempo Real" o según lógica de negocio
        TrustScore ts = calculateAndSave(user);

        return TrustScoreResponseDTO.builder()
                .scoreValue(ts.getScoreValue())
                .level(determineLevel(ts.getScoreValue()))
                .calculationDate(ts.getCalculationDate())
                .build();
    }

    private String determineLevel(BigDecimal score) {
        if (score.compareTo(new BigDecimal("70")) >= 0) return "ALTO";
        if (score.compareTo(new BigDecimal("40")) >= 0) return "MEDIO";
        return "BAJO";
    }

    /**
     * Calcula el Trust Score integrando múltiples entidades:
     * 1. Puntualidad (40%): Basado en LoanInstallment (pagos a tiempo).
     * 2. Actividad (30%): Basado en Transaction (volumen y frecuencia).
     * 3. Estabilidad (30%): Basado en FinancialSummary y Loan actual.
     */
    @Transactional
    public TrustScore calculateAndSave(User user) {
        BigDecimal punctualityFactor = calculatePunctuality(user.getId());
        BigDecimal activityFactor = calculateActivity(user.getId());
        BigDecimal stabilityFactor = calculateStability(user.getId());

        BigDecimal finalScore = punctualityFactor.multiply(new BigDecimal("0.40"))
                .add(activityFactor.multiply(new BigDecimal("0.30")))
                .add(stabilityFactor.multiply(new BigDecimal("0.30")))
                .setScale(2, RoundingMode.HALF_UP);

        TrustScore ts = TrustScore.builder()
                .user(user)
                .scoreValue(finalScore)
                .calculationDate(LocalDate.now())
                .build();

        return trustScoreRepository.save(ts);
    }

    private BigDecimal calculatePunctuality(Long userId) {
        var loans = loanRepository.findByBorrowerId(userId);
        if (loans.isEmpty()) return new BigDecimal("50.0"); // Neutro para nuevos

        long totalDue = 0;
        long paidOnTime = 0;

        for (var loan : loans) {
            var installments = installmentRepository.findByLoanIdOrderByInstallmentNumberAsc(loan.getId());
            for (var inst : installments) {
                if (inst.getDueDate().isBefore(LocalDate.now()) || "PAID".equals(inst.getStatus())) {
                    totalDue++;
                    if ("PAID".equals(inst.getStatus()) && inst.getPaidAt() != null) {
                        if (!inst.getPaidAt().toLocalDate().isAfter(inst.getDueDate())) {
                            paidOnTime++;
                        }
                    }
                }
            }
        }

        if (totalDue == 0) return new BigDecimal("50.0");
        return BigDecimal.valueOf(paidOnTime)
                .divide(BigDecimal.valueOf(totalDue), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
    }

    private BigDecimal calculateActivity(Long userId) {
        var transactions = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (transactions.isEmpty()) return new BigDecimal("30.0");

        BigDecimal totalVolume = transactions.stream()
                .map(com.example.trustengine.entity.Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Lógica simple: premiar volumen hasta un tope
        BigDecimal activityScore = totalVolume.divide(new BigDecimal("10000"), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .min(new BigDecimal("100"));
        
        return activityScore.max(new BigDecimal("30.0"));
    }

    private BigDecimal calculateStability(Long userId) {
        return financialSummaryRepository.findByUserId(userId)
                .map(fs -> {
                    if (fs.getCurrentDebt().compareTo(BigDecimal.ZERO) == 0) return new BigDecimal("100");
                    // Penalizar si la deuda es muy alta respecto a lo que ha pagado
                    BigDecimal ratio = fs.getCurrentDebt().divide(fs.getTotalRepaid().add(BigDecimal.ONE), 2, RoundingMode.HALF_UP);
                    return new BigDecimal("100").subtract(ratio.multiply(new BigDecimal("10"))).max(BigDecimal.ZERO);
                })
                .orElse(new BigDecimal("50.0"));
    }

    public BigDecimal getLatestScore(Long userId) {
        return trustScoreRepository
                .findFirstByUserIdOrderByCalculationDateDesc(userId)
                .map(TrustScore::getScoreValue)
                .orElse(BigDecimal.ZERO);
    }
}
