package com.example.trustengine.repository;

import com.example.trustengine.entity.LoanInstallment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LoanInstallmentRepository extends JpaRepository<LoanInstallment, Long> {
    List<LoanInstallment> findByLoanIdOrderByInstallmentNumberAsc(Long loanId);
    Optional<LoanInstallment> findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(Long loanId, String status);

    /** Suma del monto de cuotas pagadas para todos los préstamos de un prestatario. */
    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM LoanInstallment i WHERE i.loan.borrower.id = :borrowerId AND i.status = 'PAID'")
    BigDecimal sumPaidAmountByBorrower(@Param("borrowerId") Long borrowerId);

    /** Cuenta cuotas vencidas y no pagadas para un prestatario. */
    @Query("SELECT COUNT(i) FROM LoanInstallment i WHERE i.loan.borrower.id = :borrowerId AND i.status != 'PAID' AND i.dueDate < :today")
    long countOverdueByBorrower(@Param("borrowerId") Long borrowerId, @Param("today") LocalDate today);
}
