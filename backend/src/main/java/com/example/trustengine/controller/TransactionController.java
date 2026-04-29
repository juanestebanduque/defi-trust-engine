package com.example.trustengine.controller;

import com.example.trustengine.dto.TransactionRequest;
import com.example.trustengine.dto.TransactionResponse;
import com.example.trustengine.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

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

    @PutMapping
    public ResponseEntity<Void> update() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build();
    }

    @PatchMapping
    public ResponseEntity<Void> patch() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build();
    }
}
