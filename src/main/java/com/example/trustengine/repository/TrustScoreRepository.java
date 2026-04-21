package com.example.trustengine.repository;

import com.example.trustengine.entity.TrustScore;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TrustScoreRepository extends JpaRepository<TrustScore, Long> {
    List<TrustScore> findByUserIdOrderByCalculationDateDesc(Long userId);
    Optional<TrustScore> findFirstByUserIdOrderByCalculationDateDesc(Long userId);
}
