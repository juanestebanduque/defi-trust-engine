package com.example.trustengine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    private String lastName;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "Formato de correo inválido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;

    @NotBlank(message = "La pregunta de seguridad es obligatoria")
    private String securityQuestion;

    @NotBlank(message = "La respuesta de seguridad es obligatoria")
    private String securityAnswer;

    private String phone;

    private String address;

    private String blockchainHashId;

    private String role;   // USER | ADMIN
}
