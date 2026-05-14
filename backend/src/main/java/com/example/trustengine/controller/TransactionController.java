package com.example.trustengine.controller;

import com.example.trustengine.dto.TransactionHistoryResponse;
import com.example.trustengine.dto.TransactionRequest;
import com.example.trustengine.dto.TransactionResponse;
import com.example.trustengine.service.TransactionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> register(@RequestBody TransactionRequest request) {
        TransactionResponse response = transactionService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{hash}")
    public ResponseEntity<TransactionResponse> getByHash(@PathVariable String hash) {
        return ResponseEntity.ok(transactionService.getByHash(hash));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TransactionResponse>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getByUserId(userId));
    }

    @GetMapping("/history")
    public ResponseEntity<TransactionHistoryResponse> getHistory(
            Principal principal,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "todo") String type,
            @RequestParam(defaultValue = "todos") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalArgumentException("Usuario no autenticado para consultar el historial.");
        }
        TransactionHistoryResponse history = transactionService.getTransactionHistoryForUser(
                principal.getName(),
                search,
                type,
                status,
                page,
                size,
                sort
        );
        return ResponseEntity.ok(history);
    }

    @PutMapping
    public ResponseEntity<Void> update() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build();
    }

    @PatchMapping
    public ResponseEntity<Void> patch() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build();
    }
}
