package com.example.trustengine.controller;

import com.example.trustengine.dto.AuthResponse;
import com.example.trustengine.dto.ForgotPasswordRequest;
import com.example.trustengine.dto.LoginRequest;
import com.example.trustengine.dto.RegisterRequest;
import com.example.trustengine.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.registerUser(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.authenticate(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        userService.resetPassword(request);
        return ResponseEntity.ok("Contraseña restablecida exitosamente.");
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getMe(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Token inválido o ausente. Asegúrate de enviarlo como 'Bearer <token>' en el header Authorization.");
        }
        String token = authHeader.substring(7);
        return ResponseEntity.ok(userService.getUserByToken(token));
    }
}
