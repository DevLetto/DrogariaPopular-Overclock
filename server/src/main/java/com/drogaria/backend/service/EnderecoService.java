package com.drogaria.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.drogaria.backend.dto.EnderecoRequest;
import com.drogaria.backend.entity.Endereco;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.ClienteRepository;
import com.drogaria.backend.repository.EnderecoRepository;

@Service
public class EnderecoService {

    private final EnderecoRepository r;
    private final ClienteRepository clientes;

    public EnderecoService(EnderecoRepository r, ClienteRepository c) {
        this.r = r;
        this.clientes = c;
    }

    public List<Endereco> cliente(Integer id) {
        return r.findByClienteId(id);
    }

    public Endereco buscar(Integer id, Authentication authentication) {
        return buscarComControleDeAcesso(id, authentication);
    }

    public Endereco salvar(EnderecoRequest x) {
        Endereco e = new Endereco();
        preencher(e, x);
        return r.save(e);
    }

    public Endereco atualizar(
            Integer id,
            EnderecoRequest x,
            Authentication authentication) {
        Endereco endereco = buscarComControleDeAcesso(id, authentication);
        preencherDadosEndereco(endereco, x);
        return r.save(endereco);
    }

    public void excluir(Integer id, Authentication authentication) {
        Endereco endereco = buscarComControleDeAcesso(id, authentication);
        r.delete(endereco);
    }

    private Endereco buscarComControleDeAcesso(
            Integer id,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ApiException("Autenticacao necessaria", HttpStatus.UNAUTHORIZED);
        }

        boolean administrador = authentication.getAuthorities().stream()
                .anyMatch(authority ->
                        "ROLE_ADMINISTRADOR".equals(authority.getAuthority()));

        if (administrador) {
            return r.findById(id).orElseThrow(() ->
                    new ApiException("Endereco nao encontrado", HttpStatus.NOT_FOUND));
        }

        boolean cliente = authentication.getAuthorities().stream()
                .anyMatch(authority ->
                        "ROLE_CLIENTE".equals(authority.getAuthority()));

        if (!cliente) {
            throw new ApiException("Endereco nao encontrado", HttpStatus.NOT_FOUND);
        }

        return r.findByIdAndClienteEmailIgnoreCase(id, authentication.getName())
                .orElseThrow(() ->
                        new ApiException("Endereco nao encontrado", HttpStatus.NOT_FOUND));
    }

    private void preencher(Endereco e, EnderecoRequest x) {
        preencherDadosEndereco(e, x);
        e.setCliente(clientes.findById(x.getIdCliente()).orElseThrow(() ->
                new ApiException("Cliente nao encontrado", HttpStatus.NOT_FOUND)));
    }

    private void preencherDadosEndereco(Endereco e, EnderecoRequest x) {
        e.setRua(x.getRua());
        e.setNumero(x.getNumero());
        e.setBairro(x.getBairro());
        e.setCidade(x.getCidade());
        e.setEstado(x.getEstado());
        e.setCep(x.getCep());
    }
}