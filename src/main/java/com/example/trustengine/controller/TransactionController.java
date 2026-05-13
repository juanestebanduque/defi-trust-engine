package com.example.trustengine.controller;

import com.example.trustengine.dto.TransactionHistoryResponse;
import com.example.trustengine.dto.TransactionDto;
import com.example.trustengine.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<TransactionHistoryResponse> getTransactions(
            Principal principal,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "todo") String type,
            @RequestParam(defaultValue = "todos") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "date,desc") String sort
    ) {
        TransactionHistoryResponse response = transactionService.getTransactionHistoryForUser(
                principal.getName(),
                search,
                type,
                status,
                page,
                size,
                sort
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDto> getTransactionById(Principal principal, @PathVariable Long id) {
        TransactionDto transaction = transactionService.getTransactionForUser(principal.getName(), id);
        return ResponseEntity.ok(transaction);
    }
}
