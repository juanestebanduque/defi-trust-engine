package com.example.trustengine.service;

import com.example.trustengine.dto.AdminUserDTO;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.FinancialSummaryRepository;
import com.example.trustengine.repository.ProfileRepository;
import com.example.trustengine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final FinancialSummaryRepository financialSummaryRepository;
    private final TrustScoreService trustScoreService;

    /** CA1: Lista todos los usuarios registrados con su perfil y métricas. */
    public List<AdminUserDTO> listAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toAdminDTO)
                .collect(Collectors.toList());
    }

    /** CA2: Bloquea una cuenta de usuario. No se puede bloquear a un administrador. */
    @Transactional
    public AdminUserDTO blockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if ("ADMIN".equals(user.getRole())) {
            throw new IllegalArgumentException("No se puede bloquear a un administrador.");
        }
        if ("BLOCKED".equals(user.getStatus())) {
            throw new IllegalArgumentException("El usuario ya está bloqueado.");
        }

        user.setStatus("BLOCKED");
        return toAdminDTO(userRepository.save(user));
    }

    /** CA3: Activa una cuenta de usuario bloqueada. */
    @Transactional
    public AdminUserDTO activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if ("ACTIVE".equals(user.getStatus())) {
            throw new IllegalArgumentException("El usuario ya está activo.");
        }

        user.setStatus("ACTIVE");
        user.setFailedLoginAttempts(0);
        user.setLockoutTime(null);
        return toAdminDTO(userRepository.save(user));
    }

    private AdminUserDTO toAdminDTO(User user) {
        var profile = profileRepository.findByUserId(user.getId()).orElse(null);
        var fs      = financialSummaryRepository.findByUserId(user.getId()).orElse(null);
        BigDecimal score = trustScoreService.getLatestScore(user.getId());
        String level = trustScoreService.determineLevel(
                score.compareTo(BigDecimal.ZERO) == 0 ? new BigDecimal("50") : score);

        return AdminUserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .fullName(profile != null ? profile.getFullName() : "—")
                .phone(profile != null && profile.getPhone() != null ? profile.getPhone() : "—")
                .address(profile != null && profile.getAddress() != null ? profile.getAddress() : "—")
                .totalLoansTaken(fs != null ? fs.getTotalLoansTaken() : BigDecimal.ZERO)
                .totalRepaid(fs != null ? fs.getTotalRepaid() : BigDecimal.ZERO)
                .currentDebt(fs != null ? fs.getCurrentDebt() : BigDecimal.ZERO)
                .missedPayments(fs != null ? fs.getMissedPayments() : 0)
                .trustScore(score)
                .trustLevel(level)
                .build();
    }
}
