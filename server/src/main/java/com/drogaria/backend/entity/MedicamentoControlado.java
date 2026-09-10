package com.drogaria.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "medicamento_controlado")
public class MedicamentoControlado {
    @Id private Integer id;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @MapsId
    @JoinColumn(name = "id") private Produto produto;
    @Column(name = "categoria_controle", nullable = false, length = 100) private String categoriaControle;
    @Column(name = "limite_quantidade_por_cliente") private Integer limiteQuantidadePorCliente;
    @Column(name = "exige_receita", nullable = false) private boolean exigeReceita;
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Produto getProduto() { return produto; }
    public void setProduto(Produto produto) { this.produto = produto; }
    public String getCategoriaControle() { return categoriaControle; }
    public void setCategoriaControle(String categoriaControle) { this.categoriaControle = categoriaControle; }
    public Integer getLimiteQuantidadePorCliente() { return limiteQuantidadePorCliente; }
    public void setLimiteQuantidadePorCliente(Integer limiteQuantidadePorCliente) { this.limiteQuantidadePorCliente = limiteQuantidadePorCliente; }
    public boolean isExigeReceita() { return exigeReceita; }
    public void setExigeReceita(boolean exigeReceita) { this.exigeReceita = exigeReceita; }
}