package com.example.trustengine.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(
    name = "saved_lenders",
    uniqueConstraints = @UniqueConstraint(columnNames = {"saved_by_id", "lender_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedLender {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Usuario que guarda al prestamista */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saved_by_id", nullable = false)
    private User savedBy;

    /** Usuario prestamista guardado */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lender_id", nullable = false)
    private User lender;

    @CreationTimestamp
    @Column(name = "saved_at", nullable = false, updatable = false)
    private OffsetDateTime savedAt;
}
