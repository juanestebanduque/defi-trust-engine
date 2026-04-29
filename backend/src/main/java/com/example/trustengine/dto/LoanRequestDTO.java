package com.example.trustengine.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanRequestDTO {
    private Long loanId;
    private Long borrowerId;
    private String borrowerEmail;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "100", message = "El monto mínimo es 100")
    private BigDecimal amount;

    @NotNull(message = "El plazo en meses es obligatorio")
    @Min(value = 1, message = "El plazo debe ser al menos 1 mes")
    @Max(value = 60, message = "El plazo máximo es 60 meses")
    private Integer termMonths;

    private BigDecimal interestRate;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal trustScore;
    private boolean saved;
    private OffsetDateTime createdAt;
}
