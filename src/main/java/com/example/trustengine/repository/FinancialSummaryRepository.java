package com.example.trustengine.repository;

import com.example.trustengine.entity.FinancialSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FinancialSummaryRepository extends JpaRepository<FinancialSummary, Long> {
    Optional<FinancialSummary> findByUserId(Long userId);
}
