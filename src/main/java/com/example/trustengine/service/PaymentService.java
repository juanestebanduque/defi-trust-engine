package com.example.trustengine.service;

import com.example.trustengine.dto.PaymentRequest;
import com.example.trustengine.dto.PaymentResponse;
import com.example.trustengine.dto.TransactionRequest;
import com.example.trustengine.dto.TransactionResponse;
import com.example.trustengine.entity.Loan;
import com.example.trustengine.entity.LoanInstallment;
import com.example.trustengine.repository.LoanInstallmentRepository;
import com.example.trustengine.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final LoanRepository loanRepository;
    private final LoanInstallmentRepository installmentRepository;
    private final TransactionService transactionService;

    @Transactional
    public PaymentResponse makePayment(PaymentRequest request) {
        Loan loan = loanRepository.findById(request.loanId())
                .orElseThrow(() -> new IllegalArgumentException("Préstamo no encontrado: " + request.loanId()));

        if (!loan.getBorrower().getId().equals(request.borrowerId())) {
            throw new IllegalArgumentException("El prestatario no corresponde al préstamo");
        }

        if (!"ACTIVE".equals(loan.getStatus())) {
            throw new IllegalStateException("El préstamo no está activo. Estado actual: " + loan.getStatus());
        }

        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new IllegalArgumentException("El monto del pago debe ser mayor a cero");
        }

        if (request.amount().compareTo(loan.getPendingBalance()) > 0) {
            throw new IllegalArgumentException("El monto excede el saldo pendiente del préstamo");
        }

        LoanInstallment installment = resolveInstallment(request, loan.getId());

        if ("PAID".equals(installment.getStatus())) {
            throw new IllegalStateException("La cuota ya fue pagada");
        }

        // CA3: marcar cuota como pagada
        installment.setStatus("PAID");
        installment.setPaidAt(OffsetDateTime.now());
        installmentRepository.save(installment);

        // CA2: actualizar saldo pendiente
        loan.setPendingBalance(loan.getPendingBalance().subtract(request.amount()));
        if (loan.getPendingBalance().signum() == 0) {
            loan.setStatus("PAID");
        }
        loanRepository.save(loan);

        // CA1: registrar transacción blockchain
        TransactionResponse tx = transactionService.register(new TransactionRequest(
                request.borrowerId(),
                "LOAN_PAYMENT",
                request.amount(),
                "Pago cuota #" + installment.getInstallmentNumber() + " del préstamo " + loan.getId()
        ));

        return new PaymentResponse(
                loan.getId(),
                installment.getId(),
                installment.getInstallmentNumber(),
                request.amount(),
                loan.getPendingBalance(),
                installment.getStatus(),
                tx.transactionHash(),
                installment.getPaidAt()
        );
    }

    private LoanInstallment resolveInstallment(PaymentRequest request, Long loanId) {
        if (request.installmentId() != null) {
            LoanInstallment installment = installmentRepository.findById(request.installmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Cuota no encontrada: " + request.installmentId()));
            if (!installment.getLoan().getId().equals(loanId)) {
                throw new IllegalArgumentException("La cuota no pertenece al préstamo indicado");
            }
            return installment;
        }
        return installmentRepository
                .findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(loanId, "PENDING")
                .orElseThrow(() -> new IllegalStateException("No hay cuotas pendientes para el préstamo"));
    }
}
