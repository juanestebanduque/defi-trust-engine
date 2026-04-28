package com.example.trustengine.service;

import com.example.trustengine.dto.TrustScoreResponseDTO;
import com.example.trustengine.entity.*;
import com.example.trustengine.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrustScoreServiceTest {

    @Mock
    private TrustScoreRepository trustScoreRepository;

    @Mock
    private FinancialSummaryRepository financialSummaryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private LoanInstallmentRepository installmentRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private TrustScoreService trustScoreService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .passwordHash("hash")
                .role("USER")
                .status("ACTIVE")
                .securityQuestion("q")
                .securityAnswer("a")
                .build();
    }

    // ========== CA1: Visualiza score ==========

    @Test
    void getTrustScoreForUser_returnsScoreValue() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(loanRepository.findByBorrowerId(1L)).thenReturn(Collections.emptyList());
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Collections.emptyList());
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(trustScoreRepository.save(any(TrustScore.class))).thenAnswer(inv -> inv.getArgument(0));

        TrustScoreResponseDTO response = trustScoreService.getTrustScoreForUser("test@example.com");

        assertThat(response).isNotNull();
        assertThat(response.getScoreValue()).isNotNull();
        assertThat(response.getCalculationDate()).isEqualTo(LocalDate.now());
    }

    @Test
    void getTrustScoreForUser_userNotFound_throwsException() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> trustScoreService.getTrustScoreForUser("unknown@example.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Usuario no encontrado");
    }

    // ========== CA2: Muestra nivel ==========

    @Test
    void determineLevel_alto_whenScoreIs70() {
        assertThat(trustScoreService.determineLevel(new BigDecimal("70"))).isEqualTo("ALTO");
    }

    @Test
    void determineLevel_alto_whenScoreIs100() {
        assertThat(trustScoreService.determineLevel(new BigDecimal("100"))).isEqualTo("ALTO");
    }

    @Test
    void determineLevel_medio_whenScoreIs40() {
        assertThat(trustScoreService.determineLevel(new BigDecimal("40"))).isEqualTo("MEDIO");
    }

    @Test
    void determineLevel_medio_whenScoreIs69() {
        assertThat(trustScoreService.determineLevel(new BigDecimal("69.99"))).isEqualTo("MEDIO");
    }

    @Test
    void determineLevel_bajo_whenScoreIs39() {
        assertThat(trustScoreService.determineLevel(new BigDecimal("39.99"))).isEqualTo("BAJO");
    }

    @Test
    void determineLevel_bajo_whenScoreIsZero() {
        assertThat(trustScoreService.determineLevel(BigDecimal.ZERO)).isEqualTo("BAJO");
    }

    @Test
    void getTrustScoreForUser_includesLevelInResponse() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(loanRepository.findByBorrowerId(1L)).thenReturn(Collections.emptyList());
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Collections.emptyList());
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(trustScoreRepository.save(any(TrustScore.class))).thenAnswer(inv -> inv.getArgument(0));

        TrustScoreResponseDTO response = trustScoreService.getTrustScoreForUser("test@example.com");

        assertThat(response.getLevel()).isIn("ALTO", "MEDIO", "BAJO");
        assertThat(response.getLevelDescription()).isNotNull().isNotEmpty();
    }

    // ========== CA3: Actualización en tiempo real ==========

    @Test
    void getTrustScoreForUser_recalculatesEveryTime() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(loanRepository.findByBorrowerId(1L)).thenReturn(Collections.emptyList());
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Collections.emptyList());
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(trustScoreRepository.save(any(TrustScore.class))).thenAnswer(inv -> inv.getArgument(0));

        trustScoreService.getTrustScoreForUser("test@example.com");
        trustScoreService.getTrustScoreForUser("test@example.com");

        // Debe guardar un nuevo TrustScore cada vez que se consulta
        verify(trustScoreRepository, times(2)).save(any(TrustScore.class));
    }

    // ========== Cálculo de Puntualidad ==========

    @Test
    void calculatePunctuality_noLoans_returnsNeutral() {
        when(loanRepository.findByBorrowerId(1L)).thenReturn(Collections.emptyList());

        BigDecimal result = trustScoreService.calculatePunctuality(1L);

        assertThat(result).isEqualByComparingTo("50.0");
    }

    @Test
    void calculatePunctuality_allPaidOnTime_returns100() {
        Loan loan = Loan.builder().id(10L).borrower(testUser).build();
        LoanInstallment inst = LoanInstallment.builder()
                .id(100L).loan(loan).installmentNumber(1)
                .dueDate(LocalDate.now().minusDays(5))
                .amount(new BigDecimal("100"))
                .status("PAID")
                .paidAt(OffsetDateTime.now().minusDays(6)) // Pagó 1 día antes del vencimiento
                .build();

        when(loanRepository.findByBorrowerId(1L)).thenReturn(List.of(loan));
        when(installmentRepository.findByLoanIdOrderByInstallmentNumberAsc(10L)).thenReturn(List.of(inst));

        BigDecimal result = trustScoreService.calculatePunctuality(1L);

        assertThat(result).isEqualByComparingTo("100");
    }

    @Test
    void calculatePunctuality_latePaidInstallment_appliesPenalty() {
        Loan loan = Loan.builder().id(10L).borrower(testUser).build();
        // Cuota pagada 9 días tarde → penalización de 9/3 = 3 puntos
        LoanInstallment inst = LoanInstallment.builder()
                .id(100L).loan(loan).installmentNumber(1)
                .dueDate(LocalDate.now().minusDays(10))
                .amount(new BigDecimal("100"))
                .status("PAID")
                .paidAt(OffsetDateTime.now().minusDays(1)) // Pagó 9 días después del vencimiento
                .build();

        when(loanRepository.findByBorrowerId(1L)).thenReturn(List.of(loan));
        when(installmentRepository.findByLoanIdOrderByInstallmentNumberAsc(10L)).thenReturn(List.of(inst));

        BigDecimal result = trustScoreService.calculatePunctuality(1L);

        // 0% on time (0/1 = 0) minus late penalty → clamped at 0
        assertThat(result).isLessThan(new BigDecimal("100"));
    }

    @Test
    void calculatePunctuality_unpaidOverdue_penalizesHeavily() {
        Loan loan = Loan.builder().id(10L).borrower(testUser).build();
        LoanInstallment inst = LoanInstallment.builder()
                .id(100L).loan(loan).installmentNumber(1)
                .dueDate(LocalDate.now().minusDays(30))
                .amount(new BigDecimal("100"))
                .status("PENDING")
                .paidAt(null)
                .build();

        when(loanRepository.findByBorrowerId(1L)).thenReturn(List.of(loan));
        when(installmentRepository.findByLoanIdOrderByInstallmentNumberAsc(10L)).thenReturn(List.of(inst));

        BigDecimal result = trustScoreService.calculatePunctuality(1L);

        // 0 pagadas a tiempo de 1 vencida → 0%
        assertThat(result).isEqualByComparingTo("0");
    }

    // ========== Cálculo de Actividad ==========

    @Test
    void calculateActivity_noTransactions_returnsMinimum() {
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Collections.emptyList());

        BigDecimal result = trustScoreService.calculateActivity(1L);

        assertThat(result).isEqualByComparingTo("30.0");
    }

    @Test
    void calculateActivity_highVolume_cappedAt100() {
        List<Transaction> transactions = List.of(
                Transaction.builder().id(1L).transactionHash("h1").user(testUser)
                        .type("LOAN_PAYMENT").amount(new BigDecimal("5000")).build(),
                Transaction.builder().id(2L).transactionHash("h2").user(testUser)
                        .type("LOAN_PAYMENT").amount(new BigDecimal("5000")).build(),
                Transaction.builder().id(3L).transactionHash("h3").user(testUser)
                        .type("LOAN_PAYMENT").amount(new BigDecimal("5000")).build(),
                Transaction.builder().id(4L).transactionHash("h4").user(testUser)
                        .type("LOAN_PAYMENT").amount(new BigDecimal("5000")).build(),
                Transaction.builder().id(5L).transactionHash("h5").user(testUser)
                        .type("LOAN_PAYMENT").amount(new BigDecimal("5000")).build()
        );

        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(transactions);

        BigDecimal result = trustScoreService.calculateActivity(1L);

        // Volumen 25,000 → 250% capped at 100, + 10 bonus for >=5 txns, capped at 100
        assertThat(result).isEqualByComparingTo("100");
    }

    @Test
    void calculateActivity_fewTransactions_noFrequencyBonus() {
        List<Transaction> transactions = List.of(
                Transaction.builder().id(1L).transactionHash("h1").user(testUser)
                        .type("LOAN_PAYMENT").amount(new BigDecimal("1000")).build()
        );

        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(transactions);

        BigDecimal result = trustScoreService.calculateActivity(1L);

        // 1000/10000 * 100 = 10, but min is 30
        assertThat(result).isEqualByComparingTo("30.0");
    }

    // ========== Cálculo de Estabilidad ==========

    @Test
    void calculateStability_noFinancialSummary_returnsNeutral() {
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.empty());

        BigDecimal result = trustScoreService.calculateStability(1L);

        assertThat(result).isEqualByComparingTo("50.0");
    }

    @Test
    void calculateStability_noDebt_returns100() {
        FinancialSummary fs = FinancialSummary.builder()
                .id(1L).user(testUser)
                .currentDebt(BigDecimal.ZERO)
                .totalRepaid(new BigDecimal("5000"))
                .missedPayments(0)
                .build();

        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.of(fs));

        BigDecimal result = trustScoreService.calculateStability(1L);

        assertThat(result).isEqualByComparingTo("100");
    }

    @Test
    void calculateStability_highDebt_penalizesScore() {
        FinancialSummary fs = FinancialSummary.builder()
                .id(1L).user(testUser)
                .currentDebt(new BigDecimal("5000"))
                .totalRepaid(new BigDecimal("1000"))
                .missedPayments(0)
                .build();

        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.of(fs));

        BigDecimal result = trustScoreService.calculateStability(1L);

        assertThat(result).isLessThan(new BigDecimal("100"));
        assertThat(result).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }

    @Test
    void calculateStability_missedPayments_appliesAdditionalPenalty() {
        FinancialSummary fsWithMissed = FinancialSummary.builder()
                .id(1L).user(testUser)
                .currentDebt(new BigDecimal("1000"))
                .totalRepaid(new BigDecimal("5000"))
                .missedPayments(3)
                .build();

        FinancialSummary fsWithoutMissed = FinancialSummary.builder()
                .id(2L).user(testUser)
                .currentDebt(new BigDecimal("1000"))
                .totalRepaid(new BigDecimal("5000"))
                .missedPayments(0)
                .build();

        when(financialSummaryRepository.findByUserId(1L))
                .thenReturn(Optional.of(fsWithMissed))
                .thenReturn(Optional.of(fsWithoutMissed));

        BigDecimal withMissed = trustScoreService.calculateStability(1L);
        BigDecimal withoutMissed = trustScoreService.calculateStability(1L);

        // 3 pagos perdidos * 5 = 15 puntos de penalización adicional
        assertThat(withMissed).isLessThan(withoutMissed);
    }

    // ========== Score Final Integrado ==========

    @Test
    void calculateAndSave_clampsBetween0And100() {
        when(trustScoreRepository.save(any(TrustScore.class))).thenAnswer(inv -> inv.getArgument(0));

        TrustScore result = trustScoreService.calculateAndSave(
                testUser,
                new BigDecimal("150"),  // > 100
                new BigDecimal("150"),
                new BigDecimal("150")
        );

        assertThat(result.getScoreValue()).isLessThanOrEqualTo(new BigDecimal("100"));
    }

    @Test
    void calculateAndSave_negativeFactors_clampsToZero() {
        when(trustScoreRepository.save(any(TrustScore.class))).thenAnswer(inv -> inv.getArgument(0));

        TrustScore result = trustScoreService.calculateAndSave(
                testUser,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        assertThat(result.getScoreValue()).isEqualByComparingTo("0.00");
    }

    @Test
    void calculateAndSave_correctWeighting() {
        when(trustScoreRepository.save(any(TrustScore.class))).thenAnswer(inv -> inv.getArgument(0));

        BigDecimal punctuality = new BigDecimal("80");
        BigDecimal activity = new BigDecimal("60");
        BigDecimal stability = new BigDecimal("70");

        TrustScore result = trustScoreService.calculateAndSave(testUser, punctuality, activity, stability);

        // 80*0.40 + 60*0.30 + 70*0.30 = 32 + 18 + 21 = 71
        BigDecimal expected = new BigDecimal("71.00");
        assertThat(result.getScoreValue()).isEqualByComparingTo(expected);
    }

    @Test
    void getTrustScoreForUser_newUser_returnsNeutralScore() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(loanRepository.findByBorrowerId(1L)).thenReturn(Collections.emptyList());
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Collections.emptyList());
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(trustScoreRepository.save(any(TrustScore.class))).thenAnswer(inv -> inv.getArgument(0));

        TrustScoreResponseDTO response = trustScoreService.getTrustScoreForUser("test@example.com");

        // Nuevos: punct=50, act=30, stab=50 → 50*0.4 + 30*0.3 + 50*0.3 = 20+9+15 = 44
        assertThat(response.getScoreValue()).isEqualByComparingTo("44.00");
        assertThat(response.getLevel()).isEqualTo("MEDIO");
        assertThat(response.getPunctualityScore()).isEqualByComparingTo("50.00");
        assertThat(response.getActivityScore()).isEqualByComparingTo("30.00");
        assertThat(response.getStabilityScore()).isEqualByComparingTo("50.00");
    }

    // ========== Level Descriptions ==========

    @Test
    void getLevelDescription_returnsCorrectDescriptions() {
        assertThat(trustScoreService.getLevelDescription("ALTO")).contains("Excelente");
        assertThat(trustScoreService.getLevelDescription("MEDIO")).contains("aceptable");
        assertThat(trustScoreService.getLevelDescription("BAJO")).contains("baja");
    }

    // ========== getLatestScore ==========

    @Test
    void getLatestScore_noHistory_returnsZero() {
        when(trustScoreRepository.findFirstByUserIdOrderByCalculationDateDesc(1L)).thenReturn(Optional.empty());

        BigDecimal result = trustScoreService.getLatestScore(1L);

        assertThat(result).isEqualByComparingTo("0");
    }

    @Test
    void getLatestScore_withHistory_returnsLatest() {
        TrustScore ts = TrustScore.builder()
                .id(1L).user(testUser)
                .scoreValue(new BigDecimal("85.50"))
                .calculationDate(LocalDate.now())
                .build();

        when(trustScoreRepository.findFirstByUserIdOrderByCalculationDateDesc(1L)).thenReturn(Optional.of(ts));

        BigDecimal result = trustScoreService.getLatestScore(1L);

        assertThat(result).isEqualByComparingTo("85.50");
    }
}
