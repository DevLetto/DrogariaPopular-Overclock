package com.drogaria.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "atendente")
@PrimaryKeyJoinColumn(name = "id")
public class Atendente extends Funcionario {
}