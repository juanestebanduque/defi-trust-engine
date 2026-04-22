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
