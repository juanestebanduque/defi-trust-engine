package com.example.trustengine.service;

import com.example.trustengine.dto.LoanRequestDTO;
import com.example.trustengine.dto.TransactionRequest;
import com.example.trustengine.entity.Loan;
import com.example.trustengine.entity.LoanInstallment;
import com.example.trustengine.entity.SavedLoanRequest;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.LoanInstallmentRepository;
import com.example.trustengine.repository.LoanRepository;
import com.example.trustengine.repository.SavedLoanRequestRepository;
import com.example.trustengine.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanRequestService {

    private final LoanRepository loanRepository;
    private final LoanInstallmentRepository installmentRepository;
    private final SavedLoanRequestRepository savedLoanRequestRepository;
    private final UserRepository userRepository;
    private final TrustScoreService trustScoreService;
    private final TransactionService transactionService;

    /**
     * CA1 + CA2 + CA3: Lista solicitudes PENDING sin prestamista asignado,
     * enriquecidas con el Trust Score del prestatario y filtros opcionales.
     */
    public List<LoanRequestDTO> getAvailableRequests(
            BigDecimal minAmount,
            BigDecimal maxAmount,
            BigDecimal minTrustScore,
            BigDecimal maxTrustScore,
            Long lenderId
    ) {
        List<Loan> loans = loanRepository.findAvailableRequests(minAmount, maxAmount);

        Set<Long> savedLoanIds = lenderId != null
                ? savedLoanRequestRepository.findByLenderId(lenderId)
                    .stream()
                    .map(s -> s.getLoan().getId())
                    .collect(Collectors.toSet())
                : Set.of();

        return loans.stream()
                .map(loan -> {
                    BigDecimal score = trustScoreService.getLatestScore(loan.getBorrower().getId());
                    return LoanRequestDTO.builder()
                            .loanId(loan.getId())
                            .borrowerId(loan.getBorrower().getId())
                            .borrowerEmail(loan.getBorrower().getEmail())
                            .amount(loan.getAmount())
                            .interestRate(loan.getInterestRate())
                            .status(loan.getStatus())
                            .startDate(loan.getStartDate())
                            .endDate(loan.getEndDate())
                            .trustScore(score)
                            .saved(savedLoanIds.contains(loan.getId()))
                            .createdAt(loan.getCreatedAt())
                            .build();
                })
                .filter(dto -> minTrustScore == null || dto.getTrustScore().compareTo(minTrustScore) >= 0)
                .filter(dto -> maxTrustScore == null || dto.getTrustScore().compareTo(maxTrustScore) <= 0)
                .collect(Collectors.toList());
    }

    /**
     * CA4: Guarda una solicitud de préstamo en la lista del prestamista.
     */
    @Transactional
    public LoanRequestDTO saveLoanRequest(Long lenderId, Long loanId) {
        if (savedLoanRequestRepository.existsByLenderIdAndLoanId(lenderId, loanId)) {
            throw new IllegalStateException("La solicitud ya está guardada");
        }

        User lender = userRepository.findById(lenderId)
                .orElseThrow(() -> new NoSuchElementException("Prestamista no encontrado: " + lenderId));

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new NoSuchElementException("Solicitud no encontrada: " + loanId));

        savedLoanRequestRepository.save(
                SavedLoanRequest.builder().lender(lender).loan(loan).build()
        );

        BigDecimal score = trustScoreService.getLatestScore(loan.getBorrower().getId());
        return toLoanRequestDTO(loan, score, true);
    }

    /**
     * CA4: Lista las solicitudes guardadas por un prestamista.
     */
    public List<LoanRequestDTO> getSavedRequests(Long lenderId) {
        return savedLoanRequestRepository.findByLenderId(lenderId).stream()
                .map(saved -> {
                    Loan loan = saved.getLoan();
                    BigDecimal score = trustScoreService.getLatestScore(loan.getBorrower().getId());
                    return toLoanRequestDTO(loan, score, true);
                })
                .collect(Collectors.toList());
    }

    /**
     * CA5: Elimina una solicitud guardada de la vista del prestamista.
     */
    @Transactional
    public void removeSavedLoanRequest(Long lenderId, Long loanId) {
        if (!savedLoanRequestRepository.existsByLenderIdAndLoanId(lenderId, loanId)) {
            throw new NoSuchElementException("La solicitud guardada no existe");
        }
        savedLoanRequestRepository.deleteByLenderIdAndLoanId(lenderId, loanId);
    }

    /**
     * HU-12 CA1 + CA2 + CA3: Acepta una solicitud de préstamo PENDING.
     * CA1: Cambia estado a ACTIVE y asigna el prestamista.
     * CA2: Registra transacción LOAN_RECEIPT para notificar al prestatario.
     * CA3: Registra transacción LOAN_FUNDING para el prestamista.
     */
    @Transactional
    public LoanRequestDTO acceptLoanRequest(Long loanId, Long lenderId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new NoSuchElementException("Solicitud no encontrada: " + loanId));

        if (!"PENDING".equals(loan.getStatus())) {
            throw new IllegalStateException("La solicitud no está en estado PENDING.");
        }
        if (loan.getLender() != null) {
            throw new IllegalStateException("Esta solicitud ya tiene un prestamista asignado.");
        }

        User lender = userRepository.findById(lenderId)
                .orElseThrow(() -> new NoSuchElementException("Prestamista no encontrado: " + lenderId));

        if (lender.getId().equals(loan.getBorrower().getId())) {
            throw new IllegalStateException("No puedes aceptar tu propia solicitud de préstamo.");
        }

        // CA1: Cambiar estado a ACTIVE y asignar prestamista
        loan.setLender(lender);
        loan.setStatus("ACTIVE");
        Loan savedLoan = loanRepository.save(loan);

        // Generar cuotas mensuales
        long termMonths = ChronoUnit.MONTHS.between(loan.getStartDate(), loan.getEndDate());
        if (termMonths < 1) termMonths = 1;
        BigDecimal installmentAmount = loan.getAmount()
                .divide(BigDecimal.valueOf(termMonths), 2, RoundingMode.HALF_UP);
        for (int i = 1; i <= termMonths; i++) {
            installmentRepository.save(LoanInstallment.builder()
                    .loan(savedLoan)
                    .installmentNumber(i)
                    .dueDate(loan.getStartDate().plusMonths(i))
                    .amount(installmentAmount)
                    .status("PENDING")
                    .build());
        }

        // CA3: Transacción para el prestamista
        transactionService.register(new TransactionRequest(
                lender.getId(),
                "LOAN_FUNDING",
                loan.getAmount(),
                "Financiamiento de préstamo #" + loanId + " a " + loan.getBorrower().getEmail()
        ));

        // CA2 + CA3: Transacción para el prestatario como notificación
        transactionService.register(new TransactionRequest(
                loan.getBorrower().getId(),
                "LOAN_RECEIPT",
                loan.getAmount(),
                "Préstamo #" + loanId + " aprobado por " + lender.getEmail()
        ));

        BigDecimal score = trustScoreService.getLatestScore(loan.getBorrower().getId());
        return toLoanRequestDTO(savedLoan, score, false);
    }

    private LoanRequestDTO toLoanRequestDTO(Loan loan, BigDecimal score, boolean saved) {
        return LoanRequestDTO.builder()
                .loanId(loan.getId())
                .borrowerId(loan.getBorrower().getId())
                .borrowerEmail(loan.getBorrower().getEmail())
                .amount(loan.getAmount())
                .interestRate(loan.getInterestRate())
                .status(loan.getStatus())
                .startDate(loan.getStartDate())
                .endDate(loan.getEndDate())
                .trustScore(score)
                .saved(saved)
                .createdAt(loan.getCreatedAt())
                .build();
    }
}
