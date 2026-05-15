package com.example.trustengine.dto;

import org.springframework.data.domain.Page;

import java.math.BigDecimal;

public class TransactionHistoryResponse {

    private BigDecimal totalReceived;
    private BigDecimal totalSent;
    private long totalTransactions;
    private Page<TransactionResponse> transactions;

    public TransactionHistoryResponse() {
    }

    public TransactionHistoryResponse(BigDecimal totalReceived, BigDecimal totalSent, long totalTransactions, Page<TransactionResponse> transactions) {
        this.totalReceived = totalReceived;
        this.totalSent = totalSent;
        this.totalTransactions = totalTransactions;
        this.transactions = transactions;
    }

    public BigDecimal getTotalReceived() {
        return totalReceived;
    }

    public void setTotalReceived(BigDecimal totalReceived) {
        this.totalReceived = totalReceived;
    }

    public BigDecimal getTotalSent() {
        return totalSent;
    }

    public void setTotalSent(BigDecimal totalSent) {
        this.totalSent = totalSent;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public Page<TransactionResponse> getTransactions() {
        return transactions;
    }

    public void setTransactions(Page<TransactionResponse> transactions) {
        this.transactions = transactions;
    }
}
