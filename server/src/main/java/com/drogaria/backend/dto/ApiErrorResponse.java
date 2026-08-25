package com.drogaria.backend.dto;

public class ApiErrorResponse {

    private String mensagem;

    public ApiErrorResponse(String mensagem) {
        this.mensagem = mensagem;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }
}
