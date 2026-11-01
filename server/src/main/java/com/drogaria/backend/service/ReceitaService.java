package com.drogaria.backend.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.drogaria.backend.dto.ReceitaRequest;
import com.drogaria.backend.dto.ReceitaResponse;
import com.drogaria.backend.entity.Farmaceutico;
import com.drogaria.backend.entity.Receita;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.ClienteRepository;
import com.drogaria.backend.repository.FarmaceuticoRepository;
import com.drogaria.backend.repository.ReceitaRepository;

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

    public ReceitaResponse buscar(Integer id, Authentication auth) {

    boolean funcionarioAutorizado = auth.getAuthorities().stream()
        .anyMatch(a ->
            a.getAuthority().equals("ROLE_ADMINISTRADOR") ||
            a.getAuthority().equals("ROLE_FARMACEUTICO")
        );

    Receita receita;

    if (funcionarioAutorizado) {
        receita = repository.findById(id)
            .orElseThrow(() -> new ApiException(
                "Receita nao encontrada",
                HttpStatus.NOT_FOUND
            ));
    } else {
        receita = repository
            .findByIdAndClienteEmailIgnoreCase(id, auth.getName())
            .orElseThrow(() -> new ApiException(
                "Receita nao encontrada",
                HttpStatus.NOT_FOUND
            ));
    }

    return new ReceitaResponse(receita);
    }       

    public List<ReceitaResponse> cliente(Integer idCliente) {
        return repository.findByClienteId(idCliente).stream().map(ReceitaResponse::new).toList();
    }

    public ReceitaResponse aprovar(
        Integer id,
        Authentication auth) {

    Receita receita = repository.findById(id)
        .orElseThrow(() -> new ApiException(
            "Receita nao encontrada",
            HttpStatus.NOT_FOUND
        ));

    if (!"PENDENTE".equalsIgnoreCase(receita.getStatus())) {
        throw new ApiException(
            "Esta receita ja foi processada",
            HttpStatus.CONFLICT
        );
    }

    Farmaceutico farmaceutico = farmaceuticos
        .findByEmailIgnoreCase(auth.getName())
        .orElseThrow(() -> new ApiException(
            "Farmaceutico nao encontrado",
            HttpStatus.FORBIDDEN
        ));

    receita.setStatus("APROVADA");
    receita.setDataValidacao(LocalDate.now());
    receita.setFarmaceutico(farmaceutico);
    receita.setMotivoRejeicao(null);

    return new ReceitaResponse(repository.save(receita));
}

    public ReceitaResponse rejeitar(
        Integer id,
        String motivo,
        Authentication auth) {

    if (motivo == null || motivo.isBlank()) {
        throw new ApiException(
            "Informe o motivo da rejeicao",
            HttpStatus.BAD_REQUEST
        );
    }

    Receita receita = repository.findById(id)
        .orElseThrow(() -> new ApiException(
            "Receita nao encontrada",
            HttpStatus.NOT_FOUND
        ));

    if (!"PENDENTE".equalsIgnoreCase(receita.getStatus())) {
        throw new ApiException(
            "Esta receita ja foi processada",
            HttpStatus.CONFLICT
        );
    }

    Farmaceutico farmaceutico = farmaceuticos
        .findByEmailIgnoreCase(auth.getName())
        .orElseThrow(() -> new ApiException(
            "Farmaceutico nao encontrado",
            HttpStatus.FORBIDDEN
        ));

    receita.setStatus("REJEITADA");
    receita.setDataValidacao(LocalDate.now());
    receita.setFarmaceutico(farmaceutico);
    receita.setMotivoRejeicao(motivo.trim());

    return new ReceitaResponse(repository.save(receita));
    }
}
