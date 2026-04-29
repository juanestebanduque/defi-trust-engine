package com.example.trustengine.controller;

import com.example.trustengine.dto.LoanRequestDTO;
import com.example.trustengine.service.LoanRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/loan-requests")
@RequiredArgsConstructor
public class LoanRequestController {

    private final LoanRequestService loanRequestService;

    /**
     * CA1 + CA2 + CA3: Lista solicitudes de préstamo disponibles.
     *
     * Parámetros opcionales para filtrar (CA3):
     *   lenderId      - ID del prestamista (para marcar las ya guardadas)
     *   minAmount     - monto mínimo
     *   maxAmount     - monto máximo
     *   minTrustScore - Trust Score mínimo del prestatario
     *   maxTrustScore - Trust Score máximo del prestatario
     */
    @GetMapping
    public ResponseEntity<List<LoanRequestDTO>> getAvailableRequests(
            @RequestParam(required = false) Long lenderId,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) BigDecimal minTrustScore,
            @RequestParam(required = false) BigDecimal maxTrustScore
    ) {
        List<LoanRequestDTO> requests = loanRequestService.getAvailableRequests(
                minAmount, maxAmount, minTrustScore, maxTrustScore, lenderId
        );
        return ResponseEntity.ok(requests);
    }

    /**
     * CA4 (GET): Lista las solicitudes guardadas por el prestamista.
     */
    @GetMapping("/saved")
    public ResponseEntity<List<LoanRequestDTO>> getSavedRequests(
            @RequestParam Long lenderId
    ) {
        return ResponseEntity.ok(loanRequestService.getSavedRequests(lenderId));
    }

    /**
     * CA4 (POST): Guarda una solicitud en la lista del prestamista.
     */
    @PostMapping("/{loanId}/save")
    public ResponseEntity<LoanRequestDTO> saveLoanRequest(
            @PathVariable Long loanId,
            @RequestParam Long lenderId
    ) {
        LoanRequestDTO saved = loanRequestService.saveLoanRequest(lenderId, loanId);
        return ResponseEntity.ok(saved);
    }

    /**
     * CA5: Elimina una solicitud de la vista del prestamista.
     */
    @DeleteMapping("/{loanId}/save")
    public ResponseEntity<Void> removeSavedLoanRequest(
            @PathVariable Long loanId,
            @RequestParam Long lenderId
    ) {
        loanRequestService.removeSavedLoanRequest(lenderId, loanId);
        return ResponseEntity.noContent().build();
    }

    /**
     * HU-12: El prestamista acepta una solicitud de préstamo PENDING.
     * CA1: Cambia estado a ACTIVE.
     * CA2: Notifica al prestatario vía transacción LOAN_RECEIPT.
     * CA3: Registra transacción LOAN_FUNDING para el prestamista.
     */
    @PostMapping("/{loanId}/accept")
    public ResponseEntity<LoanRequestDTO> acceptLoanRequest(
            @PathVariable Long loanId,
            @RequestParam Long lenderId
    ) {
        LoanRequestDTO result = loanRequestService.acceptLoanRequest(loanId, lenderId);
        return ResponseEntity.ok(result);
    }
}
