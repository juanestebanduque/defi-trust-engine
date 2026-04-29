package com.example.trustengine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "Formato de correo inválido")
    private String email;

    @NotBlank(message = "La respuesta de seguridad es obligatoria")
    private String securityAnswer;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    private String newPassword;
}
