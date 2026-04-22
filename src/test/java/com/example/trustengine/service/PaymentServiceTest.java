package com.example.trustengine.service;

import com.example.trustengine.dto.PaymentRequest;
import com.example.trustengine.dto.PaymentResponse;
import com.example.trustengine.dto.TransactionRequest;
import com.example.trustengine.dto.TransactionResponse;
import com.example.trustengine.entity.Loan;
import com.example.trustengine.entity.LoanInstallment;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.LoanInstallmentRepository;
import com.example.trustengine.repository.LoanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private LoanInstallmentRepository installmentRepository;

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private PaymentService paymentService;

    private User borrower;
    private Loan loan;
    private LoanInstallment installment;

    @BeforeEach
    void setUp() {
        borrower = new User();
        borrower.setId(1L);

        loan = Loan.builder()
                .id(10L)
                .borrower(borrower)
                .amount(new BigDecimal("1000.00"))
                .pendingBalance(new BigDecimal("1000.00"))
                .interestRate(new BigDecimal("5.00"))
                .status("ACTIVE")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(12))
                .build();

        installment = LoanInstallment.builder()
                .id(100L)
                .loan(loan)
                .installmentNumber(1)
                .dueDate(LocalDate.now().plusMonths(1))
                .amount(new BigDecimal("250.00"))
                .status("PENDING")
                .build();
    }

    // CA1: registra pago exitosamente
    @Test
    void makePayment_registersPaymentSuccessfully() {
        PaymentRequest request = new PaymentRequest(10L, 1L, new BigDecimal("250.00"), 100L);

        when(loanRepository.findById(10L)).thenReturn(Optional.of(loan));
        when(installmentRepository.findById(100L)).thenReturn(Optional.of(installment));
        when(loanRepository.save(any())).thenReturn(loan);
        when(installmentRepository.save(any())).thenReturn(installment);
        when(transactionService.register(any(TransactionRequest.class))).thenReturn(
                new TransactionResponse(1L, "abc123hash", 1L, "LOAN_PAYMENT",
                        new BigDecimal("250.00"), "desc", OffsetDateTime.now())
        );

        PaymentResponse response = paymentService.makePayment(request);

        assertThat(response).isNotNull();
        assertThat(response.loanId()).isEqualTo(10L);
        assertThat(response.installmentId()).isEqualTo(100L);
        assertThat(response.amountPaid()).isEqualByComparingTo("250.00");
        assertThat(response.transactionHash()).isEqualTo("abc123hash");
    }

    // CA2: actualiza saldo pendiente del préstamo
    @Test
    void makePayment_updatesPendingBalance() {
        PaymentRequest request = new PaymentRequest(10L, 1L, new BigDecimal("250.00"), 100L);

        when(loanRepository.findById(10L)).thenReturn(Optional.of(loan));
        when(installmentRepository.findById(100L)).thenReturn(Optional.of(installment));
        when(loanRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(installmentRepository.save(any())).thenReturn(installment);
        when(transactionService.register(any())).thenReturn(
                new TransactionResponse(1L, "hash", 1L, "LOAN_PAYMENT",
                        new BigDecimal("250.00"), "desc", OffsetDateTime.now())
        );

        PaymentResponse response = paymentService.makePayment(request);

        assertThat(response.newPendingBalance()).isEqualByComparingTo("750.00");

        ArgumentCaptor<Loan> loanCaptor = ArgumentCaptor.forClass(Loan.class);
        verify(loanRepository).save(loanCaptor.capture());
        assertThat(loanCaptor.getValue().getPendingBalance()).isEqualByComparingTo("750.00");
    }

    // CA2: marca el préstamo como PAID cuando el saldo llega a cero
    @Test
    void makePayment_marksLoanPaidWhenBalanceReachesZero() {
        loan.setPendingBalance(new BigDecimal("250.00"));
        PaymentRequest request = new PaymentRequest(10L, 1L, new BigDecimal("250.00"), 100L);

        when(loanRepository.findById(10L)).thenReturn(Optional.of(loan));
        when(installmentRepository.findById(100L)).thenReturn(Optional.of(installment));
        when(loanRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(installmentRepository.save(any())).thenReturn(installment);
        when(transactionService.register(any())).thenReturn(
                new TransactionResponse(1L, "hash", 1L, "LOAN_PAYMENT",
                        new BigDecimal("250.00"), "desc", OffsetDateTime.now())
        );

        paymentService.makePayment(request);

        ArgumentCaptor<Loan> loanCaptor = ArgumentCaptor.forClass(Loan.class);
        verify(loanRepository).save(loanCaptor.capture());
        assertThat(loanCaptor.getValue().getStatus()).isEqualTo("PAID");
    }

    // CA3: marca la cuota como pagada
    @Test
    void makePayment_marksInstallmentAsPaid() {
        PaymentRequest request = new PaymentRequest(10L, 1L, new BigDecimal("250.00"), 100L);

        when(loanRepository.findById(10L)).thenReturn(Optional.of(loan));
        when(installmentRepository.findById(100L)).thenReturn(Optional.of(installment));
        when(loanRepository.save(any())).thenReturn(loan);
        when(installmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(transactionService.register(any())).thenReturn(
                new TransactionResponse(1L, "hash", 1L, "LOAN_PAYMENT",
                        new BigDecimal("250.00"), "desc", OffsetDateTime.now())
        );

        PaymentResponse response = paymentService.makePayment(request);

        assertThat(response.installmentStatus()).isEqualTo("PAID");

        ArgumentCaptor<LoanInstallment> captor = ArgumentCaptor.forClass(LoanInstallment.class);
        verify(installmentRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("PAID");
        assertThat(captor.getValue().getPaidAt()).isNotNull();
    }

    @Test
    void makePayment_throwsWhenLoanNotFound() {
        when(loanRepository.findById(99L)).thenReturn(Optional.empty());
        PaymentRequest request = new PaymentRequest(99L, 1L, new BigDecimal("100.00"), 1L);

        assertThatThrownBy(() -> paymentService.makePayment(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("99");
    }

    @Test
    void makePayment_throwsWhenBorrowerMismatch() {
        when(loanRepository.findById(10L)).thenReturn(Optional.of(loan));
        PaymentRequest request = new PaymentRequest(10L, 999L, new BigDecimal("100.00"), 100L);

        assertThatThrownBy(() -> paymentService.makePayment(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("prestatario");
    }

    @Test
    void makePayment_throwsWhenLoanNotActive() {
        loan.setStatus("PAID");
        when(loanRepository.findById(10L)).thenReturn(Optional.of(loan));
        PaymentRequest request = new PaymentRequest(10L, 1L, new BigDecimal("100.00"), 100L);

        assertThatThrownBy(() -> paymentService.makePayment(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("activo");
    }

    @Test
    void makePayment_throwsWhenAmountExceedsPendingBalance() {
        when(loanRepository.findById(10L)).thenReturn(Optional.of(loan));
        PaymentRequest request = new PaymentRequest(10L, 1L, new BigDecimal("9999.00"), 100L);

        assertThatThrownBy(() -> paymentService.makePayment(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("saldo pendiente");
    }

    @Test
    void makePayment_throwsWhenInstallmentAlreadyPaid() {
        installment.setStatus("PAID");
        when(loanRepository.findById(10L)).thenReturn(Optional.of(loan));
        when(installmentRepository.findById(100L)).thenReturn(Optional.of(installment));
        PaymentRequest request = new PaymentRequest(10L, 1L, new BigDecimal("250.00"), 100L);

        assertThatThrownBy(() -> paymentService.makePayment(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ya fue pagada");
    }
}
