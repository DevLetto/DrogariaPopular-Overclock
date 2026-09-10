package com.drogaria.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "log_auditoria")
public class LogAuditoria {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;
    @Column(nullable = false, length = 255) private String acao;
    @Column(name = "data_hora", nullable = false) private LocalDateTime dataHora;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "id_funcionario") private Funcionario funcionario;
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getAcao() { return acao; }
    public void setAcao(String acao) { this.acao = acao; }
    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
    public Funcionario getFuncionario() { return funcionario; }
    public void setFuncionario(Funcionario funcionario) { this.funcionario = funcionario; }
}