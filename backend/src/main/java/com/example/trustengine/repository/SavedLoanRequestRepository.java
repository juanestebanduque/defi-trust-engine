package com.example.trustengine.repository;

import com.example.trustengine.entity.SavedLoanRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedLoanRequestRepository extends JpaRepository<SavedLoanRequest, Long> {

    List<SavedLoanRequest> findByLenderId(Long lenderId);

    Optional<SavedLoanRequest> findByLenderIdAndLoanId(Long lenderId, Long loanId);

    boolean existsByLenderIdAndLoanId(Long lenderId, Long loanId);

    void deleteByLenderIdAndLoanId(Long lenderId, Long loanId);
}
