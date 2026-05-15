package com.example.trustengine.repository;

import com.example.trustengine.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByTransactionHash(String transactionHash);
    List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<Transaction> findByUserEmailOrderByCreatedAtDesc(String email, Pageable pageable);
    boolean existsByTransactionHash(String transactionHash);
}
