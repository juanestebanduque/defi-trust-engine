package com.example.trustengine.service;

import com.example.trustengine.dto.LoanContractDTO;
import com.example.trustengine.entity.*;
import com.example.trustengine.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class LoanContractService {

    private final LoanRepository loanRepository;
    private final ProfileRepository profileRepository;
    private final LoanInstallmentRepository installmentRepository;

    /** CA1 + CA2: Reúne todos los datos del préstamo para el contrato. */
    public LoanContractDTO getContractData(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Préstamo no encontrado"));

        // Borrower info
        User borrower = loan.getBorrower();
        Profile bp = profileRepository.findByUserId(borrower.getId()).orElse(null);
        String borrowerName         = bp != null && bp.getFullName()       != null ? bp.getFullName()       : borrower.getEmail();
        String borrowerAddress      = bp != null && bp.getAddress()        != null ? bp.getAddress()        : "—";
        String borrowerPhone        = bp != null && bp.getPhone()          != null ? bp.getPhone()          : "—";
        String borrowerBlockchainId = bp != null && bp.getBlockchainHashId()!= null? bp.getBlockchainHashId(): "—";

        // Lender info (present once loan is ACTIVE or PAID)
        String lenderName  = null;
        String lenderEmail = null;
        if (loan.getLender() != null) {
            User lender = loan.getLender();
            Profile lp = profileRepository.findByUserId(lender.getId()).orElse(null);
            lenderName  = lp != null && lp.getFullName() != null ? lp.getFullName() : lender.getEmail();
            lenderEmail = lender.getEmail();
        }

        // Term in months derived from start/end dates
        int termMonths = (int) ChronoUnit.MONTHS.between(loan.getStartDate(), loan.getEndDate());
        if (termMonths <= 0) termMonths = 1;

        BigDecimal monthlyPayment = calculateMonthlyPayment(loan.getAmount(), loan.getInterestRate(), termMonths);
        BigDecimal totalPayment   = monthlyPayment.multiply(BigDecimal.valueOf(termMonths))
                .setScale(2, RoundingMode.HALF_UP);

        // Installment schedule — real if available, projected otherwise
        List<LoanInstallment> raw = installmentRepository.findByLoanIdOrderByInstallmentNumberAsc(loanId);
        List<LoanContractDTO.InstallmentDetail> installments = raw.isEmpty()
                ? projectedSchedule(loan.getStartDate(), termMonths, monthlyPayment)
                : raw.stream()
                        .map(i -> LoanContractDTO.InstallmentDetail.builder()
                                .number(i.getInstallmentNumber())
                                .dueDate(i.getDueDate())
                                .amount(i.getAmount())
                                .status(i.getStatus())
                                .paidAt(i.getPaidAt() != null ? i.getPaidAt().toLocalDate() : null)
                                .build())
                        .collect(Collectors.toList());

        return LoanContractDTO.builder()
                .loanId(loanId)
                .contractNumber("TFI-" + loanId + "-" + loan.getStartDate().getYear())
                .generatedAt(LocalDate.now())
                .status(loan.getStatus())
                .borrowerName(borrowerName)
                .borrowerEmail(borrower.getEmail())
                .borrowerAddress(borrowerAddress)
                .borrowerPhone(borrowerPhone)
                .borrowerBlockchainId(borrowerBlockchainId)
                .lenderName(lenderName)
                .lenderEmail(lenderEmail)
                .amount(loan.getAmount())
                .interestRate(loan.getInterestRate())
                .termMonths(termMonths)
                .startDate(loan.getStartDate())
                .endDate(loan.getEndDate())
                .monthlyPayment(monthlyPayment)
                .totalPayment(totalPayment)
                .pendingBalance(loan.getPendingBalance())
                .installments(installments)
                .build();
    }

    /** CA3: Genera el documento HTML listo para descarga. */
    public byte[] generateHtml(Long loanId) {
        return buildHtml(getContractData(loanId)).getBytes(StandardCharsets.UTF_8);
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    /** Standard amortization: M = P·r·(1+r)^n / ((1+r)^n − 1). Zero-rate uses M = P/n. */
    BigDecimal calculateMonthlyPayment(BigDecimal principal, BigDecimal annualRate, int months) {
        if (annualRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
        }
        double r = annualRate.doubleValue() / 100.0 / 12.0;
        double pow = Math.pow(1 + r, months);
        double payment = principal.doubleValue() * r * pow / (pow - 1);
        return BigDecimal.valueOf(payment).setScale(2, RoundingMode.HALF_UP);
    }

    private List<LoanContractDTO.InstallmentDetail> projectedSchedule(
            LocalDate startDate, int termMonths, BigDecimal monthly) {
        return IntStream.rangeClosed(1, termMonths)
                .mapToObj(i -> LoanContractDTO.InstallmentDetail.builder()
                        .number(i)
                        .dueDate(startDate.plusMonths(i))
                        .amount(monthly)
                        .status("PROJECTED")
                        .build())
                .collect(Collectors.toList());
    }

    // ── HTML generation ──────────────────────────────────────────────────────

    private String buildHtml(LoanContractDTO d) {
        String statusLabel = switch (d.getStatus()) {
            case "ACTIVE"  -> "ACTIVO";
            case "PAID"    -> "CANCELADO";
            case "PENDING" -> "PENDIENTE";
            case "DEFAULT" -> "INCUMPLIMIENTO";
            default        -> d.getStatus();
        };

        String lenderBlock = d.getLenderName() != null
                ? "<p><strong>Nombre:</strong> " + esc(d.getLenderName()) + "</p>"
                  + "<p><strong>Email:</strong> " + esc(d.getLenderEmail()) + "</p>"
                : "<p><em>Prestamista pendiente de asignación</em></p>";

        StringBuilder rows = new StringBuilder();
        for (LoanContractDTO.InstallmentDetail i : d.getInstallments()) {
            String statusCell = switch (i.getStatus()) {
                case "PAID"      -> "<td style='color:#16a34a;font-weight:600'>Pagada"
                                    + (i.getPaidAt() != null ? " (" + i.getPaidAt() + ")" : "") + "</td>";
                case "PROJECTED" -> "<td style='color:#6b7280;font-style:italic'>Proyectada</td>";
                default          -> "<td style='color:#d97706;font-weight:600'>Pendiente</td>";
            };
            rows.append("<tr>")
                .append("<td>").append(i.getNumber()).append("</td>")
                .append("<td>").append(i.getDueDate()).append("</td>")
                .append("<td>$").append(i.getAmount()).append("</td>")
                .append(statusCell)
                .append("</tr>");
        }

        return """
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Contrato – TrustFi #%s</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;background:#f9fafb;padding:40px 20px}
    .page{max-width:800px;margin:0 auto;background:#fff;border-radius:12px;padding:48px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .header{text-align:center;border-bottom:3px solid #2563eb;padding-bottom:24px;margin-bottom:28px}
    .logo{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:10px}
    .logo-icon{width:46px;height:46px;background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:800}
    h1{font-size:22px;color:#111827;font-weight:700;margin-top:4px}
    .meta{display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:center;background:#f1f5f9;padding:10px 16px;border-radius:8px;margin-bottom:24px;font-size:13px;color:#64748b}
    .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700;background:#dbeafe;color:#1d4ed8}
    h2{font-size:15px;color:#2563eb;font-weight:700;border-left:4px solid #2563eb;padding-left:10px;margin:24px 0 12px}
    .parties{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .pbox{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px}
    .pbox h3{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:9px}
    .pbox p{font-size:13px;margin-bottom:4px;color:#374151}
    .cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .citem{border-radius:8px;padding:13px;text-align:center;border:1px solid #e2e8f0}
    .ci-blue{background:#eff6ff;border-color:#bfdbfe}
    .ci-green{background:#f0fdf4;border-color:#bbf7d0}
    .clabel{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
    .cval{font-size:17px;font-weight:700;color:#111827}
    .csub{font-size:10px;color:#6b7280;margin-top:2px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{background:#f1f5f9;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.04em}
    td{padding:8px 12px;border-bottom:1px solid #f1f5f9}
    tr:last-child td{border-bottom:none}
    .clauses{background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:13px;color:#4b5563;line-height:1.65}
    .clauses p{margin-bottom:8px}
    .sigs{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:36px}
    .sig{border-top:2px solid #374151;padding-top:10px}
    .siglabel{font-size:11px;color:#6b7280}
    .signame{font-size:14px;font-weight:600;color:#111827;margin-top:3px}
    .footer{text-align:center;margin-top:28px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:14px}
    @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0;padding:32px}}
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">
      <div class="logo-icon">T</div>
      <div>
        <div style="font-size:20px;font-weight:800;color:#111827">TrustFi</div>
        <div style="font-size:11px;color:#6b7280">Plataforma DeFi de Préstamos P2P</div>
      </div>
    </div>
    <h1>CONTRATO DE PRÉSTAMO DIGITAL</h1>
    <div style="margin-top:5px;color:#6b7280;font-size:12px">Acuerdo vinculante entre las partes</div>
  </div>

  <div class="meta">
    <span><strong>Contrato N°:</strong> %s</span>
    <span><strong>Préstamo ID:</strong> #%d</span>
    <span><strong>Generado:</strong> %s</span>
    <span class="badge">%s</span>
  </div>

  <h2>1. Partes del Contrato</h2>
  <div class="parties">
    <div class="pbox">
      <h3>Prestatario (Solicitante)</h3>
      <p><strong>Nombre:</strong> %s</p>
      <p><strong>Email:</strong> %s</p>
      <p><strong>Teléfono:</strong> %s</p>
      <p><strong>Dirección:</strong> %s</p>
      <p><strong>Blockchain ID:</strong><br/><span style="font-size:11px;word-break:break-all;color:#2563eb">%s</span></p>
    </div>
    <div class="pbox">
      <h3>Prestamista (Financiador)</h3>
      %s
    </div>
  </div>

  <h2>2. Condiciones Pactadas</h2>
  <div class="cgrid">
    <div class="citem ci-blue">
      <div class="clabel">Monto del Préstamo</div>
      <div class="cval">$%s</div>
      <div class="csub">USD</div>
    </div>
    <div class="citem ci-green">
      <div class="clabel">Tasa de Interés</div>
      <div class="cval">%s%%</div>
      <div class="csub">Anual nominal</div>
    </div>
    <div class="citem">
      <div class="clabel">Plazo</div>
      <div class="cval">%d meses</div>
      <div class="csub">%s → %s</div>
    </div>
    <div class="citem ci-blue">
      <div class="clabel">Cuota Mensual</div>
      <div class="cval">$%s</div>
      <div class="csub">Pago fijo mensual</div>
    </div>
    <div class="citem">
      <div class="clabel">Total a Pagar</div>
      <div class="cval">$%s</div>
      <div class="csub">Capital + intereses</div>
    </div>
    <div class="citem">
      <div class="clabel">Saldo Pendiente</div>
      <div class="cval">$%s</div>
      <div class="csub">Al momento de emisión</div>
    </div>
  </div>

  <h2>3. Calendario de Pagos</h2>
  <table>
    <thead><tr><th>#</th><th>Vencimiento</th><th>Monto</th><th>Estado</th></tr></thead>
    <tbody>%s</tbody>
  </table>

  <h2>4. Términos y Condiciones</h2>
  <div class="clauses">
    <p><strong>4.1 Obligaciones del Prestatario:</strong> El prestatario se compromete a realizar los pagos en las fechas establecidas. El incumplimiento afectará negativamente su Trust Score en TrustFi.</p>
    <p><strong>4.2 Intereses por Mora:</strong> Los pagos con retraso generarán penalizaciones en el puntaje de reputación según los algoritmos de la plataforma.</p>
    <p><strong>4.3 Prepago:</strong> El prestatario podrá realizar pagos anticipados sin penalización, reduciendo el saldo pendiente y mejorando su perfil crediticio.</p>
    <p><strong>4.4 Validez:</strong> Este contrato digital tiene validez completa entre las partes y está respaldado por el registro de la plataforma TrustFi.</p>
    <p><strong>4.5 Jurisdicción:</strong> Cualquier controversia será resuelta mediante los mecanismos de resolución de la plataforma TrustFi.</p>
  </div>

  <div class="sigs">
    <div class="sig">
      <div class="siglabel">Firma del Prestatario</div>
      <div class="signame">%s</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:2px">%s</div>
    </div>
    <div class="sig">
      <div class="siglabel">Firma del Prestamista</div>
      <div class="signame">%s</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:2px">%s</div>
    </div>
  </div>

  <div class="footer">
    Documento generado por TrustFi DeFi Platform · Contrato N° %s · %s<br/>
    Este documento tiene carácter de contrato digital vinculante entre las partes.
  </div>
</div>
</body>
</html>
""".formatted(
                d.getContractNumber(),
                // meta
                d.getContractNumber(), d.getLoanId(), d.getGeneratedAt(), statusLabel,
                // borrower
                esc(d.getBorrowerName()), esc(d.getBorrowerEmail()),
                esc(d.getBorrowerPhone()), esc(d.getBorrowerAddress()), esc(d.getBorrowerBlockchainId()),
                // lender block
                lenderBlock,
                // conditions
                d.getAmount().toPlainString(),
                d.getInterestRate().toPlainString(),
                d.getTermMonths(), d.getStartDate(), d.getEndDate(),
                d.getMonthlyPayment().toPlainString(),
                d.getTotalPayment().toPlainString(),
                d.getPendingBalance().toPlainString(),
                // schedule rows
                rows.toString(),
                // signatures
                esc(d.getBorrowerName()), esc(d.getBorrowerEmail()),
                d.getLenderName()  != null ? esc(d.getLenderName())  : "Por asignar",
                d.getLenderEmail() != null ? esc(d.getLenderEmail()) : "—",
                // footer
                d.getContractNumber(), d.getGeneratedAt()
        );
    }

    private static String esc(String s) {
        if (s == null) return "—";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
