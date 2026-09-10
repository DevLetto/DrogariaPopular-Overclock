package com.drogaria.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "solicitacao_cadastro")
public class SolicitacaoCadastro {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;
    @Column(nullable = false, length = 30) private String status;
    @Column(name = "data_solicitacao", nullable = false) private LocalDate dataSolicitacao;
    @Column(name = "data_analise") private LocalDate dataAnalise;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_cliente", nullable = false) private Cliente cliente;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "id_funcionario") private Funcionario funcionario;
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getDataSolicitacao() { return dataSolicitacao; }
    public void setDataSolicitacao(LocalDate dataSolicitacao) { this.dataSolicitacao = dataSolicitacao; }
    public LocalDate getDataAnalise() { return dataAnalise; }
    public void setDataAnalise(LocalDate dataAnalise) { this.dataAnalise = dataAnalise; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public Funcionario getFuncionario() { return funcionario; }
    public void setFuncionario(Funcionario funcionario) { this.funcionario = funcionario; }
}