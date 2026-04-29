package com.example.trustengine.service;

import com.example.trustengine.dto.LoanRequestDTO;
import com.example.trustengine.entity.Loan;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.LoanRepository;
import com.example.trustengine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final TrustScoreService trustScoreService;

    // Constantes de límites
    static final BigDecimal MIN_AMOUNT = new BigDecimal("100");
    static final int MIN_TERM_MONTHS = 1;
    static final int MAX_TERM_MONTHS = 60;

    /**
     * CA1 + CA2 + CA3: Solicitar un préstamo con validación de monto,
     * registro en el sistema y estado inicial PENDING.
     */
    @Transactional
    public LoanRequestDTO requestLoan(LoanRequestDTO request, String borrowerEmail) {
        User borrower = userRepository.findByEmail(borrowerEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con email: " + borrowerEmail));

        // CA1: Validación de monto
        validateAmount(request.getAmount(), borrowerEmail);

        // Validación de plazo
        validateTerm(request.getTermMonths());

        // Obtener Trust Score actual para tasa de interés dinámica
        var trustScoreResponse = trustScoreService.getTrustScoreForUser(borrowerEmail);
        String level = trustScoreResponse.getLevel();
        BigDecimal interestRate = calculateInterestRate(level);

        // CA2: Registro de solicitud
        // CA3: Estado inicial "PENDING"
        Loan loan = Loan.builder()
                .borrower(borrower)
                .amount(request.getAmount())
                .interestRate(interestRate)
                .status("PENDING")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(request.getTermMonths()))
                .pendingBalance(request.getAmount()) // Balance inicial = monto solicitado
                .build();

        Loan savedLoan = loanRepository.save(loan);

        return toLoanRequestDTO(savedLoan, trustScoreResponse.getScoreValue());
    }

    /**
     * CA1: Valida que el monto cumpla los límites permitidos.
     * Los límites máximos dependen del Trust Score del usuario.
     */
    void validateAmount(BigDecimal amount, String borrowerEmail) {
        if (amount == null) {
            throw new IllegalArgumentException("El monto es obligatorio.");
        }

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El monto debe ser mayor a cero.");
        }

        if (amount.compareTo(MIN_AMOUNT) < 0) {
            throw new IllegalArgumentException(
                    String.format("El monto mínimo permitido es %s.", MIN_AMOUNT));
        }

        // Límite máximo dinámico según Trust Score
        var trustScoreResponse = trustScoreService.getTrustScoreForUser(borrowerEmail);
        String level = trustScoreResponse.getLevel();
        BigDecimal maxAmount = calculateMaxAmount(level);

        if (amount.compareTo(maxAmount) > 0) {
            throw new IllegalArgumentException(String.format(
                    "Para tu nivel de confianza (%s), el monto máximo permitido es %s.",
                    level, maxAmount));
        }
    }

    /** Valida que el plazo esté dentro de los rangos permitidos. */
    void validateTerm(Integer termMonths) {
        if (termMonths == null || termMonths < MIN_TERM_MONTHS) {
            throw new IllegalArgumentException(
                    String.format("El plazo debe ser al menos %d mes(es).", MIN_TERM_MONTHS));
        }
        if (termMonths > MAX_TERM_MONTHS) {
            throw new IllegalArgumentException(
                    String.format("El plazo máximo permitido es %d meses.", MAX_TERM_MONTHS));
        }
    }

    /** Lista los préstamos del prestatario autenticado. */
    public List<LoanRequestDTO> getMyLoans(String borrowerEmail) {
        User borrower = userRepository.findByEmail(borrowerEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        BigDecimal score = trustScoreService.getLatestScore(borrower.getId());

        return loanRepository.findByBorrowerId(borrower.getId()).stream()
                .map(loan -> toLoanRequestDTO(loan, score))
                .collect(Collectors.toList());
    }

    /** Monto máximo según nivel de Trust Score. */
    BigDecimal calculateMaxAmount(String level) {
        return switch (level) {
            case "ALTO" -> new BigDecimal("50000");
            case "MEDIO" -> new BigDecimal("10000");
            case "BAJO" -> new BigDecimal("1000");
            default -> new BigDecimal("100");
        };
    }

    /** Tasa de interés según nivel de Trust Score (mejor score → menor tasa). */
    BigDecimal calculateInterestRate(String level) {
        return switch (level) {
            case "ALTO" -> new BigDecimal("5.0");
            case "MEDIO" -> new BigDecimal("12.0");
            case "BAJO" -> new BigDecimal("25.0");
            default -> new BigDecimal("30.0");
        };
    }

    private LoanRequestDTO toLoanRequestDTO(Loan loan, BigDecimal trustScore) {
        return LoanRequestDTO.builder()
                .loanId(loan.getId())
                .borrowerId(loan.getBorrower().getId())
                .borrowerEmail(loan.getBorrower().getEmail())
                .amount(loan.getAmount())
                .interestRate(loan.getInterestRate())
                .status(loan.getStatus())
                .startDate(loan.getStartDate())
                .endDate(loan.getEndDate())
                .trustScore(trustScore)
                .saved(false)
                .createdAt(loan.getCreatedAt())
                .build();
    }
}
