package com.drogaria.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "produto")
public class Produto {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Integer idProduto;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_categoria")
	private Categoria categoria;
	
	@Column(name = "nome")
	private String nomeProduto;

	@Column(name = "descricao")
	private String descricao;
	
	@Column(name = "preco")
	private Double precoProduto;
	
	@Column(name = "fotos", columnDefinition = "LONGTEXT")
	private String fotos;

	@Column(name = "disponivel", nullable = false)
	private boolean disponivel = true;

	@Column(name = "esgotado", nullable = false)
	private boolean esgotado;

	@Column(name = "retirada_somente_loja", nullable = false)
	private boolean retiradaSomenteLoja;
	
	@jakarta.persistence.Transient
	private Integer necessitaReceita;
	
	@jakarta.persistence.Transient
	private Integer medicamentoContolado;
	
	
	
	public Integer getIdProduto() {
		return idProduto;
	}

	public void setIdProduto(Integer idProduto) {
		this.idProduto = idProduto;
	}

	public Integer getIdCategoria() {
		return categoria == null ? null : categoria.getId();
	}

	public void setIdCategoria(Integer idCategoria) {
		if (categoria == null) {
			categoria = new Categoria();
		}
		categoria.setId(idCategoria);
	}

	public Categoria getCategoria() { return categoria; }
	public void setCategoria(Categoria categoria) { this.categoria = categoria; }

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
		if (fotos == null || !fotos.startsWith("[\"")) {
			return fotos;
		}
		return fotos.substring(2, fotos.length() - 2).replace("\\\"", "\"");
	}

	public void setImagemURL(String imagemURL) {
		if (imagemURL == null || imagemURL.isBlank()) {
			this.fotos = null;
		} else if (imagemURL.trim().startsWith("[")) {
			this.fotos = imagemURL;
		} else {
			this.fotos = "[\"" + imagemURL.replace("\\", "\\\\").replace("\"", "\\\"") + "\"]";
		}
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
