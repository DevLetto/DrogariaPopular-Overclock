package com.drogaria.backend.service;

import com.drogaria.backend.dto.ReceitaRequest;
import com.drogaria.backend.dto.ReceitaResponse;
import com.drogaria.backend.entity.Farmaceutico;
import com.drogaria.backend.entity.Receita;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.ClienteRepository;
import com.drogaria.backend.repository.FarmaceuticoRepository;
import com.drogaria.backend.repository.ReceitaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class ReceitaService {
    private final ReceitaRepository repository;
    private final ClienteRepository clientes;
    private final FarmaceuticoRepository farmaceuticos;

    public ReceitaService(ReceitaRepository repository, ClienteRepository clientes,
            FarmaceuticoRepository farmaceuticos) {
        this.repository = repository;
        this.clientes = clientes;
        this.farmaceuticos = farmaceuticos;
    }

    public ReceitaResponse enviar(ReceitaRequest request) {
        Receita receita = new Receita();
        receita.setArquivo(request.getArquivo());
        receita.setStatus("PENDENTE");
        receita.setDataEnvio(LocalDate.now());
        receita.setCliente(clientes.findById(request.getIdCliente()).orElseThrow(
                () -> new ApiException("Cliente nao encontrado", HttpStatus.NOT_FOUND)));
        return new ReceitaResponse(repository.save(receita));
    }

    public ReceitaResponse buscar(Integer id) {
        return new ReceitaResponse(repository.findById(id).orElseThrow(
                () -> new ApiException("Receita nao encontrada", HttpStatus.NOT_FOUND)));
    }

    public List<ReceitaResponse> cliente(Integer idCliente) {
        return repository.findByClienteId(idCliente).stream().map(ReceitaResponse::new).toList();
    }

    public ReceitaResponse aprovar(Integer id, Integer idFuncionario) {
        Receita receita = repository.findById(id).orElseThrow(
                () -> new ApiException("Receita nao encontrada", HttpStatus.NOT_FOUND));
        Farmaceutico farmaceutico = farmaceuticos.findById(idFuncionario).orElseThrow(
                () -> new ApiException("Farmaceutico nao encontrado", HttpStatus.NOT_FOUND));
        receita.setStatus("APROVADA");
        receita.setDataValidacao(LocalDate.now());
        receita.setFarmaceutico(farmaceutico);
        receita.setMotivoRejeicao(null);
        return new ReceitaResponse(repository.save(receita));
    }

    public ReceitaResponse rejeitar(Integer id, String motivo) {
        Receita receita = repository.findById(id).orElseThrow(
                () -> new ApiException("Receita nao encontrada", HttpStatus.NOT_FOUND));
        receita.setStatus("REJEITADA");
        receita.setDataValidacao(LocalDate.now());
        receita.setMotivoRejeicao(motivo);
        return new ReceitaResponse(repository.save(receita));
    }
}
