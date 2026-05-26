package com.example.trustengine.service;

import com.example.trustengine.dto.PenaltyRunResult;
import com.example.trustengine.dto.TransactionRequest;
import com.example.trustengine.entity.LoanInstallment;
import com.example.trustengine.entity.TrustScore;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.FinancialSummaryRepository;
import com.example.trustengine.repository.LoanInstallmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OverduePaymentScheduler {

    private final LoanInstallmentRepository installmentRepository;
    private final FinancialSummaryRepository financialSummaryRepository;
    private final TrustScoreService trustScoreService;
    private final TransactionService transactionService;

    /** Ejecuta automáticamente cada día a medianoche. */
    @Scheduled(cron = "0 0 0 * * *")
    public void runDailyPenalization() {
        log.info("⏰ Iniciando detección automática de pagos vencidos...");
        PenaltyRunResult result = detectAndPenalize();
        log.info("✅ Penalización completada: {} usuario(s), {} cuota(s) procesada(s).",
                result.getAffectedUsers(), result.getPenalizedInstallments());
    }

    /**
     * CA1: Detecta cuotas vencidas.
     * CA2: Reduce el Trust Score proporcionalmente.
     * CA3: Registra el evento en el historial de transacciones.
     */
    @Transactional
    public PenaltyRunResult detectAndPenalize() {
        // CA1: obtener cuotas PENDING vencidas que aún no han sido penalizadas
        List<LoanInstallment> overdue = installmentRepository
                .findAllOverdueNotPenalized(LocalDate.now());

        if (overdue.isEmpty()) {
            return PenaltyRunResult.builder()
                    .affectedUsers(0)
                    .penalizedInstallments(0)
                    .message("No se encontraron cuotas vencidas pendientes de penalización.")
                    .build();
        }

        // Agrupar por prestatario
        Map<User, List<LoanInstallment>> byUser = overdue.stream()
                .collect(Collectors.groupingBy(i -> i.getLoan().getBorrower()));

        int processedUsers = 0;

        for (Map.Entry<User, List<LoanInstallment>> entry : byUser.entrySet()) {
            User user        = entry.getKey();
            List<LoanInstallment> userOverdue = entry.getValue();
            int count        = userOverdue.size();

            // CA1: marcar cada cuota como penalizada para no procesarla de nuevo
            for (LoanInstallment inst : userOverdue) {
                inst.setPenalized(true);
                installmentRepository.save(inst);
            }

            // Incrementar pagos perdidos en el resumen financiero
            financialSummaryRepository.findByUserId(user.getId()).ifPresent(fs -> {
                fs.setMissedPayments(fs.getMissedPayments() + count);
                financialSummaryRepository.save(fs);
            });

            // CA2: recalcular Trust Score — el incremento de missedPayments y las
            // cuotas pendientes vencidas reducen puntualidad y estabilidad
            BigDecimal punctuality = trustScoreService.calculatePunctuality(user.getId());
            BigDecimal activity    = trustScoreService.calculateActivity(user.getId());
            BigDecimal stability   = trustScoreService.calculateStability(user.getId());
            TrustScore newScore    = trustScoreService.calculateAndSave(user, punctuality, activity, stability);

            // CA3: registrar evento de penalización en historial de transacciones
            // amount = puntos de penalización aplicados (5 por cuota vencida según fórmula estabilidad)
            BigDecimal penaltyPoints = BigDecimal.valueOf(count * 5L).setScale(2, RoundingMode.HALF_UP);
            transactionService.register(new TransactionRequest(
                    user.getId(),
                    "TRUST_PENALTY",
                    penaltyPoints,
                    String.format("Penalización por %d cuota(s) vencida(s) sin pagar. Trust Score actualizado: %.2f",
                            count, newScore.getScoreValue())
            ));

            log.info("  Usuario {}: {} cuota(s) vencida(s) → score={}", user.getEmail(), count, newScore.getScoreValue());
            processedUsers++;
        }

        return PenaltyRunResult.builder()
                .affectedUsers(processedUsers)
                .penalizedInstallments(overdue.size())
                .message(String.format("Penalización aplicada a %d usuario(s), %d cuota(s) procesada(s).",
                        processedUsers, overdue.size()))
                .build();
    }
}
