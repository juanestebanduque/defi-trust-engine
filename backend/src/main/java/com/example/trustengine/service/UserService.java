package com.example.trustengine.service;

import com.example.trustengine.dto.AuthResponse;
import com.example.trustengine.dto.ForgotPasswordRequest;
import com.example.trustengine.dto.LoginRequest;
import com.example.trustengine.dto.RegisterRequest;
import com.example.trustengine.dto.UpdateProfileRequest;
import com.example.trustengine.dto.UserProfileResponse;
import com.example.trustengine.entity.FinancialSummary;
import com.example.trustengine.entity.Profile;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.FinancialSummaryRepository;
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
    private final FinancialSummaryRepository financialSummaryRepository;
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
        return new AuthResponse(user.getId(), token, user.getEmail(), user.getRole());
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
                user.setLockoutTime(OffsetDateTime.now().plusMinutes(5));
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
        return new AuthResponse(user.getId(), token, user.getEmail(), user.getRole());
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

    /** Actualiza los datos del perfil y del usuario. */
    @Transactional
    public void updateUserProfile(Long userId, UpdateProfileRequest request) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Perfil no encontrado para el usuario."));

        if (request.getFirstName() != null && request.getLastName() != null) {
            profile.setFullName(request.getFirstName() + " " + request.getLastName());
        } else if (request.getFirstName() != null) {
            // Keep last name if only first name is provided
            String currentLastName = profile.getFullName().contains(" ") ? profile.getFullName().substring(profile.getFullName().lastIndexOf(" ") + 1) : "";
            profile.setFullName(request.getFirstName() + " " + currentLastName);
        } else if (request.getLastName() != null) {
            // Keep first name if only last name is provided
            String currentFirstName = profile.getFullName().contains(" ") ? profile.getFullName().substring(0, profile.getFullName().indexOf(" ")) : profile.getFullName();
            profile.setFullName(currentFirstName + " " + request.getLastName());
        }

        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getAddress() != null) profile.setAddress(request.getAddress());
        if (request.getBlockchainHashId() != null) profile.setBlockchainHashId(request.getBlockchainHashId());

        profileRepository.save(profile);
    }

    /** Obtiene los datos del usuario a partir de un token JWT. */
    public AuthResponse getUserByToken(String token) {
        if (!jwtService.isTokenValid(token)) {
            throw new IllegalArgumentException("Token inválido o expirado.");
        }
        String email = jwtService.extractSubject(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        
        return new AuthResponse(user.getId(), token, user.getEmail(), user.getRole());
    }

    /** Devuelve el perfil completo del usuario autenticado: cuenta + perfil + resumen financiero. */
    public UserProfileResponse getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        Profile profile = profileRepository.findByUserId(user.getId()).orElse(null);

        FinancialSummary fs = financialSummaryRepository.findByUserId(user.getId()).orElse(null);

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .fullName(profile != null ? profile.getFullName() : null)
                .phone(profile != null ? profile.getPhone() : null)
                .address(profile != null ? profile.getAddress() : null)
                .blockchainHashId(profile != null ? profile.getBlockchainHashId() : null)
                .totalLoansTaken(fs != null ? fs.getTotalLoansTaken() : java.math.BigDecimal.ZERO)
                .totalRepaid(fs != null ? fs.getTotalRepaid() : java.math.BigDecimal.ZERO)
                .missedPayments(fs != null ? fs.getMissedPayments() : 0)
                .currentDebt(fs != null ? fs.getCurrentDebt() : java.math.BigDecimal.ZERO)
                .build();
    }
}
