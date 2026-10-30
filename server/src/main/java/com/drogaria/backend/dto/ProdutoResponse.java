
package com.drogaria.backend.dto;

import com.drogaria.backend.entity.MedicamentoControlado;
import com.drogaria.backend.entity.Produto;

public class ProdutoResponse {

    private Integer idCategoria;
    private Integer idProduto;
    private String nomeProduto;
    private Double precoProduto;
    private String imagemURL;
    private String descricao;

    private boolean medicamentoControlado;
    private boolean necessitaReceita;

    private String categoriaControle;
    private Integer limiteQuantidadePorCliente;

    private boolean disponivel;
    private boolean esgotado;
    private boolean retiradaSomenteLoja;

    public ProdutoResponse(Produto produto) {

        this.idProduto = produto.getIdProduto();
        this.idCategoria = produto.getIdCategoria();
        this.nomeProduto = produto.getNomeProduto();
        this.precoProduto = produto.getPrecoProduto();
        this.imagemURL = produto.getImagemURL();
        this.descricao = produto.getDescricao();

        this.disponivel = produto.isDisponivel();
        this.esgotado = produto.isEsgotado();
        this.retiradaSomenteLoja = produto.isRetiradaSomenteLoja();

        this.necessitaReceita = produto.isNecessitaReceita();

        MedicamentoControlado controlado =
                produto.getMedicamentoControlado();

        this.medicamentoControlado = controlado != null;

        if (controlado != null) {
            this.categoriaControle = controlado.getCategoriaControle();

            this.limiteQuantidadePorCliente =
                    controlado.getLimiteQuantidadePorCliente();
        }
    }

    public Integer getIdCategoria() {
        return idCategoria;
    }

    public Integer getIdProduto() {
        return idProduto;
    }

    public String getNomeProduto() {
        return nomeProduto;
    }

    public Double getPrecoProduto() {
        return precoProduto;
    }

    public String getImagemURL() {
        return imagemURL;
    }

    public String getDescricao() {
        return descricao;
    }

    public boolean getMedicamentoControlado() {
        return medicamentoControlado;
    }

    public boolean getNecessitaReceita() {
        return necessitaReceita;
    }

    public String getCategoriaControle() {
        return categoriaControle;
    }

    public Integer getLimiteQuantidadePorCliente() {
        return limiteQuantidadePorCliente;
    }

    public boolean isDisponivel() {
        return disponivel;
    }

    public boolean isEsgotado() {
        return esgotado;
    }

    public boolean isRetiradaSomenteLoja() {
        return retiradaSomenteLoja;
    }
}
