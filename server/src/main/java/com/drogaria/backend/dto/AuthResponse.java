
package com.drogaria.backend.dto;

import com.drogaria.backend.entity.Cliente;
import com.drogaria.backend.entity.Funcionario;

public class AuthResponse {

    private Integer idCliente;
    private Integer idFuncionario;

    private String nome;
    private String cpf;
    private String email;
    private String telefone;

    private String role;
    private boolean contaAprovada;

    public AuthResponse(Cliente cliente, String role) {

        this.idCliente = cliente.getId();
        this.nome = cliente.getNome();
        this.cpf = cliente.getCpf();
        this.email = cliente.getEmail();
        this.telefone = cliente.getTelefone();
        this.role = role;
        this.contaAprovada = cliente.isContaAprovada();
    }

    public AuthResponse(Funcionario funcionario, String role) {

        this.idFuncionario = funcionario.getId();
        this.nome = funcionario.getNome();
        this.email = funcionario.getEmail();
        this.role = role;
    }

    public Integer getIdCliente() {
        return idCliente;
    }

    public Integer getIdFuncionario() {
        return idFuncionario;
    }

    public String getNome() {
        return nome;
    }

    public String getCpf() {
        return cpf;
    }

    public String getEmail() {
        return email;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getRole() {
        return role;
    }

    public boolean isContaAprovada() {
        return contaAprovada;
    }
}
