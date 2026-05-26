package com.example.trustengine.repository;

import com.example.trustengine.entity.LoanInstallment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LoanInstallmentRepository extends JpaRepository<LoanInstallment, Long> {
    List<LoanInstallment> findByLoanIdOrderByInstallmentNumberAsc(Long loanId);
    Optional<LoanInstallment> findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(Long loanId, String status);

    /** CA1: cuotas vencidas aún no penalizadas. */
    @Query("SELECT i FROM LoanInstallment i WHERE i.status = 'PENDING' AND i.dueDate < :today AND i.penalized = false")
    List<LoanInstallment> findAllOverdueNotPenalized(@Param("today") LocalDate today);
}
