package com.example.trustengine.dto;

import java.math.BigDecimal;

public record TransactionRequest(
        Long userId,
        String type,
        BigDecimal amount,
        String description
) {}
