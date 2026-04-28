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
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrustScoreService {

    private final TrustScoreRepository trustScoreRepository;
    private final FinancialSummaryRepository financialSummaryRepository;
    private final UserRepository userRepository;
    private final LoanRepository loanRepository;
    private final LoanInstallmentRepository installmentRepository;
    private final TransactionRepository transactionRepository;

    // Constantes de pesos
    static final BigDecimal WEIGHT_PUNCTUALITY = new BigDecimal("0.40");
    static final BigDecimal WEIGHT_ACTIVITY    = new BigDecimal("0.30");
    static final BigDecimal WEIGHT_STABILITY   = new BigDecimal("0.30");

    // Umbrales de nivel
    static final BigDecimal THRESHOLD_ALTO  = new BigDecimal("70");
    static final BigDecimal THRESHOLD_MEDIO = new BigDecimal("40");

    // Valores por defecto para usuarios nuevos
    static final BigDecimal DEFAULT_PUNCTUALITY = new BigDecimal("50.0");
    static final BigDecimal DEFAULT_ACTIVITY    = new BigDecimal("30.0");
    static final BigDecimal DEFAULT_STABILITY   = new BigDecimal("50.0");

    /** CA1 + CA2 + CA3: Devuelve el score recalculado con nivel y desglose. */
    public TrustScoreResponseDTO getTrustScoreForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        BigDecimal punctuality = calculatePunctuality(user.getId());
        BigDecimal activity    = calculateActivity(user.getId());
        BigDecimal stability   = calculateStability(user.getId());

        // CA3: Recalculamos siempre para asegurar "Tiempo Real"
        TrustScore ts = calculateAndSave(user, punctuality, activity, stability);

        String level = determineLevel(ts.getScoreValue());

        return TrustScoreResponseDTO.builder()
                .scoreValue(ts.getScoreValue())
                .level(level)
                .calculationDate(ts.getCalculationDate())
                .punctualityScore(punctuality.setScale(2, RoundingMode.HALF_UP))
                .activityScore(activity.setScale(2, RoundingMode.HALF_UP))
                .stabilityScore(stability.setScale(2, RoundingMode.HALF_UP))
                .levelDescription(getLevelDescription(level))
                .build();
    }

    /** Determina el nivel según umbrales definidos. */
    String determineLevel(BigDecimal score) {
        if (score.compareTo(THRESHOLD_ALTO) >= 0) return "ALTO";
        if (score.compareTo(THRESHOLD_MEDIO) >= 0) return "MEDIO";
        return "BAJO";
    }

    /** Descripción legible del nivel para el usuario. */
    String getLevelDescription(String level) {
        return switch (level) {
            case "ALTO"  -> "Excelente reputación financiera. Acceso a mejores tasas de interés.";
            case "MEDIO" -> "Reputación financiera aceptable. Puede mejorar con pagos puntuales.";
            case "BAJO"  -> "Reputación financiera baja. Se recomienda mejorar el historial de pagos.";
            default      -> "Nivel desconocido.";
        };
    }

    /**
     * Calcula el Trust Score integrando múltiples entidades:
     * 1. Puntualidad (40%): Basado en LoanInstallment (pagos a tiempo) con penalización por atraso.
     * 2. Actividad (30%): Basado en Transaction (volumen y frecuencia).
     * 3. Estabilidad (30%): Basado en FinancialSummary y Loan actual.
     */
    @Transactional
    public TrustScore calculateAndSave(User user, BigDecimal punctuality, BigDecimal activity, BigDecimal stability) {
        BigDecimal finalScore = punctuality.multiply(WEIGHT_PUNCTUALITY)
                .add(activity.multiply(WEIGHT_ACTIVITY))
                .add(stability.multiply(WEIGHT_STABILITY))
                .setScale(2, RoundingMode.HALF_UP);

        // Clamp entre 0 y 100
        finalScore = finalScore.max(BigDecimal.ZERO).min(new BigDecimal("100"));

        TrustScore ts = TrustScore.builder()
                .user(user)
                .scoreValue(finalScore)
                .calculationDate(LocalDate.now())
                .build();

        return trustScoreRepository.save(ts);
    }

    /**
     * Calcula la puntualidad considerando:
     * - % de cuotas pagadas a tiempo
     * - Penalización progresiva por días de atraso
     */
    BigDecimal calculatePunctuality(Long userId) {
        var loans = loanRepository.findByBorrowerId(userId);
        if (loans.isEmpty()) return DEFAULT_PUNCTUALITY;

        long totalDue = 0;
        long paidOnTime = 0;
        long totalLateDays = 0;

        for (var loan : loans) {
            var installments = installmentRepository.findByLoanIdOrderByInstallmentNumberAsc(loan.getId());
            for (var inst : installments) {
                if (inst.getDueDate().isBefore(LocalDate.now()) || "PAID".equals(inst.getStatus())) {
                    totalDue++;
                    if ("PAID".equals(inst.getStatus()) && inst.getPaidAt() != null) {
                        LocalDate paidDate = inst.getPaidAt().toLocalDate();
                        if (!paidDate.isAfter(inst.getDueDate())) {
                            paidOnTime++;
                        } else {
                            // Penalización proporcional al atraso
                            long daysLate = ChronoUnit.DAYS.between(inst.getDueDate(), paidDate);
                            totalLateDays += daysLate;
                        }
                    }
                    // Si no está pagada y ya venció → penalización fuerte (no suma paidOnTime)
                }
            }
        }

        if (totalDue == 0) return DEFAULT_PUNCTUALITY;

        // Score base: % pagadas a tiempo
        BigDecimal baseScore = BigDecimal.valueOf(paidOnTime)
                .divide(BigDecimal.valueOf(totalDue), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));

        // Penalización por atraso: -1 punto por cada 3 días de atraso acumulado
        BigDecimal latePenalty = BigDecimal.valueOf(totalLateDays)
                .divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP);

        return baseScore.subtract(latePenalty).max(BigDecimal.ZERO).min(new BigDecimal("100"));
    }

    /**
     * Calcula la actividad considerando:
     * - Volumen de transacciones (hasta un tope)
     * - Bonificación por frecuencia reciente
     */
    BigDecimal calculateActivity(Long userId) {
        var transactions = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (transactions.isEmpty()) return DEFAULT_ACTIVITY;

        BigDecimal totalVolume = transactions.stream()
                .map(com.example.trustengine.entity.Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Score por volumen: premiar hasta un tope de 10,000
        BigDecimal volumeScore = totalVolume.divide(new BigDecimal("10000"), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .min(new BigDecimal("100"));

        // Bonificación por frecuencia: +10 si hay al menos 5 transacciones
        BigDecimal frequencyBonus = BigDecimal.ZERO;
        if (transactions.size() >= 5) {
            frequencyBonus = new BigDecimal("10");
        }

        BigDecimal activityScore = volumeScore.add(frequencyBonus).min(new BigDecimal("100"));
        return activityScore.max(DEFAULT_ACTIVITY);
    }

    /**
     * Calcula la estabilidad financiera considerando:
     * - Ratio deuda actual / total repagado
     * - Penalización por pagos perdidos
     */
    BigDecimal calculateStability(Long userId) {
        return financialSummaryRepository.findByUserId(userId)
                .map(fs -> {
                    if (fs.getCurrentDebt().compareTo(BigDecimal.ZERO) == 0) {
                        return new BigDecimal("100");
                    }

                    // Ratio deuda / repagado
                    BigDecimal denominator = fs.getTotalRepaid().add(BigDecimal.ONE);
                    BigDecimal ratio = fs.getCurrentDebt().divide(denominator, 2, RoundingMode.HALF_UP);
                    BigDecimal debtPenalty = ratio.multiply(new BigDecimal("10"));

                    // Penalización adicional por pagos perdidos: -5 por cada pago perdido
                    BigDecimal missedPenalty = BigDecimal.valueOf(fs.getMissedPayments())
                            .multiply(new BigDecimal("5"));

                    return new BigDecimal("100")
                            .subtract(debtPenalty)
                            .subtract(missedPenalty)
                            .max(BigDecimal.ZERO);
                })
                .orElse(DEFAULT_STABILITY);
    }

    /** Obtiene el último score calculado para un usuario. */
    public BigDecimal getLatestScore(Long userId) {
        return trustScoreRepository
                .findFirstByUserIdOrderByCalculationDateDesc(userId)
                .map(TrustScore::getScoreValue)
                .orElse(BigDecimal.ZERO);
    }

    /** Historial de scores de un usuario. */
    public List<TrustScore> getScoreHistory(Long userId) {
        return trustScoreRepository.findByUserIdOrderByCalculationDateDesc(userId);
    }
}
