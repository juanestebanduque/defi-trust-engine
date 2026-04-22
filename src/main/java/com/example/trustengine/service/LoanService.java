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

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final TrustScoreService trustScoreService;

    @Transactional
    public Loan requestLoan(LoanRequestDTO request, String borrowerEmail) {
        User borrower = userRepository.findByEmail(borrowerEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con email: " + borrowerEmail));

        // Obtener Trust Score actual para validaciones dinámicas
        var trustScoreResponse = trustScoreService.getTrustScoreForUser(borrowerEmail);
        BigDecimal userScore = trustScoreResponse.getScoreValue();
        String level = trustScoreResponse.getLevel();

        // CA1: Validación de monto dinámica basada en Trust Score
        BigDecimal minAmount = new BigDecimal("100");
        BigDecimal maxAmount = calculateMaxAmount(level);

        if (request.getAmount() == null || request.getAmount().compareTo(minAmount) < 0 || request.getAmount().compareTo(maxAmount) > 0) {
            throw new IllegalArgumentException(String.format(
                "Para tu nivel de confianza (%s), el monto debe estar entre %s y %s", 
                level, minAmount, maxAmount));
        }

        if (request.getTermMonths() == null || request.getTermMonths() <= 0) {
            throw new IllegalArgumentException("El plazo debe ser mayor a cero meses.");
        }

        // Tasa de interés personalizada según score (a mejor score, menor tasa)
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
                .build();

        return loanRepository.save(loan);
    }

    private BigDecimal calculateMaxAmount(String level) {
        return switch (level) {
            case "ALTO" -> new BigDecimal("50000");
            case "MEDIO" -> new BigDecimal("10000");
            case "BAJO" -> new BigDecimal("1000");
            default -> new BigDecimal("100");
        };
    }

    private BigDecimal calculateInterestRate(String level) {
        return switch (level) {
            case "ALTO" -> new BigDecimal("5.0");
            case "MEDIO" -> new BigDecimal("12.0");
            case "BAJO" -> new BigDecimal("25.0");
            default -> new BigDecimal("30.0");
        };
    }
}
