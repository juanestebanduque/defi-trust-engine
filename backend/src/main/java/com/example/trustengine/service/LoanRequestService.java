package com.example.trustengine.service;

import com.example.trustengine.dto.LoanRequestDTO;
import com.example.trustengine.entity.Loan;
import com.example.trustengine.entity.SavedLoanRequest;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.LoanRepository;
import com.example.trustengine.repository.SavedLoanRequestRepository;
import com.example.trustengine.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanRequestService {

    private final LoanRepository loanRepository;
    private final SavedLoanRequestRepository savedLoanRequestRepository;
    private final UserRepository userRepository;
    private final TrustScoreService trustScoreService;

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
