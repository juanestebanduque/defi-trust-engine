package com.example.trustengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionHistoryResponse {
    private BigDecimal totalReceived;
    private BigDecimal totalSent;
    private long totalTransactions;
    private Page<TransactionDto> transactions;
}
