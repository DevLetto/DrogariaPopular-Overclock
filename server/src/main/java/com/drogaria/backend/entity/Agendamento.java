package com.drogaria.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agendamento")
public class Agendamento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "data_hora", nullable = false) private LocalDateTime dataHora;
    @Column(nullable = false, length = 30) private String status;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_cliente", nullable = false) private Cliente cliente;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_servico", nullable = false) private Servico servico;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_loja", nullable = false) private Loja loja;
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public Servico getServico() { return servico; }
    public void setServico(Servico servico) { this.servico = servico; }
    public Loja getLoja() { return loja; }
    public void setLoja(Loja loja) { this.loja = loja; }
}