package com.example.trustengine.dto;

import java.math.BigDecimal;

public record PaymentRequest(
        Long loanId,
        Long borrowerId,
        BigDecimal amount,
        Long installmentId
) {}
