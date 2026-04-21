package com.example.trustengine.repository;

import com.example.trustengine.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByBorrowerId(Long borrowerId);
    List<Loan> findByLenderId(Long lenderId);
}
