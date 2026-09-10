package com.drogaria.backend.dto;

import com.drogaria.backend.entity.ItemCarrinho;

public class CarrinhoResponse {

	private Integer id;
	private Integer idProduto;
	private Integer quantidade;
	private Integer salvoParaDepois;
	private java.math.BigDecimal precoUnitario;

	public CarrinhoResponse(ItemCarrinho item) {
		this.id = item.getId();
		this.idProduto = item.getIdProduto();
		this.quantidade = item.getQuantidade();
		this.precoUnitario = item.getPrecoUnitario();
		this.salvoParaDepois = 0;
	}

	public Integer getId() { return id; }
	public void setId(Integer id) { this.id = id; }
	public Integer getIdProduto() { return idProduto; }
	public void setIdProduto(Integer idProduto) { this.idProduto = idProduto; }
	public Integer getQuantidade() { return quantidade; }
	public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
	public Integer getSalvoParaDepois() { return salvoParaDepois; }
	public void setSalvoParaDepois(Integer salvoParaDepois) { this.salvoParaDepois = salvoParaDepois; }
	public java.math.BigDecimal getPrecoUnitario() { return precoUnitario; }
	public void setPrecoUnitario(java.math.BigDecimal precoUnitario) { this.precoUnitario = precoUnitario; }
}