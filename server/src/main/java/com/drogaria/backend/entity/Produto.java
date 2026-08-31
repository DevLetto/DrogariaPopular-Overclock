package com.drogaria.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "produtos")
public class Produto {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_produto")
	private Integer idProduto;
	
	@Column(name = "id_categoria")
	private Integer idCategoria;
	
	@Column(name = "nome")
	private String nomeProduto;
	
	@Column(name = "preco")
	private Double precoProduto;
	
	@Column(name = "imagem_url")
	private String imagemURL;
	
	@Column(name = "necessita_receita")
	private Integer necessitaReceita;
	
	@Column(name = "medicamento_controlado")
	private Integer medicamentoContolado;
	
	
	
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

	public String getNomeProduto() {
		return nomeProduto;
	}

	public void setNomeProduto(String nomeProduto) {
		this.nomeProduto = nomeProduto;
	}

	public double getPrecoProduto() {
		return precoProduto;
	}

	public void setPrecoProduto(double precoProduto) {
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

	public Integer getMedicamentoContolado() {
		return medicamentoContolado;
	}

	public void setMedicamentoContolado(Integer medicamentoContolado) {
		this.medicamentoContolado = medicamentoContolado;
	}
}
