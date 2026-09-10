package com.drogaria.backend.dto;

import com.drogaria.backend.entity.Servico;
import java.math.BigDecimal;

public class ServicoResponse {
    private Integer id;
    private String nome;
    private String descricao;
    private BigDecimal valor;
    private Integer idLoja;

    public ServicoResponse(Servico servico) {
        id = servico.getId();
        nome = servico.getNome();
        descricao = servico.getDescricao();
        valor = servico.getValor();
        idLoja = servico.getLoja() == null ? null : servico.getLoja().getId();
    }

    public Integer getId() { return id; }
    public String getNome() { return nome; }
    public String getDescricao() { return descricao; }
    public BigDecimal getValor() { return valor; }
    public Integer getIdLoja() { return idLoja; }
}