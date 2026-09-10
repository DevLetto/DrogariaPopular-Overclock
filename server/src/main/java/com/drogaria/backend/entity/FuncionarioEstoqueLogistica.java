package com.drogaria.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "funcionario_estoque_logistica")
@PrimaryKeyJoinColumn(name = "id")
public class FuncionarioEstoqueLogistica extends Funcionario {
}