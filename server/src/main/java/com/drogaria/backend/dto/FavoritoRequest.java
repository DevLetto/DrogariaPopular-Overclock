package com.drogaria.backend.dto;
import jakarta.validation.constraints.NotNull;
public class FavoritoRequest { @NotNull private Integer idCliente; @NotNull private Integer idProduto; public Integer getIdCliente(){return idCliente;} public void setIdCliente(Integer v){idCliente=v;} public Integer getIdProduto(){return idProduto;} public void setIdProduto(Integer v){idProduto=v;} }