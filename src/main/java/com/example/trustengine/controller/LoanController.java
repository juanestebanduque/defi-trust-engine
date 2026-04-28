package com.example.trustengine.controller;

import com.example.trustengine.dto.LoanRequestDTO;
import com.example.trustengine.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    /** CA1 + CA2 + CA3: Solicitar un préstamo con validación, registro y estado PENDING. */
    @PostMapping("/request")
    public ResponseEntity<?> requestLoan(@Valid @RequestBody LoanRequestDTO request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Usuario no autenticado");
        }

        try {
            LoanRequestDTO loan = loanService.requestLoan(request, principal.getName());
            return ResponseEntity.ok(loan);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al procesar la solicitud: " + e.getMessage());
        }
    }

    /** CA3: Listar préstamos del usuario autenticado (incluye los PENDING). */
    @GetMapping("/me")
    public ResponseEntity<?> getMyLoans(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Usuario no autenticado");
        }

        try {
            List<LoanRequestDTO> loans = loanService.getMyLoans(principal.getName());
            return ResponseEntity.ok(loans);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al consultar préstamos: " + e.getMessage());
        }
    }
}
