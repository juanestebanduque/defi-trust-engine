package com.example.trustengine.service;

import com.example.trustengine.dto.TransactionHistoryResponse;
import com.example.trustengine.dto.TransactionRequest;
import com.example.trustengine.dto.TransactionResponse;
import com.example.trustengine.entity.Transaction;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.TransactionRepository;
import com.example.trustengine.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public TransactionService(TransactionRepository transactionRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

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
    public TransactionHistoryResponse getTransactionHistoryForUser(
            String userEmail,
            String search,
            String typeFilter,
            String statusFilter,
            int page,
            int size,
            String sort
    ) {
        User user = findUserByEmail(userEmail);
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        Specification<Transaction> specification = buildSpecification(user.getId(), search, typeFilter);
        Page<TransactionResponse> transactionPage = transactionRepository.findAll(specification, pageable)
                .map(TransactionResponse::from);

        BigDecimal totalReceived = transactionRepository.sumReceivedByUserId(user.getId());
        BigDecimal totalSent = transactionRepository.sumSentByUserId(user.getId());
        long totalTransactions = transactionRepository.countByUserId(user.getId());

        return new TransactionHistoryResponse(
                totalReceived,
                totalSent,
                totalTransactions,
                transactionPage
        );
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + email));
    }

    private Specification<Transaction> buildSpecification(Long userId, String search, String typeFilter) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("user").get("id"), userId));

            if (search != null && !search.isBlank()) {
                String searchTerm = search.trim().toLowerCase();
                List<Predicate> searchPredicates = new ArrayList<>();
                searchPredicates.add(builder.like(builder.lower(root.get("transactionHash")), "%" + searchTerm + "%"));
                searchPredicates.add(builder.like(builder.lower(root.get("description")), "%" + searchTerm + "%"));
                try {
                    Long transactionId = Long.parseLong(searchTerm);
                    searchPredicates.add(builder.equal(root.get("id"), transactionId));
                } catch (NumberFormatException ignored) {
                }
                predicates.add(builder.or(searchPredicates.toArray(new Predicate[0])));
            }

            if (typeFilter != null && !typeFilter.isBlank() && !"todo".equalsIgnoreCase(typeFilter) && !"todos".equalsIgnoreCase(typeFilter)) {
                String normalizedType = typeFilter.trim().toLowerCase();
                switch (normalizedType) {
                    case "deposit":
                        predicates.add(builder.equal(root.get("type"), "DEPOSIT"));
                        break;
                    case "withdrawal":
                        predicates.add(builder.equal(root.get("type"), "WITHDRAWAL"));
                        break;
                    case "payment":
                        predicates.add(builder.equal(root.get("type"), "LOAN_PAYMENT"));
                        break;
                    case "pago":
                    case "pagos":
                        predicates.add(builder.equal(root.get("type"), "LOAN_PAYMENT"));
                        break;
                    case "prestamo":
                    case "prestamos":
                    case "préstamo":
                    case "préstamos":
                        predicates.add(builder.like(builder.lower(root.get("type")), "%loan%"));
                        break;
                    default:
                        predicates.add(builder.equal(root.get("type"), typeFilter));
                        break;
                }
            }

            return builder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Sort parseSort(String sortParameter) {
        if (sortParameter == null || sortParameter.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sortParameter.split(",");
        String property = parts[0].trim();
        String direction = parts.length > 1 ? parts[1].trim().toLowerCase() : "desc";

        if ("date" .equalsIgnoreCase(property) || "createdAt".equalsIgnoreCase(property)) {
            property = "createdAt";
        }

        Sort.Direction sortDirection = "asc".equals(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(sortDirection, property);
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
