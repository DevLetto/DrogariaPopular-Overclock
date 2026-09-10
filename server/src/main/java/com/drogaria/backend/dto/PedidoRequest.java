package com.drogaria.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class PedidoRequest {
    @NotBlank private String formaEntrega;
    private BigDecimal valorFrete = BigDecimal.ZERO;
    private Integer idLoja;
    private String codigoCupom;
    @NotBlank private String metodoPagamento;
    public String getFormaEntrega() { return formaEntrega; }
    public void setFormaEntrega(String formaEntrega) { this.formaEntrega = formaEntrega; }
    public BigDecimal getValorFrete() { return valorFrete == null ? BigDecimal.ZERO : valorFrete; }
    public void setValorFrete(BigDecimal valorFrete) { this.valorFrete = valorFrete; }
    public Integer getIdLoja() { return idLoja; }
    public void setIdLoja(Integer idLoja) { this.idLoja = idLoja; }
    public String getCodigoCupom() { return codigoCupom; }
    public void setCodigoCupom(String codigoCupom) { this.codigoCupom = codigoCupom; }
    public String getMetodoPagamento() { return metodoPagamento; }
    public void setMetodoPagamento(String metodoPagamento) { this.metodoPagamento = metodoPagamento; }
}