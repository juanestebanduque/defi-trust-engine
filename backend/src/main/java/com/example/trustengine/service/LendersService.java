package com.example.trustengine.service;

import com.example.trustengine.dto.UserCardResponse;
import com.example.trustengine.entity.Profile;
import com.example.trustengine.entity.SavedLender;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.ProfileRepository;
import com.example.trustengine.repository.SavedLenderRepository;
import com.example.trustengine.repository.TrustScoreRepository;
import com.example.trustengine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LendersService {

    private final UserRepository         userRepository;
    private final ProfileRepository      profileRepository;
    private final TrustScoreRepository   trustScoreRepository;
    private final SavedLenderRepository  savedLenderRepository;
    private final TrustScoreService      trustScoreService;

    /**
     * Devuelve el directorio de usuarios activos con filtros opcionales.
     *
     * @param name       Filtro parcial por nombre (case-insensitive). Null o vacío = sin filtro.
     * @param minScore   Score mínimo en escala 0-100. Null = sin límite inferior.
     * @param maxScore   Score máximo en escala 0-100. Null = sin límite superior.
     * @param currentEmail Email del usuario autenticado (para marcar guardados y excluirse).
     */
    @Transactional(readOnly = true)
    public List<UserCardResponse> getDirectory(
            String name,
            BigDecimal minScore,
            BigDecimal maxScore,
            String currentEmail
    ) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado: " + currentEmail));

        List<User> users = userRepository.findActiveUsersForDirectory(
                (name == null || name.isBlank()) ? null : name.trim(),
                currentUser.getId()
        );

        // IDs que el usuario actual ya guardó
        Set<Long> savedIds = savedLenderRepository.findBySavedById(currentUser.getId())
                .stream()
                .map(sl -> sl.getLender().getId())
                .collect(Collectors.toSet());

        return users.stream()
                .map(u -> buildCard(u, savedIds))
                .filter(card -> minScore == null || card.trustScore().compareTo(minScore) >= 0)
                .filter(card -> maxScore == null || card.trustScore().compareTo(maxScore) <= 0)
                .sorted((a, b) -> b.trustScore().compareTo(a.trustScore())) // mejor score primero
                .collect(Collectors.toList());
    }

    /** Guarda un prestamista en la lista del usuario autenticado. */
    @Transactional
    public void saveLender(String currentEmail, Long lenderId) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado: " + currentEmail));

        if (currentUser.getId().equals(lenderId)) {
            throw new IllegalArgumentException("No puedes guardarte a ti mismo.");
        }
        if (savedLenderRepository.existsBySavedByIdAndLenderId(currentUser.getId(), lenderId)) {
            return; // ya guardado, idempotente
        }

        User lender = userRepository.findById(lenderId)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado: " + lenderId));

        savedLenderRepository.save(SavedLender.builder()
                .savedBy(currentUser)
                .lender(lender)
                .build());
    }

    /** Elimina un prestamista guardado. */
    @Transactional
    public void unsaveLender(String currentEmail, Long lenderId) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado: " + currentEmail));

        savedLenderRepository.deleteBySavedByIdAndLenderId(currentUser.getId(), lenderId);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private UserCardResponse buildCard(User user, Set<Long> savedIds) {
        // Nombre desde Profile
        Profile profile = profileRepository.findByUserId(user.getId()).orElse(null);
        String displayName = (profile != null && profile.getFullName() != null && !profile.getFullName().isBlank())
                ? profile.getFullName()
                : "Usuario #" + user.getId();

        // Último score guardado (sin recalcular para no sobrecargar el listado)
        BigDecimal score = trustScoreRepository
                .findFirstByUserIdOrderByCalculationDateDesc(user.getId())
                .map(ts -> ts.getScoreValue())
                .orElse(BigDecimal.ZERO);

        String level = trustScoreService.determineLevel(score);
        String levelDescription = trustScoreService.getLevelDescription(level);

        return new UserCardResponse(
                user.getId(),
                displayName,
                score,
                level,
                levelDescription,
                user.getCreatedAt() != null ? user.getCreatedAt().toLocalDate() : null,
                savedIds.contains(user.getId())
        );
    }
}
