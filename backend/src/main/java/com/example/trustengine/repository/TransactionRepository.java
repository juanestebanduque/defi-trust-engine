package com.example.trustengine.repository;

import com.example.trustengine.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {
    Optional<Transaction> findByTransactionHash(String transactionHash);
    List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByTransactionHash(String transactionHash);

    Page<Transaction> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.amount >= 0")
    BigDecimal sumReceivedByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(ABS(t.amount)), 0) FROM Transaction t WHERE t.user.id = :userId AND t.amount < 0")
    BigDecimal sumSentByUserId(@Param("userId") Long userId);

    long countByUserId(Long userId);
}
