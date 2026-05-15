package com.example.trustengine.service;

import com.example.trustengine.dto.PublicProfileResponse;
import com.example.trustengine.dto.TrustScoreResponseDTO;
import com.example.trustengine.entity.Profile;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.LoanInstallmentRepository;
import com.example.trustengine.repository.LoanRepository;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PublicProfileServiceTest {

    @Mock private UserRepository            userRepository;
    @Mock private ProfileRepository         profileRepository;
    @Mock private LoanRepository            loanRepository;
    @Mock private LoanInstallmentRepository installmentRepository;
    @Mock private TrustScoreService         trustScoreService;

    @InjectMocks
    private PublicProfileService publicProfileService;

    private User                activeUser;
    private User                blockedUser;
    private Profile             profile;
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

    // Stub helper — evitar repetición en cada test
    private void stubLiveSummary(BigDecimal taken, BigDecimal repaid, long missed, BigDecimal pending) {
        when(loanRepository.sumLoanAmountByBorrower(1L)).thenReturn(taken);
        when(installmentRepository.sumPaidAmountByBorrower(1L)).thenReturn(repaid);
        when(installmentRepository.countOverdueByBorrower(eq(1L), any(LocalDate.class))).thenReturn(missed);
        when(loanRepository.sumPendingBalanceByBorrower(1L)).thenReturn(pending);
    }

    // ── CA1: Trust Score visible en perfil público ────────────────────────────

    @Test
    void getPublicProfile_returnsTrustScoreAndLevel() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);
        stubLiveSummary(BigDecimal.ZERO, BigDecimal.ZERO, 0L, BigDecimal.ZERO);

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
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);
        stubLiveSummary(BigDecimal.ZERO, BigDecimal.ZERO, 0L, BigDecimal.ZERO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        assertThat(result.displayName()).isEqualTo("Alice Martínez");
        assertThat(result.userId()).isEqualTo(1L);
    }

    @Test
    void getPublicProfile_usesDefaultDisplayNameWhenNoProfile() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);
        stubLiveSummary(BigDecimal.ZERO, BigDecimal.ZERO, 0L, BigDecimal.ZERO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        assertThat(result.displayName()).isEqualTo("Usuario #1");
    }

    // ── CA2: Resumen real-time de historial de pagos ──────────────────────────

    @Test
    void getPublicProfile_returnsLivePaymentSummary() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);
        stubLiveSummary(
                new BigDecimal("5000.00"),
                new BigDecimal("4500.00"),
                1L,
                new BigDecimal("500.00")
        );

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        assertThat(result.totalLoansTaken()).isEqualByComparingTo("5000.00");
        assertThat(result.totalRepaid()).isEqualByComparingTo("4500.00");
        assertThat(result.missedPayments()).isEqualTo(1);
        assertThat(result.pendingBalance()).isEqualByComparingTo("500.00");
    }

    @Test
    void getPublicProfile_returnsZeroSummaryForNewUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);
        stubLiveSummary(BigDecimal.ZERO, BigDecimal.ZERO, 0L, BigDecimal.ZERO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        assertThat(result.totalLoansTaken()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.totalRepaid()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.missedPayments()).isZero();
        assertThat(result.pendingBalance()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getPublicProfile_summaryQueriesUseLiveRepositories() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);
        stubLiveSummary(BigDecimal.ZERO, BigDecimal.ZERO, 0L, BigDecimal.ZERO);

        publicProfileService.getPublicProfile(1L);

        // Verificar que se consultaron los repositorios reales y no FinancialSummary
        verify(loanRepository).sumLoanAmountByBorrower(1L);
        verify(loanRepository).sumPendingBalanceByBorrower(1L);
        verify(installmentRepository).sumPaidAmountByBorrower(1L);
        verify(installmentRepository).countOverdueByBorrower(eq(1L), any(LocalDate.class));
    }

    // ── CA3: Datos privados no expuestos ──────────────────────────────────────

    @Test
    void getPublicProfile_dtoDoesNotContainSensitiveFields() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);
        stubLiveSummary(BigDecimal.ZERO, BigDecimal.ZERO, 0L, BigDecimal.ZERO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        // Verificar que el record no expone PII vía sus componentes
        var fieldNames = java.util.Arrays.stream(result.getClass().getRecordComponents())
                .map(java.lang.reflect.RecordComponent::getName)
                .toList();

        assertThat(fieldNames).doesNotContain(
                "email", "passwordHash", "securityQuestion",
                "securityAnswer", "phone", "address", "blockchainHashId"
        );
    }

    @Test
    void getPublicProfile_displayNameNeverContainsEmail() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);
        stubLiveSummary(BigDecimal.ZERO, BigDecimal.ZERO, 0L, BigDecimal.ZERO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(1L);

        assertThat(result.displayName()).doesNotContain("@");
        assertThat(result.displayName()).doesNotContain("trustfi.com");
    }

    // ── Estado bloqueado ──────────────────────────────────────────────────────

    @Test
    void getPublicProfile_returnsBlockedTrueWhenUserIsBlocked() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(blockedUser));
        when(profileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(trustScoreService.getTrustScoreByUserId(2L)).thenReturn(scoreDTO);
        when(loanRepository.sumLoanAmountByBorrower(2L)).thenReturn(BigDecimal.ZERO);
        when(installmentRepository.sumPaidAmountByBorrower(2L)).thenReturn(BigDecimal.ZERO);
        when(installmentRepository.countOverdueByBorrower(eq(2L), any(LocalDate.class))).thenReturn(0L);
        when(loanRepository.sumPendingBalanceByBorrower(2L)).thenReturn(BigDecimal.ZERO);

        PublicProfileResponse result = publicProfileService.getPublicProfile(2L);

        assertThat(result.blocked()).isTrue();
    }

    @Test
    void getPublicProfile_returnsBlockedFalseWhenUserIsActive() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(trustScoreService.getTrustScoreByUserId(1L)).thenReturn(scoreDTO);
        stubLiveSummary(BigDecimal.ZERO, BigDecimal.ZERO, 0L, BigDecimal.ZERO);

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
