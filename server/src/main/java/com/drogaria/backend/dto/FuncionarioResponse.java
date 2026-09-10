package com.drogaria.backend.dto;
import com.drogaria.backend.entity.Funcionario;
public class FuncionarioResponse { private Integer id; private String nome; private String email; public FuncionarioResponse(Funcionario f){id=f.getId();nome=f.getNome();email=f.getEmail();} public Integer getId(){return id;} public String getNome(){return nome;} public String getEmail(){return email;} }