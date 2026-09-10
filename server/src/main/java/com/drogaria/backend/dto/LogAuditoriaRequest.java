package com.drogaria.backend.dto;
import jakarta.validation.constraints.NotBlank;
public class LogAuditoriaRequest { @NotBlank private String acao; private Integer idFuncionario; public String getAcao(){return acao;} public void setAcao(String v){acao=v;} public Integer getIdFuncionario(){return idFuncionario;} public void setIdFuncionario(Integer v){idFuncionario=v;} }