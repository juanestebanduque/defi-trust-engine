package com.example.trustengine.repository;

import com.example.trustengine.entity.SavedLender;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavedLenderRepository extends JpaRepository<SavedLender, Long> {

    boolean existsBySavedByIdAndLenderId(Long savedById, Long lenderId);

    List<SavedLender> findBySavedById(Long savedById);

    void deleteBySavedByIdAndLenderId(Long savedById, Long lenderId);
}
