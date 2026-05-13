package com.example.trustengine.service;

import com.example.trustengine.dto.TransactionDto;
import com.example.trustengine.dto.TransactionHistoryResponse;
import com.example.trustengine.entity.Transaction;
import com.example.trustengine.entity.User;
import com.example.trustengine.mapper.TransactionMapper;
import com.example.trustengine.repository.TransactionRepository;
import com.example.trustengine.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionMapper transactionMapper;

    @InjectMocks
    private TransactionService transactionService;

    private User user;
    private Transaction transaction;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("owner@test.com")
                .build();

        transaction = Transaction.builder()
                .id(10L)
                .txHash("TX-00000010")
                .user(user)
                .type("TRANSFER")
                .amount(new BigDecimal("100.00"))
                .build();
    }

    @Test
    void shouldReturnTransactionHistoryForUser() {
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(user));
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(transaction)));
        when(transactionRepository.sumReceivedByUserId(user.getId())).thenReturn(new BigDecimal("100.00"));
        when(transactionRepository.sumSentByUserId(user.getId())).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.countByUserId(user.getId())).thenReturn(1L);
        when(transactionMapper.toDto(transaction)).thenReturn(TransactionDto.builder()
                .id(10L)
                .txHash("TX-00000010")
                .type("TRANSFER")
                .title("TRANSFER")
                .amount(new BigDecimal("100.00"))
                .build());

        TransactionHistoryResponse response = transactionService.getTransactionHistoryForUser(
                "owner@test.com", "", "todo", "todos", 0, 10, "date,desc");

        assertThat(response.getTransactions().getContent()).hasSize(1);
        assertThat(response.getTransactions().getContent().get(0).getId()).isEqualTo(10L);
        assertThat(response.getTransactions().getContent().get(0).getTxHash()).isEqualTo("TX-00000010");
        assertThat(response.getTotalTransactions()).isEqualTo(1L);
    }

    @Test
    void shouldThrowWhenTransactionNotFoundForUser() {
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(user));
        when(transactionRepository.findByIdAndUserId(999L, user.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.getTransactionForUser("owner@test.com", 999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Transaction not found");
    }

    @Test
    void shouldThrowWhenUserNotFound() {
        when(userRepository.findByEmail("missing@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.getTransactionHistoryForUser(
                "missing@test.com", "", "todo", "todos", 0, 10, "date,desc"))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }
}
