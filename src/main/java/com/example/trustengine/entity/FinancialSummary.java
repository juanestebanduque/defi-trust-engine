package com.example.trustengine.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "financial_summaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "total_loans_taken", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalLoansTaken = BigDecimal.ZERO;

    @Column(name = "total_repaid", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalRepaid = BigDecimal.ZERO;

    @Column(name = "missed_payments", nullable = false)
    @Builder.Default
    private Integer missedPayments = 0;

    @Column(name = "current_debt", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentDebt = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
