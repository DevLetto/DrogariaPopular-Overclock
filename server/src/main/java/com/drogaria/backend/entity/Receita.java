package com.drogaria.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "receita")
public class Receita {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;
    @Column(nullable = false, length = 500) private String arquivo;
    @Column(nullable = false, length = 30) private String status;
    @Column(name = "data_envio", nullable = false) private LocalDate dataEnvio;
    @Column(name = "data_validacao") private LocalDate dataValidacao;
    @Column(name = "motivo_rejeicao", columnDefinition = "TEXT") private String motivoRejeicao;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_cliente", nullable = false) private Cliente cliente;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "id_farmaceutico") private Farmaceutico farmaceutico;
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getArquivo() { return arquivo; }
    public void setArquivo(String arquivo) { this.arquivo = arquivo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getDataEnvio() { return dataEnvio; }
    public void setDataEnvio(LocalDate dataEnvio) { this.dataEnvio = dataEnvio; }
    public LocalDate getDataValidacao() { return dataValidacao; }
    public void setDataValidacao(LocalDate dataValidacao) { this.dataValidacao = dataValidacao; }
    public String getMotivoRejeicao() { return motivoRejeicao; }
    public void setMotivoRejeicao(String motivoRejeicao) { this.motivoRejeicao = motivoRejeicao; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public Farmaceutico getFarmaceutico() { return farmaceutico; }
    public void setFarmaceutico(Farmaceutico farmaceutico) { this.farmaceutico = farmaceutico; }
}