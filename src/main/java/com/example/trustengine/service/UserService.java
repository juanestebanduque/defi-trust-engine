package com.example.trustengine.service;

import com.example.trustengine.dto.AuthResponse;
import com.example.trustengine.dto.ForgotPasswordRequest;
import com.example.trustengine.dto.LoginRequest;
import com.example.trustengine.dto.RegisterRequest;
import com.example.trustengine.entity.Profile;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.ProfileRepository;
import com.example.trustengine.repository.UserRepository;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /** Registra un nuevo usuario en la base de datos. */
    @Transactional
    public AuthResponse registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El correo ya está registrado.");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .securityQuestion(request.getSecurityQuestion())
                .securityAnswer(passwordEncoder.encode(request.getSecurityAnswer()))
                .role(request.getRole() != null ? request.getRole() : "USER")
                .status("ACTIVE")
                .build();

        user = userRepository.save(user);

        Profile profile = Profile.builder()
                .user(user)
                .fullName(request.getFirstName() + " " + request.getLastName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .blockchainHashId(request.getBlockchainHashId())
                .build();

        profileRepository.save(profile);

        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getRole());
    }

    /** Autentica al usuario y devuelve un token JWT. */
    @Transactional
    public AuthResponse authenticate(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas."));

        if (user.getLockoutTime() != null && user.getLockoutTime().isAfter(OffsetDateTime.now())) {
            throw new IllegalArgumentException("Tu cuenta está temporalmente bloqueada. Intenta de nuevo más tarde.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= 3) {
                user.setLockoutTime(OffsetDateTime.now().plusMinutes(15));
                userRepository.save(user);
                throw new IllegalArgumentException("Cuenta bloqueada temporalmente por múltiples intentos fallidos.");
            }
            userRepository.save(user);
            throw new IllegalArgumentException("Credenciales inválidas. Intentos fallidos: " + user.getFailedLoginAttempts());
        }

        user.setFailedLoginAttempts(0);
        user.setLockoutTime(null);
        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getRole());
    }

    /** Restablece la contraseña si la respuesta de seguridad es correcta. */
    @Transactional
    public void resetPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Correo no encontrado."));

        if (!passwordEncoder.matches(request.getSecurityAnswer(), user.getSecurityAnswer())) {
            throw new IllegalArgumentException("La respuesta de seguridad es incorrecta.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
