package com.example.trustengine.controller;

import com.example.trustengine.dto.LoanContractDTO;
import com.example.trustengine.service.LoanContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class LoanContractController {

    private final LoanContractService loanContractService;

    /**
     * CA1 + CA2: Devuelve los datos estructurados del contrato para previsualización.
     */
    @GetMapping("/{loanId}")
    public ResponseEntity<?> getContract(@PathVariable Long loanId) {
        try {
            LoanContractDTO contract = loanContractService.getContractData(loanId);
            return ResponseEntity.ok(contract);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error al generar el contrato: " + e.getMessage());
        }
    }

    /**
     * CA3: Descarga el contrato como documento HTML listo para imprimir/guardar como PDF.
     */
    @GetMapping("/{loanId}/download")
    public ResponseEntity<byte[]> downloadContract(@PathVariable Long loanId) {
        try {
            byte[] html = loanContractService.generateHtml(loanId);
            String filename = "contrato-prestamo-" + loanId + ".html";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(new MediaType("text", "html",
                            java.nio.charset.StandardCharsets.UTF_8))
                    .body(html);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
