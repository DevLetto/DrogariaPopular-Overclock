package com.drogaria.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.drogaria.backend.entity.ItemPedido;
import com.drogaria.backend.entity.Pedido;

public class PedidoResponse {
	private Integer id;
	private String status;
	private BigDecimal valorFrete;
	private BigDecimal valorTotal;
	private LocalDateTime dataPedido;
	private String formaEntrega;
	private List<ItemResponse> itens;
	private Integer idCliente;
	private String nomeCliente;

	public PedidoResponse(Pedido pedido) {
		id = pedido.getId();
		status = pedido.getStatus();
		valorFrete = pedido.getValorFrete();
		valorTotal = pedido.getValorTotal();
		dataPedido = pedido.getDataPedido();
		formaEntrega = pedido.getFormaEntrega();
		itens = pedido.getItens().stream().map(ItemResponse::new).toList();
		if (pedido.getCliente() != null) {
			idCliente = pedido.getCliente().getId();
			nomeCliente = pedido.getCliente().getNome();
		}
	}

	public Integer getIdCliente() {
		return idCliente;
	}

	public String getNomeCliente() {
		return nomeCliente;
	}

	public String getFormaEntrega() {
		return formaEntrega;
	}

	public List<ItemResponse> getItens() {
		return itens;
	}

	public static class ItemResponse {
		private String nomeProduto;
		private Integer quantidade;
		private BigDecimal precoUnitario;

		public ItemResponse(ItemPedido i) {
			nomeProduto = i.getProduto().getNomeProduto();
			quantidade = i.getQuantidade();
			precoUnitario = i.getPrecoUnitario();
		}

		public String getNomeProduto() {
			return nomeProduto;
		}

		public Integer getQuantidade() {
			return quantidade;
		}

		public BigDecimal getPrecoUnitario() {
			return precoUnitario;
		}
	}

	public Integer getId() {
		return id;
	}

	public String getStatus() {
		return status;
	}

	public BigDecimal getValorFrete() {
		return valorFrete;
	}

	public BigDecimal getValorTotal() {
		return valorTotal;
	}

	public LocalDateTime getDataPedido() {
		return dataPedido;
	}
}