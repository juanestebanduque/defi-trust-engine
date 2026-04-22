package com.example.trustengine.controller;

import com.example.trustengine.dto.LoanRequestDTO;
import com.example.trustengine.entity.Loan;
import com.example.trustengine.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping("/request")
    public ResponseEntity<?> requestLoan(@RequestBody LoanRequestDTO request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Usuario no autenticado");
        }
        
        try {
            Loan loan = loanService.requestLoan(request, principal.getName());
            return ResponseEntity.ok(loan);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al procesar la solicitud: " + e.getMessage());
        }
    }
}
