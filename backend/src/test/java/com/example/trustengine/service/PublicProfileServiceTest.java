package com.example.trustengine.service;

import com.example.trustengine.dto.PublicProfileResponse;
import com.example.trustengine.dto.TrustScoreResponseDTO;
import com.example.trustengine.entity.FinancialSummary;
import com.example.trustengine.entity.Profile;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.FinancialSummaryRepository;
import com.example.trustengine.repository.ProfileRepository;
import com.example.trustengine.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PublicProfileServiceTest {

    @Mock private UserRepository         userRepository;
    @Mock private ProfileRepository      profileRepository;
    @Mock private FinancialSummaryRepository financialSummaryRepository;
    @Mock private TrustScoreService      trustScoreService;

    @InjectMocks
    private PublicProfileService publicProfileService;

    private User           activeUser;
    private User           blockedUser;
    private Profile        profile;
    private FinancialSummary financialSummary;
    private TrustScoreResponseDTO scoreDTO;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .id(1L)
                .email("alice@trustfi.com")
                .passwordHash("$2a$hash")
                .securityQuestion("¿Mascota?")
                .securityAnswer("$2a$hashAnswer")
                .role("USER")
                .status("ACTIVE")
                .build();

        blockedUser = User.builder()
                .id(2L)
                .email("blocked@trustfi.com")
                .passwordHash("$2a$hash2")
                .securityQuestion("?")
                .securityAnswer("$2a$ans2")
                .role("USER")
                .status("BLOCKED")
                .build();

        profile = Profile.builder()
                .id(10L)
                .user(activeUser)
                .fullName("Alice Martínez")
                .phone("+57 300 000 0001")
                .address("Calle Falsa 123")
                .blockchainHashId("0xABC123")
                .build();

        financialSummary = FinancialSummary.builder()
                .id(5L)
                .user(activeUser)
                .totalLoansTaken(new BigDecimal("5000.00"))
                .totalRepaid(new BigDecimal("4500.00"))
                .missedPayments(1)
                .currentDebt(new BigDecimal("500.00"))
                .build();

        scoreDTO = TrustScoreResponseDTO.builder()
                .scoreValue(new BigDecimal("75.00"))
                .level("ALTO")
                .levelDescription("Excelente reputación financiera. Acceso a mejores tasas de interés.")
                .calculationDate(LocalDate.of(2026, 5, 15))
                .punctualityScore(new BigDecimal("80.00"))
                .activityScore(new BigDecimal("70.00"))
                .stabilityScore(new BigDecimal("72.00"))
                .build();
    }

    // ── CA1: Trust Score visible en perfil público ────────────────────────────

    @Test
    void getPublicProfile_returnsTrustScoreAndLevel() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.of(financialSummary));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        assertThat(result.trustScore()).isEqualByComparingTo("75.00");
        assertThat(result.level()).isEqualTo("ALTO");
        assertThat(result.levelDescription()).contains("Excelente");
        assertThat(result.scoreDate()).isEqualTo(LocalDate.of(2026, 5, 15));
    }

    @Test
    void getPublicProfile_returnsDisplayNameFromProfile() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.of(financialSummary));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        assertThat(result.displayName()).isEqualTo("Alice Martínez");
        assertThat(result.userId()).isEqualTo(1L);
    }

    @Test
    void getPublicProfile_usesDefaultDisplayNameWhenNoProfile() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        assertThat(result.displayName()).isEqualTo("Usuario #1");
    }

    // ── CA2: Resumen de historial de pagos ────────────────────────────────────

    @Test
    void getPublicProfile_returnsPaymentSummary() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.of(financialSummary));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        assertThat(result.totalLoansTaken()).isEqualByComparingTo("5000.00");
        assertThat(result.totalRepaid()).isEqualByComparingTo("4500.00");
        assertThat(result.missedPayments()).isEqualTo(1);
        assertThat(result.pendingBalance()).isEqualByComparingTo("500.00");
    }

    @Test
    void getPublicProfile_returnsZeroSummaryWhenNoFinancialData() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        assertThat(result.totalLoansTaken()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.totalRepaid()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.missedPayments()).isZero();
        assertThat(result.pendingBalance()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // ── CA3: Datos privados no expuestos ──────────────────────────────────────

    @Test
    void getPublicProfile_doesNotExposeEmail() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.of(financialSummary));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        // PublicProfileResponse tiene campos userId, displayName, trustScore, level,
        // levelDescription, totalLoansTaken, totalRepaid, missedPayments, pendingBalance, blocked, scoreDate
        // NO tiene: email, passwordHash, securityQuestion, securityAnswer, phone, address
        assertThat(result).isNotNull();

        // Verificar que el record no filtra datos sensibles via sus propios campos
        // (comprobamos que el record no tenga campos que exponen PII)
        var fields = result.getClass().getRecordComponents();
        var fieldNames = java.util.Arrays.stream(fields)
                .map(java.lang.reflect.RecordComponent::getName)
                .toList();

        assertThat(fieldNames).doesNotContain("email", "passwordHash", "securityQuestion",
                "securityAnswer", "phone", "address", "blockchainHashId");
    }

    @Test
    void getPublicProfile_displayNameNeverContainsEmail() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.of(financialSummary));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        assertThat(result.displayName()).doesNotContain("@");
        assertThat(result.displayName()).doesNotContain("trustfi.com");
    }

    // ── Estado bloqueado ──────────────────────────────────────────────────────

    @Test
    void getPublicProfile_returnsBlockedTrueWhenUserIsBlocked() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(blockedUser));
        when(profileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(financialSummaryRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(trustScoreService.getTrustScoreByUserId(2L)).thenReturn(scoreDTO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(2L);

        assertThat(result.blocked()).isTrue();
    }

    @Test
    void getPublicProfile_returnsBlockedFalseWhenUserIsActive() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(financialSummaryRepository.findByUserId(1L)).thenReturn(Optional.of(financialSummary));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        assertThat(result.blocked()).isFalse();
    }

    // ── Usuario no encontrado ─────────────────────────────────────────────────

    @Test
    void getPublicProfile_throwsIllegalArgumentWhenUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> publicProfileService.getPublicProfile(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("99");
    }
}
