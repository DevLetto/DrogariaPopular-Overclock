package com.drogaria.backend.dto;
import jakarta.validation.constraints.NotBlank;

public class CategoriaRequest { @NotBlank private String nome; public String getNome(){return nome;} public void setNome(String nome){this.nome=nome;} }