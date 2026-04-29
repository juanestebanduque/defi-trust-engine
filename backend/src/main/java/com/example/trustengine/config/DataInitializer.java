package com.example.trustengine.config;

import com.example.trustengine.entity.*;
import com.example.trustengine.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final FinancialSummaryRepository financialSummaryRepository;
    private final LoanRepository loanRepository;
    private final LoanInstallmentRepository installmentRepository;
    private final TransactionRepository transactionRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Data already seeded, skipping...");
            return;
        }

        User alice = seedAlice();
        User bob   = seedBob();
        seedCarlos();

        log.info("✅ Test data seeded. Users: alice@trustfi.com, bob@trustfi.com, carlos@trustfi.com (password: test1234)");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Alice Hernández — ALTO trust score
    // ─────────────────────────────────────────────────────────────────────────
    private User seedAlice() {
        User alice = createUser(
                "alice@trustfi.com", "Alice", "Hernández", "USER",
                "+57 310 555 0101", "Calle 72 #10-25, Bogotá",
                "0xABCDEF1234567890ABCDEF1234567890ABCDEF12"
        );

        financialSummaryRepository.save(FinancialSummary.builder()
                .user(alice)
                .totalLoansTaken(new BigDecimal("8500.00"))
                .totalRepaid(new BigDecimal("8500.00"))
                .missedPayments(0)
                .currentDebt(BigDecimal.ZERO)
                .build());

        // Loan 1: 6-month loan, fully paid (14-8 months ago)
        Loan loan1 = loanRepository.save(Loan.builder()
                .borrower(alice)
                .amount(new BigDecimal("2000.00"))
                .interestRate(new BigDecimal("5.0"))
                .status("PAID")
                .startDate(LocalDate.now().minusMonths(14))
                .endDate(LocalDate.now().minusMonths(8))
                .pendingBalance(BigDecimal.ZERO)
                .build());

        for (int i = 1; i <= 6; i++) {
            LocalDate due = loan1.getStartDate().plusMonths(i);
            installmentRepository.save(LoanInstallment.builder()
                    .loan(loan1).installmentNumber(i).dueDate(due)
                    .amount(new BigDecimal("343.33")).status("PAID")
                    .paidAt(at(due.minusDays(2)))
                    .build());
        }

        // Loan 2: 12-month loan, fully paid (18-6 months ago)
        Loan loan2 = loanRepository.save(Loan.builder()
                .borrower(alice)
                .amount(new BigDecimal("5000.00"))
                .interestRate(new BigDecimal("5.0"))
                .status("PAID")
                .startDate(LocalDate.now().minusMonths(18))
                .endDate(LocalDate.now().minusMonths(6))
                .pendingBalance(BigDecimal.ZERO)
                .build());

        for (int i = 1; i <= 12; i++) {
            LocalDate due = loan2.getStartDate().plusMonths(i);
            installmentRepository.save(LoanInstallment.builder()
                    .loan(loan2).installmentNumber(i).dueDate(due)
                    .amount(new BigDecimal("437.50")).status("PAID")
                    .paidAt(at(due.minusDays(1)))
                    .build());
        }

        // Loan 3: 3-month loan, fully paid (6-3 months ago)
        Loan loan3 = loanRepository.save(Loan.builder()
                .borrower(alice)
                .amount(new BigDecimal("1500.00"))
                .interestRate(new BigDecimal("5.0"))
                .status("PAID")
                .startDate(LocalDate.now().minusMonths(6))
                .endDate(LocalDate.now().minusMonths(3))
                .pendingBalance(BigDecimal.ZERO)
                .build());

        for (int i = 1; i <= 3; i++) {
            LocalDate due = loan3.getStartDate().plusMonths(i);
            installmentRepository.save(LoanInstallment.builder()
                    .loan(loan3).installmentNumber(i).dueDate(due)
                    .amount(new BigDecimal("512.50")).status("PAID")
                    .paidAt(at(due.minusDays(3)))
                    .build());
        }

        // Transactions — high volume for ALTO activity score
        String[] types  = {"DEPOSIT","DEPOSIT","DEPOSIT","LOAN_PAYMENT","DEPOSIT","LOAN_PAYMENT",
                            "DEPOSIT","LOAN_PAYMENT","DEPOSIT","LOAN_PAYMENT","DEPOSIT","LOAN_PAYMENT"};
        BigDecimal[] amounts = {
                bd("2000"),bd("1500"),bd("3000"),bd("343"),bd("2500"),bd("437"),
                bd("1000"),bd("512"),bd("2000"),bd("343"),bd("1500"),bd("437")
        };
        String[] descs = {
                "Depósito inicial","Ahorro mensual","Transferencia recibida",
                "Pago cuota préstamo #1","Ingreso freelance","Pago cuota préstamo #2",
                "Depósito nómina","Pago cuota préstamo #3","Depósito inversión",
                "Pago préstamo #1 cuota 2","Ingreso extra","Última cuota préstamo #2"
        };
        for (int i = 0; i < 12; i++) {
            transactionRepository.save(Transaction.builder()
                    .transactionHash(randomHash())
                    .user(alice).type(types[i]).amount(amounts[i]).description(descs[i])
                    .build());
        }

        return alice;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Bob Martínez — MEDIO trust score
    // ─────────────────────────────────────────────────────────────────────────
    private User seedBob() {
        User bob = createUser(
                "bob@trustfi.com", "Bob", "Martínez", "USER",
                "+57 315 555 0202", "Carrera 15 #85-40, Medellín",
                "0x9876543210FEDCBA9876543210FEDCBA98765432"
        );

        financialSummaryRepository.save(FinancialSummary.builder()
                .user(bob)
                .totalLoansTaken(new BigDecimal("4000.00"))
                .totalRepaid(new BigDecimal("1200.00"))
                .missedPayments(3)
                .currentDebt(new BigDecimal("2800.00"))
                .build());

        // Loan 1: 12-month active loan started 6 months ago (some overdue installments)
        Loan loan1 = loanRepository.save(Loan.builder()
                .borrower(bob)
                .amount(new BigDecimal("3000.00"))
                .interestRate(new BigDecimal("12.0"))
                .status("ACTIVE")
                .startDate(LocalDate.now().minusMonths(6))
                .endDate(LocalDate.now().plusMonths(6))
                .pendingBalance(new BigDecimal("2100.00"))
                .build());

        for (int i = 1; i <= 12; i++) {
            LocalDate due = loan1.getStartDate().plusMonths(i);
            if (i <= 3) {
                // Paid: installment 2 paid 10 days late
                OffsetDateTime paidAt = (i == 2) ? at(due.plusDays(10)) : at(due.minusDays(1));
                installmentRepository.save(LoanInstallment.builder()
                        .loan(loan1).installmentNumber(i).dueDate(due)
                        .amount(new BigDecimal("280.00")).status("PAID").paidAt(paidAt)
                        .build());
            } else {
                installmentRepository.save(LoanInstallment.builder()
                        .loan(loan1).installmentNumber(i).dueDate(due)
                        .amount(new BigDecimal("280.00")).status("PENDING")
                        .build());
            }
        }

        // Loan 2: 6-month loan, fully paid (12-6 months ago)
        Loan loan2 = loanRepository.save(Loan.builder()
                .borrower(bob)
                .amount(new BigDecimal("1000.00"))
                .interestRate(new BigDecimal("12.0"))
                .status("PAID")
                .startDate(LocalDate.now().minusMonths(12))
                .endDate(LocalDate.now().minusMonths(6))
                .pendingBalance(BigDecimal.ZERO)
                .build());

        for (int i = 1; i <= 6; i++) {
            LocalDate due = loan2.getStartDate().plusMonths(i);
            installmentRepository.save(LoanInstallment.builder()
                    .loan(loan2).installmentNumber(i).dueDate(due)
                    .amount(new BigDecimal("176.67")).status("PAID")
                    .paidAt(at(due))
                    .build());
        }

        // Transactions
        String[] types  = {"DEPOSIT","LOAN_PAYMENT","DEPOSIT","LOAN_PAYMENT","DEPOSIT","WITHDRAWAL"};
        BigDecimal[] amounts = {bd("1500"),bd("280"),bd("800"),bd("280"),bd("600"),bd("200")};
        String[] descs = {
                "Primer depósito","Pago cuota #1 préstamo activo",
                "Ahorro personal","Pago cuota #2 préstamo activo",
                "Ingreso nómina","Retiro efectivo"
        };
        for (int i = 0; i < 6; i++) {
            transactionRepository.save(Transaction.builder()
                    .transactionHash(randomHash())
                    .user(bob).type(types[i]).amount(amounts[i]).description(descs[i])
                    .build());
        }

        return bob;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Carlos Pérez — BAJO trust score (nuevo usuario con deuda pendiente)
    // ─────────────────────────────────────────────────────────────────────────
    private void seedCarlos() {
        User carlos = createUser(
                "carlos@trustfi.com", "Carlos", "Pérez", "USER",
                "+57 320 555 0303", "Avenida El Dorado #68-51, Bogotá",
                "0x1234567890ABCDEF1234567890ABCDEF12345678"
        );

        financialSummaryRepository.save(FinancialSummary.builder()
                .user(carlos)
                .totalLoansTaken(new BigDecimal("500.00"))
                .totalRepaid(BigDecimal.ZERO)
                .missedPayments(0)
                .currentDebt(new BigDecimal("500.00"))
                .build());

        // 1 pending loan (appears in the loan market for others to fund)
        loanRepository.save(Loan.builder()
                .borrower(carlos)
                .amount(new BigDecimal("500.00"))
                .interestRate(new BigDecimal("25.0"))
                .status("PENDING")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(3))
                .pendingBalance(new BigDecimal("500.00"))
                .build());

        transactionRepository.save(Transaction.builder()
                .transactionHash(randomHash())
                .user(carlos).type("DEPOSIT").amount(bd("200"))
                .description("Depósito inicial").build());

        transactionRepository.save(Transaction.builder()
                .transactionHash(randomHash())
                .user(carlos).type("DEPOSIT").amount(bd("100"))
                .description("Segundo depósito").build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    private User createUser(String email, String firstName, String lastName, String role,
                            String phone, String address, String blockchainHash) {
        User user = userRepository.save(User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("test1234"))
                .securityQuestion("¿Cuál es el nombre de tu mascota?")
                .securityAnswer(passwordEncoder.encode("firulais"))
                .role(role)
                .status("ACTIVE")
                .build());

        profileRepository.save(Profile.builder()
                .user(user)
                .fullName(firstName + " " + lastName)
                .phone(phone)
                .address(address)
                .blockchainHashId(blockchainHash)
                .build());

        return user;
    }

    private OffsetDateTime at(LocalDate date) {
        return OffsetDateTime.of(date, LocalTime.NOON, ZoneOffset.UTC);
    }

    private BigDecimal bd(String val) {
        return new BigDecimal(val);
    }

    private String randomHash() {
        return "0x" + UUID.randomUUID().toString().replace("-", "");
    }
}
