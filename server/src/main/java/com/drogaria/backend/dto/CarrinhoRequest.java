package com.drogaria.backend.dto;

public class CarrinhoRequest {
    

    private Integer idUsuario;
    private Integer idProduto;
    private Integer quantidade;



    public Integer getIdProduto() {
		return idProduto;
	}

	public void setIdProduto(Integer idProduto) {
		this.idProduto = idProduto;
	}

	public Integer getQuantidade() {
		return quantidade;
	}

	public void setQuantidade(Integer quantidade) {
		this.quantidade = quantidade;
	}

	public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setId(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    
}
