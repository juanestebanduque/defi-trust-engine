package com.example.trustengine.controller;

import com.example.trustengine.dto.RiskAnalysisDTO;
import com.example.trustengine.service.RiskAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/risk-analysis")
@RequiredArgsConstructor
public class RiskAnalysisController {

    private final RiskAnalysisService riskAnalysisService;

    /**
     * CA1: Informe de riesgo basado en Trust Score e historial del prestatario.
     * CA2: Los retrasos se reflejan como factores de riesgo elevado.
     * CA3: Si no hay suficiente historial, se indica evaluación limitada.
     */
    @GetMapping("/{borrowerId}")
    public ResponseEntity<?> getRiskAnalysis(@PathVariable Long borrowerId) {
        try {
            RiskAnalysisDTO analysis = riskAnalysisService.getRiskAnalysis(borrowerId);
            return ResponseEntity.ok(analysis);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error al generar análisis de riesgo: " + e.getMessage());
        }
    }
}
