package com.drogaria.backend.dto;

import com.drogaria.backend.entity.Produto;

public class ProdutoResponse {

	private Integer idCategoria;
	private String nomeProduto;
	private Double precoProduto;
	private String imagemURL;
	private Integer necessitaReceita;
	private Integer medicamentoControlado;
	
	public ProdutoResponse(Produto prod) {
		this.idCategoria = prod.getIdCategoria();
		this.nomeProduto = prod.getNomeProduto();
		this.precoProduto = prod.getPrecoProduto();
		this.imagemURL = prod.getImagemURL();
		this.necessitaReceita = prod.getNecessitaReceita();
		this.medicamentoControlado = prod.getMedicamentoContolado();
	}
	
	
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
	public Integer getNecessitaReceita() {
		return necessitaReceita;
	}
	public void setNecessitaReceita(Integer necessitaReceita) {
		this.necessitaReceita = necessitaReceita;
	}
	public Integer getMedicamentoControlado() {
		return medicamentoControlado;
	}
	public void setMedicamentoControlado(Integer medicamentoControlado) {
		this.medicamentoControlado = medicamentoControlado;
	}
	
	
}
