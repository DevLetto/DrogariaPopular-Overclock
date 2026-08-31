package com.drogaria.backend.dto;

public class ProdutoRequest {

	private Integer idProduto;
	private Integer idCategoria;
	private String nomeProduto;
	private Double precoProduto;
	private String imagemURL;
	private Integer necessitaReceita;

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

	private Integer medicamentoControlado;

	public Integer getIdProduto() {
		return idProduto;
	}

	public void setIdProduto(Integer idProduto) {
		this.idProduto = idProduto;
	}

	public Integer getIdCategoria() {
		return idCategoria;
	}

	public void setIdCategoria(Integer idCategoria) {
		this.idCategoria = idCategoria;
	}

}
