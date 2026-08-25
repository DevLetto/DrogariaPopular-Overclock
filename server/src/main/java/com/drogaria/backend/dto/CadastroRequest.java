package com.drogaria.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CadastroRequest {

    @NotBlank(message = "Informe seu nome completo")
    private String nome;

    @NotBlank(message = "Informe seu CPF")
    @Pattern(regexp = "\\d{11}", message = "CPF deve ter 11 digitos")
    private String cpf;

    @NotBlank(message = "Informe seu telefone")
    private String telefone;

    @NotBlank(message = "Informe seu e-mail")
    @Email(message = "E-mail invalido")
    private String email;

    @NotBlank(message = "Informe o endereco de entrega")
    private String endereco;

    @NotBlank(message = "Crie uma senha")
    @Size(min = 8, message = "A senha deve ter no minimo 8 caracteres")
    private String senha;

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }
}
