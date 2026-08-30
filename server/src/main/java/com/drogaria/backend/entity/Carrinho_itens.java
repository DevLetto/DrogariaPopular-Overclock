package com.drogaria.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "carrinho_itens")
public class Carrinho_itens {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer idCarrinho;

    @Column(name= "id_usuario" )
    private Integer idUsuario;

    @Column(name = "id_produto")
    private Integer idProduto;

    @Column(name = "salvo_para_depois")
    private Integer salvoParaDepois;

    @Column(name = "quantidade")
    private Integer quantidade;

    public Carrinho_itens(){

    }

    public Integer getIdCarrinho() {
        return idCarrinho;
    }

    public void setIdCarrinho(Integer idCarrinho) {
        this.idCarrinho = idCarrinho;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Integer getIdProduto() {
        return idProduto;
    }

    public void setIdProduto(Integer idProduto) {
        this.idProduto = idProduto;
    }

    public Integer getSalvoParaDepois() {
        return salvoParaDepois;
    }

    public void setSalvoParaDepois(Integer salvoParaDepois) {
        this.salvoParaDepois = salvoParaDepois;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        this.quantidade = quantidade;
    }
    
}
