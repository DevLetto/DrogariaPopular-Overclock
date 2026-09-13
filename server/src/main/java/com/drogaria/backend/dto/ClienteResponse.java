package com.drogaria.backend.dto;

import com.drogaria.backend.entity.Cliente;

public class ClienteResponse {

    private Integer idCliente;
    private String nome;
    private String email;
    private String cpf;
    private boolean contaAprovada;
    private String role;

    public ClienteResponse(Cliente cliente) {
        this.idCliente = cliente.getId();
        this.nome = cliente.getNome();
        this.email = cliente.getEmail();
        this.cpf = cliente.getCpf();
        this.contaAprovada = cliente.isContaAprovada();
    }

    public Integer getIdCliente() { return idCliente; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getCpf() { return cpf; }
    public boolean isContaAprovada() { return contaAprovada; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}