package com.example.trustengine.service;

import com.example.trustengine.dto.TransactionDto;
import com.example.trustengine.dto.TransactionHistoryResponse;
import com.example.trustengine.entity.Transaction;
import com.example.trustengine.entity.User;
import com.example.trustengine.mapper.TransactionMapper;
import com.example.trustengine.repository.TransactionRepository;
import com.example.trustengine.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final TransactionMapper transactionMapper;

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
        Specification<Transaction> spec = buildSpecification(user.getId(), search, typeFilter);
        Page<TransactionDto> transactions = transactionRepository.findAll(spec, pageable)
                .map(transactionMapper::toDto);

        BigDecimal totalReceived = transactionRepository.sumReceivedByUserId(user.getId());
        BigDecimal totalSent = transactionRepository.sumSentByUserId(user.getId());
        long totalTransactions = transactionRepository.countByUserId(user.getId());

        return TransactionHistoryResponse.builder()
                .totalReceived(totalReceived)
                .totalSent(totalSent)
                .totalTransactions(totalTransactions)
                .transactions(transactions)
                .build();
    }

    public TransactionDto getTransactionForUser(String userEmail, Long transactionId) {
        User user = findUserByEmail(userEmail);
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, user.getId())
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found."));
        return transactionMapper.toDto(transaction);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found."));
    }

    private Specification<Transaction> buildSpecification(Long userId, String search, String typeFilter) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("user").get("id"), userId));

            if (search != null && !search.isBlank()) {
                String searchTerm = search.trim().toLowerCase();
                List<Predicate> searchPredicates = new ArrayList<>();
                searchPredicates.add(builder.like(builder.lower(root.get("txHash")), "%" + searchTerm + "%"));
                try {
                    Long transactionId = Long.parseLong(searchTerm);
                    searchPredicates.add(builder.equal(root.get("id"), transactionId));
                } catch (NumberFormatException ignored) {
                }
                predicates.add(builder.or(searchPredicates.toArray(new Predicate[0])));
            }

            if (typeFilter != null && !typeFilter.isBlank() && !"todo".equalsIgnoreCase(typeFilter) && !"todos".equalsIgnoreCase(typeFilter)) {
                String normalizedType = typeFilter.trim().toLowerCase();
                if ("pagos".equals(normalizedType) || "pago".equals(normalizedType)) {
                    predicates.add(builder.or(
                            builder.like(builder.lower(root.get("type")), "%pay%"),
                            builder.like(builder.lower(root.get("type")), "%transfer%")
                    ));
                } else if ("prestamos".equals(normalizedType) || "préstamos".equals(normalizedType)) {
                    predicates.add(builder.like(builder.lower(root.get("type")), "%loan%"));
                }
            }

            return builder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Sort parseSort(String sortParameter) {
        if (sortParameter == null || sortParameter.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "id");
        }
        String[] parts = sortParameter.split(",");
        String property = parts[0].trim();
        String direction = parts.length > 1 ? parts[1].trim().toLowerCase() : "desc";

        if ("date".equalsIgnoreCase(property)) {
            property = "id";
        }

        Sort.Direction sortDirection = "asc".equals(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(sortDirection, property);
    }
}
