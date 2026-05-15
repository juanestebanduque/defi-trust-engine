package com.example.trustengine.repository;

import com.example.trustengine.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    List<Loan> findByBorrowerId(Long borrowerId);

    List<Loan> findByLenderId(Long lenderId);

    /** Suma total de los montos prestados (préstamos ACTIVE o PAID) para un prestatario. */
    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM Loan l WHERE l.borrower.id = :borrowerId AND l.status IN ('ACTIVE','PAID')")
    BigDecimal sumLoanAmountByBorrower(@Param("borrowerId") Long borrowerId);

    /** Suma de saldo pendiente en préstamos ACTIVE para un prestatario. */
    @Query("SELECT COALESCE(SUM(l.pendingBalance), 0) FROM Loan l WHERE l.borrower.id = :borrowerId AND l.status = 'ACTIVE'")
    BigDecimal sumPendingBalanceByBorrower(@Param("borrowerId") Long borrowerId);

    /**
     * Solicitudes disponibles: préstamos PENDING sin prestamista asignado,
     * con filtros opcionales por monto.
     */
    @Query("SELECT l FROM Loan l WHERE l.status = 'PENDING' AND l.lender IS NULL " +
           "AND (:minAmount IS NULL OR l.amount >= :minAmount) " +
           "AND (:maxAmount IS NULL OR l.amount <= :maxAmount) " +
           "ORDER BY l.createdAt DESC")
    List<Loan> findAvailableRequests(
            @Param("minAmount") BigDecimal minAmount,
            @Param("maxAmount") BigDecimal maxAmount
    );
}
