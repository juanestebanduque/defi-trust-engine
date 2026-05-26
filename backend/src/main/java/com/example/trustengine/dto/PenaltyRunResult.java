package com.example.trustengine.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PenaltyRunResult {
    private int affectedUsers;
    private int penalizedInstallments;
    private String message;
}
