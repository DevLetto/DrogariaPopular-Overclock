
package com.drogaria.backend.dto;

import com.drogaria.backend.entity.Administrador;
import com.drogaria.backend.entity.Atendente;
import com.drogaria.backend.entity.Farmaceutico;
import com.drogaria.backend.entity.Funcionario;
import com.drogaria.backend.entity.FuncionarioEstoqueLogistica;

public class FuncionarioResponse {

    private Integer id;
    private String nome;
    private String email;
    private String tipoFuncionario;

    public FuncionarioResponse(Funcionario f) {

        id = f.getId();
        nome = f.getNome();
        email = f.getEmail();

        if (f instanceof Administrador) {
            tipoFuncionario = "ADMINISTRADOR";
        } else if (f instanceof Farmaceutico) {
            tipoFuncionario = "FARMACEUTICO";
        } else if (f instanceof Atendente) {
            tipoFuncionario = "ATENDENTE";
        } else if (f instanceof FuncionarioEstoqueLogistica) {
            tipoFuncionario = "ESTOQUE_LOGISTICA";
        } else {
            tipoFuncionario = "FUNCIONARIO";
        }
    }

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getTipoFuncionario() {
        return tipoFuncionario;
    }
}
