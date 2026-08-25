package com.drogaria.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    // Aceita e-mail OU CPF, igual o campo unico do form de login
    @NotBlank(message = "Informe e-mail ou CPF")
    private String identificador;

    @NotBlank(message = "Informe a senha")
    private String senha;

    public String getIdentificador() {
        return identificador;
    }

    public void setIdentificador(String identificador) {
        this.identificador = identificador;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }
}
