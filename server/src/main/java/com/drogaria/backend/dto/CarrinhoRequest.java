package com.drogaria.backend.dto;

public class CarrinhoRequest {
    

	private Integer idCliente;
    private Integer idProduto;
    private Integer quantidade;
    private Integer salvoParaDepois;


    public Integer getSalvoParaDepois() {
		return salvoParaDepois;
	}

	public void setSalvoParaDepois(Integer salvoParaDepois) {
		this.salvoParaDepois = salvoParaDepois;
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

	public Integer getIdCliente() {
        return idCliente;
    }

	public void setIdCliente(Integer idCliente) {
		this.idCliente = idCliente;
    }

    public Integer getIdUsuario() { return idCliente; }
    public void setIdUsuario(Integer idUsuario) { this.idCliente = idUsuario; }

    
}
