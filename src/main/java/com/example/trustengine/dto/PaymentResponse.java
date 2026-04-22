package com.example.trustengine.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PaymentResponse(
        Long loanId,
        Long installmentId,
        Integer installmentNumber,
        BigDecimal amountPaid,
        BigDecimal newPendingBalance,
        String installmentStatus,
        String transactionHash,
        OffsetDateTime paidAt
) {}
