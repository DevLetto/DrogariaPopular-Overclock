package com.drogaria.backend.dto;

import com.drogaria.backend.entity.Cliente;

public class ClienteResponse {

    private Integer idCliente;
    private String nome;
    private String cpf;
    private String email;
    private String telefone;
    private boolean contaAprovada;

    public ClienteResponse() {
    }

    public ClienteResponse(Cliente cliente) {

        this.idCliente = cliente.getId();
        this.nome = cliente.getNome();
        this.cpf = cliente.getCpf();
        this.email = cliente.getEmail();
        this.telefone = cliente.getTelefone();
        this.contaAprovada = cliente.isContaAprovada();
    }

    public Integer getIdCliente() {
        return idCliente;
    }

    public void setIdCliente(Integer idCliente) {
        this.idCliente = idCliente;
    }

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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public boolean isContaAprovada() {
        return contaAprovada; 
    }
    
    public void setContaAprovada(boolean contaAprovada) {
        this.contaAprovada = contaAprovada; 
    }
}