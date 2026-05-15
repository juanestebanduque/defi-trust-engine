package com.example.trustengine.service;

import com.example.trustengine.dto.PublicProfileResponse;
import com.example.trustengine.dto.TrustScoreResponseDTO;
import com.example.trustengine.entity.FinancialSummary;
import com.example.trustengine.entity.Profile;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.FinancialSummaryRepository;
import com.example.trustengine.repository.ProfileRepository;
import com.example.trustengine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PublicProfileService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final FinancialSummaryRepository financialSummaryRepository;
    private final TrustScoreService trustScoreService;

    /**
     * CA1 + CA2 + CA3: Devuelve el perfil público de un usuario.
     * No expone email, contraseña, documentos ni dirección.
     */
    @Transactional(readOnly = true)
    public PublicProfileResponse getPublicProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + userId));

        boolean blocked = "BLOCKED".equalsIgnoreCase(user.getStatus());

        // CA3: nombre de pantalla (no email, no documento)
        Profile profile = profileRepository.findByUserId(userId).orElse(null);
        String displayName = (profile != null && profile.getFullName() != null && !profile.getFullName().isBlank())
                ? profile.getFullName()
                : "Usuario #" + userId;

        // CA1: Trust Score en tiempo real (recalculado)
        TrustScoreResponseDTO scoreDTO = trustScoreService.getTrustScoreByUserId(userId);

        // CA2: Resumen de historial de pagos
        FinancialSummary fs = financialSummaryRepository.findByUserId(userId).orElse(null);

        return new PublicProfileResponse(
                userId,
                displayName,
                scoreDTO.getScoreValue(),
                scoreDTO.getLevel(),
                scoreDTO.getLevelDescription(),
                fs != null ? fs.getTotalLoansTaken() : BigDecimal.ZERO,
                fs != null ? fs.getTotalRepaid()      : BigDecimal.ZERO,
                fs != null ? fs.getMissedPayments()   : 0,
                fs != null ? fs.getCurrentDebt()      : BigDecimal.ZERO,
                blocked,
                scoreDTO.getCalculationDate()
        );
    }
}
