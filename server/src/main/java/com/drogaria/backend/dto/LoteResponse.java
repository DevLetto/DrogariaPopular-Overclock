package com.drogaria.backend.dto;

import com.drogaria.backend.entity.Lote;
import java.time.LocalDate;

public class LoteResponse {
    private String numeroLote;
    private LocalDate dataFabricacao;
    private LocalDate dataValidade;
    private Integer quantidade;
    private Integer idEstoque;

    public LoteResponse(Lote lote) {
        numeroLote = lote.getNumeroLote(); dataFabricacao = lote.getDataFabricacao();
        dataValidade = lote.getDataValidade(); quantidade = lote.getQuantidade();
        idEstoque = lote.getEstoque() == null ? null : lote.getEstoque().getId();
    }
    public String getNumeroLote(){return numeroLote;} public LocalDate getDataFabricacao(){return dataFabricacao;}
    public LocalDate getDataValidade(){return dataValidade;} public Integer getQuantidade(){return quantidade;}
    public Integer getIdEstoque(){return idEstoque;}
}