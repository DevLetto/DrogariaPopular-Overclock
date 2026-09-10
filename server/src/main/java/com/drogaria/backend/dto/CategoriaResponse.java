package com.drogaria.backend.dto;
import com.drogaria.backend.entity.Categoria;
public class CategoriaResponse { private Integer id; private String nome; public CategoriaResponse(Categoria c){id=c.getId();nome=c.getNome();} public Integer getId(){return id;} public String getNome(){return nome;} }