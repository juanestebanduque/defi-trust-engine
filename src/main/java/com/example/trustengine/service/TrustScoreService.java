package com.example.trustengine.service;

import com.example.trustengine.entity.FinancialSummary;
import com.example.trustengine.entity.TrustScore;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.FinancialSummaryRepository;
import com.example.trustengine.repository.TrustScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class TrustScoreService {

    private final TrustScoreRepository trustScoreRepository;
    private final FinancialSummaryRepository financialSummaryRepository;

    /**
     * Calcula el Trust Score de un usuario basado en la fórmula:
     *   TS = (Cumplimiento * 0.40) + (Historial * 0.40) - (Morosidad * 0.20)
     *
     * - Cumplimiento (C): porcentaje de préstamos pagados a tiempo (0-100).
     * - Historial (H): puntaje según volumen de préstamos exitosos (0-100).
     * - Morosidad (M): penalización según pagos perdidos (0-100).
     */
    public TrustScore calculateAndSave(User user) {
        FinancialSummary fs = financialSummaryRepository.findByUserId(user.getId())
                .orElse(FinancialSummary.builder()
                        .user(user)
                        .totalLoansTaken(BigDecimal.ZERO)
                        .totalRepaid(BigDecimal.ZERO)
                        .missedPayments(0)
                        .currentDebt(BigDecimal.ZERO)
                        .build());

        // Factor C: cumplimiento (pagos realizados vs préstamos tomados)
        BigDecimal c;
        if (fs.getTotalLoansTaken().compareTo(BigDecimal.ZERO) == 0) {
            c = BigDecimal.valueOf(50); // usuario nuevo: score neutro
        } else {
            c = fs.getTotalRepaid()
                    .divide(fs.getTotalLoansTaken(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .min(BigDecimal.valueOf(100));
        }

        // Factor H: historial (volumen de préstamos exitosos, máx 100)
        BigDecimal h = fs.getTotalRepaid()
                .divide(BigDecimal.valueOf(1_000_000), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .min(BigDecimal.valueOf(100));

        // Factor M: penalización por morosidad (cada pago perdido resta 10 puntos)
        BigDecimal m = BigDecimal.valueOf(fs.getMissedPayments())
                .multiply(BigDecimal.valueOf(10))
                .min(BigDecimal.valueOf(100));

        // Fórmula final
        BigDecimal score = c.multiply(BigDecimal.valueOf(0.40))
                .add(h.multiply(BigDecimal.valueOf(0.40)))
                .subtract(m.multiply(BigDecimal.valueOf(0.20)))
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        TrustScore ts = TrustScore.builder()
                .user(user)
                .scoreValue(score)
                .calculationDate(LocalDate.now())
                .build();

        return trustScoreRepository.save(ts);
    }

    /** Devuelve el último score calculado para un usuario. */
    public BigDecimal getLatestScore(Long userId) {
        return trustScoreRepository
                .findFirstByUserIdOrderByCalculationDateDesc(userId)
                .map(TrustScore::getScoreValue)
                .orElse(BigDecimal.ZERO);
    }
}
