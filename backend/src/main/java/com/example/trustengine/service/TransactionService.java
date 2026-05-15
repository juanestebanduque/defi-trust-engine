package com.example.trustengine.service;

import com.example.trustengine.dto.TransactionRequest;
import com.example.trustengine.dto.TransactionResponse;
import com.example.trustengine.entity.Transaction;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.TransactionRepository;
import com.example.trustengine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional
    public TransactionResponse register(TransactionRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + request.userId()));

        String hash = generateHash(request, user.getId());

        if (transactionRepository.existsByTransactionHash(hash)) {
            throw new IllegalStateException("Ya existe una transacción con ese hash: " + hash);
        }

        Transaction transaction = Transaction.builder()
                .transactionHash(hash)
                .user(user)
                .type(request.type())
                .amount(request.amount())
                .description(request.description())
                .build();

        return TransactionResponse.from(transactionRepository.save(transaction));
    }

    @Transactional(readOnly = true)
    public TransactionResponse getByHash(String hash) {
        Transaction t = transactionRepository.findByTransactionHash(hash)
                .orElseThrow(() -> new IllegalArgumentException("Transacción no encontrada: " + hash));
        return TransactionResponse.from(t);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getByUserId(Long userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(TransactionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getMyTransactions(String email, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return transactionRepository.findByUserEmailOrderByCreatedAtDesc(email, pageable)
                .map(TransactionResponse::from);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getByIdForOwner(Long id, String email) {
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transacción no encontrada: " + id));
        if (!t.getUser().getEmail().equals(email)) {
            throw new SecurityException("Acceso no autorizado a la transacción: " + id);
        }
        return TransactionResponse.from(t);
    }

    private String generateHash(TransactionRequest request, Long userId) {
        String input = userId + "|" + request.type() + "|" + request.amount() + "|" + Instant.now().toEpochMilli();
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
