package com.example.trustengine.service;

import com.example.trustengine.dto.PublicProfileResponse;
import com.example.trustengine.dto.TrustScoreResponseDTO;
import com.example.trustengine.entity.Profile;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.LoanInstallmentRepository;
import com.example.trustengine.repository.LoanRepository;
import com.example.trustengine.repository.ProfileRepository;
import com.example.trustengine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PublicProfileService {

    private final UserRepository          userRepository;
    private final ProfileRepository       profileRepository;
    private final LoanRepository          loanRepository;
    private final LoanInstallmentRepository installmentRepository;
    private final TrustScoreService       trustScoreService;

    /**
     * CA1 + CA2 + CA3: Devuelve el perfil público de un usuario.
     * - CA1: Trust Score recalculado en tiempo real.
     * - CA2: Resumen de pagos calculado directamente desde loans e installments.
     * - CA3: No expone email, contraseña, documentos ni dirección.
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

        // CA1: Trust Score en tiempo real (recalculado con datos actuales de la DB)
        TrustScoreResponseDTO scoreDTO = trustScoreService.getTrustScoreByUserId(userId);

        // CA2: Resumen calculado desde las tablas loans y loan_installments (100 % real-time)
        BigDecimal totalLoansTaken = loanRepository.sumLoanAmountByBorrower(userId);
        BigDecimal totalRepaid     = installmentRepository.sumPaidAmountByBorrower(userId);
        long       missedLong      = installmentRepository.countOverdueByBorrower(userId, LocalDate.now());
        BigDecimal pendingBalance  = loanRepository.sumPendingBalanceByBorrower(userId);

        return new PublicProfileResponse(
                userId,
                displayName,
                scoreDTO.getScoreValue(),
                scoreDTO.getLevel(),
                scoreDTO.getLevelDescription(),
                totalLoansTaken,
                totalRepaid,
                (int) missedLong,
                pendingBalance,
                blocked,
                scoreDTO.getCalculationDate()
        );
    }
}
