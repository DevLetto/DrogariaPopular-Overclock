package com.drogaria.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "favorito", uniqueConstraints = @UniqueConstraint(columnNames = { "id_cliente", "id_produto" }))
public class Favorito {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;
    @Column(name = "data_adicionado", nullable = false) private LocalDate dataAdicionado;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_cliente", nullable = false) private Cliente cliente;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_produto", nullable = false) private Produto produto;
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public LocalDate getDataAdicionado() { return dataAdicionado; }
    public void setDataAdicionado(LocalDate dataAdicionado) { this.dataAdicionado = dataAdicionado; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public Produto getProduto() { return produto; }
    public void setProduto(Produto produto) { this.produto = produto; }
}