package com.example.trustengine.repository;

import com.example.trustengine.entity.LoanInstallment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LoanInstallmentRepository extends JpaRepository<LoanInstallment, Long> {
    List<LoanInstallment> findByLoanIdOrderByInstallmentNumberAsc(Long loanId);
    Optional<LoanInstallment> findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(Long loanId, String status);
}
