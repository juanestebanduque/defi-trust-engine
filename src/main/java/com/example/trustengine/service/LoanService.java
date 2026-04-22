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

    @Transactional
    public Loan requestLoan(LoanRequestDTO request, String borrowerEmail) {
        // CA1: Validación de monto
        BigDecimal minAmount = new BigDecimal("100");
        BigDecimal maxAmount = new BigDecimal("50000");

        if (request.getAmount() == null || request.getAmount().compareTo(minAmount) < 0 || request.getAmount().compareTo(maxAmount) > 0) {
            throw new IllegalArgumentException("El monto debe estar entre " + minAmount + " y " + maxAmount);
        }

        if (request.getTermMonths() == null || request.getTermMonths() <= 0) {
            throw new IllegalArgumentException("El plazo debe ser mayor a cero meses.");
        }

        User borrower = userRepository.findByEmail(borrowerEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con email: " + borrowerEmail));

        // CA2: Registro de solicitud
        // CA3: Estado inicial "PENDING"
        Loan loan = Loan.builder()
                .borrower(borrower)
                .amount(request.getAmount())
                .interestRate(new BigDecimal("10.0")) // Tasa base ejemplo
                .status("PENDING")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(request.getTermMonths()))
                .build();

        return loanRepository.save(loan);
    }
}
