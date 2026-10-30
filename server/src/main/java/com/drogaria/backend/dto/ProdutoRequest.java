
package com.drogaria.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public class ProdutoRequest {

    @NotNull
    private Integer idCategoria;

    @NotBlank
    private String nomeProduto;

    private String descricao;

    @NotNull
    @PositiveOrZero
    private Double precoProduto;

    private String imagemURL;

    private Boolean medicamentoControlado;

    private String categoriaControle;

    @Positive
    private Integer limiteQuantidadePorCliente;

    private Boolean necessitaReceita;

    public Integer getIdCategoria() {
        return idCategoria;
    }

    public void setIdCategoria(Integer idCategoria) {
        this.idCategoria = idCategoria;
    }

    public String getNomeProduto() {
        return nomeProduto;
    }

    public void setNomeProduto(String nomeProduto) {
        this.nomeProduto = nomeProduto;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Double getPrecoProduto() {
        return precoProduto;
    }

    public void setPrecoProduto(Double precoProduto) {
        this.precoProduto = precoProduto;
    }

    public String getImagemURL() {
        return imagemURL;
    }

    public void setImagemURL(String imagemURL) {
        this.imagemURL = imagemURL;
    }

    public Boolean getMedicamentoControlado() {
        return medicamentoControlado;
    }

    public void setMedicamentoControlado(Boolean medicamentoControlado) {
        this.medicamentoControlado = medicamentoControlado;
    }

    public String getCategoriaControle() {
        return categoriaControle;
    }

    public void setCategoriaControle(String categoriaControle) {
        this.categoriaControle = categoriaControle;
    }

    public Integer getLimiteQuantidadePorCliente() {
        return limiteQuantidadePorCliente;
    }

    public void setLimiteQuantidadePorCliente(
            Integer limiteQuantidadePorCliente) {
        this.limiteQuantidadePorCliente = limiteQuantidadePorCliente;
    }

    public Boolean getNecessitaReceita() {
        return necessitaReceita;
    }

    public void setNecessitaReceita(Boolean necessitaReceita) {
        this.necessitaReceita = necessitaReceita;
    }
}
