package com.drogaria.backend.dto;

import com.drogaria.backend.entity.Carrinho_itens;

public class CarrinhoResponse {

	private Integer id;
	private Integer idProduto;
	private Integer quantidade;

	public CarrinhoResponse(Carrinho_itens item) {
		this.id = item.getIdCarrinho();
		this.idProduto = item.getIdProduto();
		this.quantidade = item.getQuantidade();
	}

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

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

}
