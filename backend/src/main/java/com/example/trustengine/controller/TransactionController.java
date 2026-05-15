package com.example.trustengine.controller;

import com.example.trustengine.dto.TransactionRequest;
import com.example.trustengine.dto.TransactionResponse;
import com.example.trustengine.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Tag(name = "Transacciones", description = "Historial y registro de transacciones del usuario")
public class TransactionController {

    private final TransactionService transactionService;

    @Operation(summary = "Registrar transacción", description = "Crea una nueva transacción para el usuario indicado")
    @PostMapping
    public ResponseEntity<TransactionResponse> register(@RequestBody TransactionRequest request) {
        TransactionResponse response = transactionService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Buscar por hash", description = "Retorna una transacción dado su hash SHA-256")
    @GetMapping("/{hash}")
    public ResponseEntity<TransactionResponse> getByHash(@PathVariable String hash) {
        return ResponseEntity.ok(transactionService.getByHash(hash));
    }

    @Operation(summary = "Transacciones del usuario (interno)", description = "Lista transacciones por userId sin paginación")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TransactionResponse>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getByUserId(userId));
    }

    @Operation(
        summary = "Historial paginado del usuario autenticado",
        description = "CA1 + CA2: Lista todas las transacciones del usuario en sesión, ordenadas cronológicamente (más reciente primero), con paginación.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Página de transacciones"),
            @ApiResponse(responseCode = "401", description = "No autenticado")
        }
    )
    @GetMapping("/me")
    public ResponseEntity<?> getMyTransactions(
            Principal principal,
            @Parameter(description = "Número de página (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "10") int size) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no autenticado");
        }
        Page<TransactionResponse> result = transactionService.getMyTransactions(principal.getName(), page, size);
        return ResponseEntity.ok(result);
    }

    @Operation(
        summary = "Detalle de transacción por ID",
        description = "CA3: Retorna el detalle completo de una transacción. Solo el dueño puede consultarla.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Detalle de la transacción"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Acceso denegado"),
            @ApiResponse(responseCode = "404", description = "Transacción no encontrada")
        }
    )
    @GetMapping("/me/{id}")
    public ResponseEntity<?> getMyTransactionById(Principal principal, @PathVariable Long id) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no autenticado");
        }
        try {
            TransactionResponse response = transactionService.getByIdForOwner(id, principal.getName());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping
    public ResponseEntity<Void> update() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build();
    }

    @PatchMapping
    public ResponseEntity<Void> patch() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build();
    }
}
