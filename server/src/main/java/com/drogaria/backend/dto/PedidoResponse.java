package com.drogaria.backend.dto;

import com.drogaria.backend.entity.Pedido;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PedidoResponse {
    private Integer id;
    private String status;
    private BigDecimal valorFrete;
    private BigDecimal valorTotal;
    private LocalDateTime dataPedido;
    public PedidoResponse(Pedido pedido) {
        id = pedido.getId(); status = pedido.getStatus(); valorFrete = pedido.getValorFrete();
        valorTotal = pedido.getValorTotal(); dataPedido = pedido.getDataPedido();
    }
    public Integer getId() { return id; }
    public String getStatus() { return status; }
    public BigDecimal getValorFrete() { return valorFrete; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public LocalDateTime getDataPedido() { return dataPedido; }
}