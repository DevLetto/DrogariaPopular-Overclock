package com.drogaria.backend.service;

import com.drogaria.backend.dto.ServicoRequest;
import com.drogaria.backend.dto.ServicoResponse;
import com.drogaria.backend.entity.Servico;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.LojaRepository;
import com.drogaria.backend.repository.ServicoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ServicoService {
    private final ServicoRepository repository;
    private final LojaRepository lojas;

    public ServicoService(ServicoRepository repository, LojaRepository lojas) {
        this.repository = repository;
        this.lojas = lojas;
    }

    public List<ServicoResponse> listar() { return repository.findAll().stream().map(ServicoResponse::new).toList(); }

    public ServicoResponse buscar(Integer id) {
        return new ServicoResponse(repository.findById(id).orElseThrow(
                () -> new ApiException("Servico nao encontrado", HttpStatus.NOT_FOUND)));
    }

    public ServicoResponse salvar(ServicoRequest request) {
        Servico servico = new Servico(); preencher(servico, request);
        return new ServicoResponse(repository.save(servico));
    }

    public ServicoResponse atualizar(Integer id, ServicoRequest request) {
        Servico servico = repository.findById(id).orElseThrow(
                () -> new ApiException("Servico nao encontrado", HttpStatus.NOT_FOUND));
        preencher(servico, request);
        return new ServicoResponse(repository.save(servico));
    }

    private void preencher(Servico servico, ServicoRequest request) {
        servico.setNome(request.getNome());
        servico.setDescricao(request.getDescricao());
        servico.setValor(request.getValor());
        servico.setLoja(lojas.findById(request.getIdLoja()).orElseThrow(
                () -> new ApiException("Loja nao encontrada", HttpStatus.NOT_FOUND)));
    }

    public void excluir(Integer id) {
        if (!repository.existsById(id)) throw new ApiException("Servico nao encontrado", HttpStatus.NOT_FOUND);
        repository.deleteById(id);
    }
}
