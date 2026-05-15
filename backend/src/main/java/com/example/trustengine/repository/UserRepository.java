package com.example.trustengine.repository;

import com.example.trustengine.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    /**
     * Devuelve usuarios ACTIVE con filtro opcional por nombre completo (Profile).
     * Se excluye al propio usuario (excludeId).
     */
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN Profile p ON p.user.id = u.id " +
           "WHERE u.status = 'ACTIVE' " +
           "AND u.id <> :excludeId " +
           "AND (:name IS NULL OR :name = '' OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :name, '%'))) " +
           "ORDER BY u.createdAt DESC")
    List<User> findActiveUsersForDirectory(
            @Param("name")      String name,
            @Param("excludeId") Long   excludeId
    );
}
