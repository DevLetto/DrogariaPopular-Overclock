package com.drogaria.backend.dto;

import com.drogaria.backend.entity.Usuario;

public class UsuarioResponse {

    private Integer idUsuario;
    private String nome;
    private String email;
    private String cpf;
    private String statusCadastro;

    public UsuarioResponse(Usuario usuario) {
        this.idUsuario = usuario.getIdUsuario();
        this.nome = usuario.getNome();
        this.email = usuario.getEmail();
        this.cpf = usuario.getCpf();
        this.statusCadastro = usuario.getStatusCadastro();
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getCpf() {
        return cpf;
    }

    public String getStatusCadastro() {
        return statusCadastro;
    }
}
