package com.example.trustengine.controller;

import com.example.trustengine.dto.AdminUserDTO;
import com.example.trustengine.dto.PenaltyRunResult;
import com.example.trustengine.service.AdminService;
import com.example.trustengine.service.OverduePaymentScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final OverduePaymentScheduler overduePaymentScheduler;

    /** CA1: Lista todos los usuarios de la plataforma. */
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDTO>> listUsers() {
        return ResponseEntity.ok(adminService.listAllUsers());
    }

    /** CA2: Bloquea el acceso de un usuario a la plataforma. */
    @PutMapping("/users/{userId}/block")
    public ResponseEntity<?> blockUser(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(adminService.blockUser(userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** CA3: Reactiva la cuenta de un usuario bloqueado. */
    @PutMapping("/users/{userId}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(adminService.activateUser(userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Disparo manual del proceso de penalización (útil para pruebas).
     * En producción el scheduler lo ejecuta automáticamente cada medianoche.
     */
    @PostMapping("/penalties/run")
    public ResponseEntity<PenaltyRunResult> runPenalties() {
        return ResponseEntity.ok(overduePaymentScheduler.detectAndPenalize());
    }
}
