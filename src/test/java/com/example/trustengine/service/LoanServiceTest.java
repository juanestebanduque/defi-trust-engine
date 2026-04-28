package com.example.trustengine.service;

import com.example.trustengine.dto.LoanRequestDTO;
import com.example.trustengine.dto.TrustScoreResponseDTO;
import com.example.trustengine.entity.Loan;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.LoanRepository;
import com.example.trustengine.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TrustScoreService trustScoreService;

    @InjectMocks
    private LoanService loanService;

    private User borrower;
    private TrustScoreResponseDTO medioScoreResponse;

    @BeforeEach
    void setUp() {
        borrower = User.builder()
                .id(1L)
                .email("borrower@example.com")
                .passwordHash("hash")
                .role("USER")
                .status("ACTIVE")
                .securityQuestion("q")
                .securityAnswer("a")
                .build();

        medioScoreResponse = TrustScoreResponseDTO.builder()
                .scoreValue(new BigDecimal("50.00"))
                .level("MEDIO")
                .calculationDate(LocalDate.now())
                .build();
    }

    // ========== CA1: Validación de monto ==========

    @Test
    void requestLoan_validAmount_succeeds() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("5000"))
                .termMonths(12)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getTrustScoreForUser("borrower@example.com")).thenReturn(medioScoreResponse);
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> {
            Loan loan = inv.getArgument(0);
            loan.setId(10L);
            return loan;
        });

        LoanRequestDTO result = loanService.requestLoan(request, "borrower@example.com");

        assertThat(result).isNotNull();
        assertThat(result.getAmount()).isEqualByComparingTo("5000");
    }

    @Test
    void requestLoan_amountNull_throwsValidationError() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(null)
                .termMonths(12)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));

        assertThatThrownBy(() -> loanService.requestLoan(request, "borrower@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("obligatorio");
    }

    @Test
    void requestLoan_amountZero_throwsValidationError() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(BigDecimal.ZERO)
                .termMonths(12)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));

        assertThatThrownBy(() -> loanService.requestLoan(request, "borrower@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mayor a cero");
    }

    @Test
    void requestLoan_amountBelowMinimum_throwsValidationError() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("50"))
                .termMonths(12)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));

        assertThatThrownBy(() -> loanService.requestLoan(request, "borrower@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("100");
    }

    @Test
    void requestLoan_amountExceedsMaxForLevel_throwsValidationError() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("15000")) // MEDIO max is 10,000
                .termMonths(12)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getTrustScoreForUser("borrower@example.com")).thenReturn(medioScoreResponse);

        assertThatThrownBy(() -> loanService.requestLoan(request, "borrower@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("MEDIO")
                .hasMessageContaining("10000");
    }

    @Test
    void requestLoan_amountNegative_throwsValidationError() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("-500"))
                .termMonths(12)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));

        assertThatThrownBy(() -> loanService.requestLoan(request, "borrower@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mayor a cero");
    }

    // ========== CA1: Validación de plazo ==========

    @Test
    void requestLoan_termNull_throwsValidationError() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("500"))
                .termMonths(null)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getTrustScoreForUser("borrower@example.com")).thenReturn(medioScoreResponse);

        assertThatThrownBy(() -> loanService.requestLoan(request, "borrower@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mes");
    }

    @Test
    void requestLoan_termZero_throwsValidationError() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("500"))
                .termMonths(0)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getTrustScoreForUser("borrower@example.com")).thenReturn(medioScoreResponse);

        assertThatThrownBy(() -> loanService.requestLoan(request, "borrower@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mes");
    }

    @Test
    void requestLoan_termExceedsMax_throwsValidationError() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("500"))
                .termMonths(61)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getTrustScoreForUser("borrower@example.com")).thenReturn(medioScoreResponse);

        assertThatThrownBy(() -> loanService.requestLoan(request, "borrower@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("60");
    }

    // ========== CA2: Registro de solicitud ==========

    @Test
    void requestLoan_savesLoanInRepository() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("2000"))
                .termMonths(6)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getTrustScoreForUser("borrower@example.com")).thenReturn(medioScoreResponse);
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> {
            Loan loan = inv.getArgument(0);
            loan.setId(10L);
            return loan;
        });

        loanService.requestLoan(request, "borrower@example.com");

        ArgumentCaptor<Loan> captor = ArgumentCaptor.forClass(Loan.class);
        verify(loanRepository).save(captor.capture());

        Loan saved = captor.getValue();
        assertThat(saved.getBorrower()).isEqualTo(borrower);
        assertThat(saved.getAmount()).isEqualByComparingTo("2000");
        assertThat(saved.getStartDate()).isEqualTo(LocalDate.now());
        assertThat(saved.getEndDate()).isEqualTo(LocalDate.now().plusMonths(6));
    }

    @Test
    void requestLoan_setsPendingBalanceToAmount() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("3000"))
                .termMonths(12)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getTrustScoreForUser("borrower@example.com")).thenReturn(medioScoreResponse);
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> {
            Loan loan = inv.getArgument(0);
            loan.setId(10L);
            return loan;
        });

        loanService.requestLoan(request, "borrower@example.com");

        ArgumentCaptor<Loan> captor = ArgumentCaptor.forClass(Loan.class);
        verify(loanRepository).save(captor.capture());

        assertThat(captor.getValue().getPendingBalance()).isEqualByComparingTo("3000");
    }

    @Test
    void requestLoan_setsInterestRateBasedOnTrustLevel() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("1000"))
                .termMonths(12)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getTrustScoreForUser("borrower@example.com")).thenReturn(medioScoreResponse);
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> {
            Loan loan = inv.getArgument(0);
            loan.setId(10L);
            return loan;
        });

        loanService.requestLoan(request, "borrower@example.com");

        ArgumentCaptor<Loan> captor = ArgumentCaptor.forClass(Loan.class);
        verify(loanRepository).save(captor.capture());

        // MEDIO level → 12% interest rate
        assertThat(captor.getValue().getInterestRate()).isEqualByComparingTo("12.0");
    }

    @Test
    void requestLoan_userNotFound_throwsException() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("1000"))
                .termMonths(12)
                .build();

        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> loanService.requestLoan(request, "unknown@example.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Usuario no encontrado");
    }

    // ========== CA3: Estado inicial "PENDING" ==========

    @Test
    void requestLoan_statusIsPending() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("5000"))
                .termMonths(12)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getTrustScoreForUser("borrower@example.com")).thenReturn(medioScoreResponse);
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> {
            Loan loan = inv.getArgument(0);
            loan.setId(10L);
            return loan;
        });

        LoanRequestDTO result = loanService.requestLoan(request, "borrower@example.com");

        assertThat(result.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void requestLoan_savedLoanHasPendingStatus() {
        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("500"))
                .termMonths(3)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getTrustScoreForUser("borrower@example.com")).thenReturn(medioScoreResponse);
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> {
            Loan loan = inv.getArgument(0);
            loan.setId(10L);
            return loan;
        });

        loanService.requestLoan(request, "borrower@example.com");

        ArgumentCaptor<Loan> captor = ArgumentCaptor.forClass(Loan.class);
        verify(loanRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("PENDING");
    }

    // ========== Límites por nivel de Trust Score ==========

    @Test
    void calculateMaxAmount_alto_returns50000() {
        assertThat(loanService.calculateMaxAmount("ALTO")).isEqualByComparingTo("50000");
    }

    @Test
    void calculateMaxAmount_medio_returns10000() {
        assertThat(loanService.calculateMaxAmount("MEDIO")).isEqualByComparingTo("10000");
    }

    @Test
    void calculateMaxAmount_bajo_returns1000() {
        assertThat(loanService.calculateMaxAmount("BAJO")).isEqualByComparingTo("1000");
    }

    @Test
    void calculateInterestRate_alto_returns5() {
        assertThat(loanService.calculateInterestRate("ALTO")).isEqualByComparingTo("5.0");
    }

    @Test
    void calculateInterestRate_medio_returns12() {
        assertThat(loanService.calculateInterestRate("MEDIO")).isEqualByComparingTo("12.0");
    }

    @Test
    void calculateInterestRate_bajo_returns25() {
        assertThat(loanService.calculateInterestRate("BAJO")).isEqualByComparingTo("25.0");
    }

    // ========== getMyLoans ==========

    @Test
    void getMyLoans_returnsUserLoans() {
        Loan loan = Loan.builder()
                .id(10L).borrower(borrower)
                .amount(new BigDecimal("5000"))
                .interestRate(new BigDecimal("12"))
                .status("PENDING")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(12))
                .pendingBalance(new BigDecimal("5000"))
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getLatestScore(1L)).thenReturn(new BigDecimal("50.00"));
        when(loanRepository.findByBorrowerId(1L)).thenReturn(List.of(loan));

        List<LoanRequestDTO> results = loanService.getMyLoans("borrower@example.com");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getStatus()).isEqualTo("PENDING");
        assertThat(results.get(0).getAmount()).isEqualByComparingTo("5000");
    }

    @Test
    void getMyLoans_noLoans_returnsEmptyList() {
        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getLatestScore(1L)).thenReturn(BigDecimal.ZERO);
        when(loanRepository.findByBorrowerId(1L)).thenReturn(List.of());

        List<LoanRequestDTO> results = loanService.getMyLoans("borrower@example.com");

        assertThat(results).isEmpty();
    }

    // ========== Integración Trust Score con monto máximo ==========

    @Test
    void requestLoan_altoLevel_allowsHighAmount() {
        TrustScoreResponseDTO altoResponse = TrustScoreResponseDTO.builder()
                .scoreValue(new BigDecimal("85.00"))
                .level("ALTO")
                .calculationDate(LocalDate.now())
                .build();

        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("40000"))
                .termMonths(24)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getTrustScoreForUser("borrower@example.com")).thenReturn(altoResponse);
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> {
            Loan loan = inv.getArgument(0);
            loan.setId(10L);
            return loan;
        });

        LoanRequestDTO result = loanService.requestLoan(request, "borrower@example.com");

        assertThat(result.getAmount()).isEqualByComparingTo("40000");
        assertThat(result.getInterestRate()).isEqualByComparingTo("5.0");
    }

    @Test
    void requestLoan_bajoLevel_rejectsHighAmount() {
        TrustScoreResponseDTO bajoResponse = TrustScoreResponseDTO.builder()
                .scoreValue(new BigDecimal("20.00"))
                .level("BAJO")
                .calculationDate(LocalDate.now())
                .build();

        LoanRequestDTO request = LoanRequestDTO.builder()
                .amount(new BigDecimal("5000")) // BAJO max is 1,000
                .termMonths(12)
                .build();

        when(userRepository.findByEmail("borrower@example.com")).thenReturn(Optional.of(borrower));
        when(trustScoreService.getTrustScoreForUser("borrower@example.com")).thenReturn(bajoResponse);

        assertThatThrownBy(() -> loanService.requestLoan(request, "borrower@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("BAJO")
                .hasMessageContaining("1000");
    }
}
