package com.example.trustengine.service;

import com.example.trustengine.dto.TransactionRequest;
import com.example.trustengine.dto.TransactionResponse;
import com.example.trustengine.entity.Transaction;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.TransactionRepository;
import com.example.trustengine.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TransactionService transactionService;

    private User user;
    private Transaction transaction;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("test@example.com")
                .passwordHash("hash")
                .role("USER")
                .status("ACTIVE")
                .securityQuestion("q")
                .securityAnswer("a")
                .build();

        transaction = Transaction.builder()
                .id(10L)
                .transactionHash("abc123hash")
                .user(user)
                .type("DEPOSIT")
                .amount(new BigDecimal("500.00"))
                .description("Ingreso de prueba")
                .build();
    }

    // ── CA1: Lista transacciones del usuario ──────────────────────────────────

    @Test
    void getMyTransactions_returnsPaginatedResultsForAuthenticatedUser() {
        Page<Transaction> page = new PageImpl<>(List.of(transaction));
        when(transactionRepository.findByUserEmailOrderByCreatedAtDesc(eq("test@example.com"), any(Pageable.class)))
                .thenReturn(page);

        Page<TransactionResponse> result = transactionService.getMyTransactions("test@example.com", 0, 10);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).id()).isEqualTo(10L);
        assertThat(result.getContent().get(0).type()).isEqualTo("DEPOSIT");
    }

    @Test
    void getMyTransactions_returnsEmptyPageWhenNoTransactions() {
        Page<Transaction> emptyPage = new PageImpl<>(List.of());
        when(transactionRepository.findByUserEmailOrderByCreatedAtDesc(eq("test@example.com"), any(Pageable.class)))
                .thenReturn(emptyPage);

        Page<TransactionResponse> result = transactionService.getMyTransactions("test@example.com", 0, 10);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }

    // ── CA2: Orden cronológico ────────────────────────────────────────────────

    @Test
    void getMyTransactions_usesDescendingCreatedAtSort() {
        Page<Transaction> page = new PageImpl<>(List.of());
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(transactionRepository.findByUserEmailOrderByCreatedAtDesc(anyString(), pageableCaptor.capture()))
                .thenReturn(page);

        transactionService.getMyTransactions("test@example.com", 0, 10);

        Pageable captured = pageableCaptor.getValue();
        assertThat(captured.getSort().getOrderFor("createdAt")).isNotNull();
        assertThat(captured.getSort().getOrderFor("createdAt").isDescending()).isTrue();
    }

    @Test
    void getByUserId_returnsTransactionsOrderedByCreatedAtDesc() {
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(transaction));

        List<TransactionResponse> result = transactionService.getByUserId(1L);

        assertThat(result).hasSize(1);
        verify(transactionRepository).findByUserIdOrderByCreatedAtDesc(1L);
    }

    // ── CA3: Detalle por transacción ──────────────────────────────────────────

    @Test
    void getByIdForOwner_returnsDetailWhenUserIsOwner() {
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(transaction));

        TransactionResponse result = transactionService.getByIdForOwner(10L, "test@example.com");

        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.transactionHash()).isEqualTo("abc123hash");
        assertThat(result.amount()).isEqualByComparingTo("500.00");
        assertThat(result.description()).isEqualTo("Ingreso de prueba");
    }

    @Test
    void getByIdForOwner_throwsSecurityExceptionWhenNotOwner() {
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(transaction));

        assertThatThrownBy(() -> transactionService.getByIdForOwner(10L, "otro@example.com"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("10");
    }

    @Test
    void getByIdForOwner_throwsIllegalArgumentWhenNotFound() {
        when(transactionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.getByIdForOwner(99L, "test@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("99");
    }

    // ── Registro de transacción ───────────────────────────────────────────────

    @Test
    void register_createsTransactionWithGeneratedHash() {
        TransactionRequest request = new TransactionRequest(1L, "DEPOSIT", new BigDecimal("200.00"), "Depósito");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(transactionRepository.existsByTransactionHash(anyString())).thenReturn(false);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);

        TransactionResponse result = transactionService.register(request);

        assertThat(result).isNotNull();
        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        assertThat(captor.getValue().getType()).isEqualTo("DEPOSIT");
        assertThat(captor.getValue().getAmount()).isEqualByComparingTo("200.00");
    }

    @Test
    void register_throwsWhenUserNotFound() {
        TransactionRequest request = new TransactionRequest(99L, "DEPOSIT", new BigDecimal("100.00"), "test");
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("99");
    }

    @Test
    void register_throwsWhenDuplicateHash() {
        TransactionRequest request = new TransactionRequest(1L, "DEPOSIT", new BigDecimal("100.00"), "test");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(transactionRepository.existsByTransactionHash(anyString())).thenReturn(true);

        assertThatThrownBy(() -> transactionService.register(request))
                .isInstanceOf(IllegalStateException.class);
    }

    // ── Paginación ────────────────────────────────────────────────────────────

    @Test
    void getMyTransactions_respectsPageAndSizeParameters() {
        Page<Transaction> page = new PageImpl<>(List.of());
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(transactionRepository.findByUserEmailOrderByCreatedAtDesc(anyString(), pageableCaptor.capture()))
                .thenReturn(page);

        transactionService.getMyTransactions("test@example.com", 2, 5);

        Pageable captured = pageableCaptor.getValue();
        assertThat(captured.getPageNumber()).isEqualTo(2);
        assertThat(captured.getPageSize()).isEqualTo(5);
    }
}
