package com.drogaria.backend.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
public class FuncionarioRequest { @NotBlank private String nome; @NotBlank @Email private String email; private String senha; public String getNome(){return nome;} public void setNome(String v){nome=v;} public String getEmail(){return email;} public void setEmail(String v){email=v;} public String getSenha(){return senha;} public void setSenha(String v){senha=v;} }