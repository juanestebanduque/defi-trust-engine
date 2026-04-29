package com.example.trustengine.dto;

import com.example.trustengine.entity.Transaction;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record TransactionResponse(
        Long id,
        String transactionHash,
        Long userId,
        String type,
        BigDecimal amount,
        String description,
        OffsetDateTime createdAt
) {
    public static TransactionResponse from(Transaction t) {
        return new TransactionResponse(
                t.getId(),
                t.getTransactionHash(),
                t.getUser().getId(),
                t.getType(),
                t.getAmount(),
                t.getDescription(),
                t.getCreatedAt()
        );
    }
}
