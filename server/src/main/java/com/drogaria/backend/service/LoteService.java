package com.drogaria.backend.service;

import com.drogaria.backend.dto.LoteRequest;
import com.drogaria.backend.dto.LoteResponse;
import com.drogaria.backend.entity.Lote;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.EstoqueRepository;
import com.drogaria.backend.repository.LoteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class LoteService {
    private final LoteRepository repository;
    private final EstoqueRepository estoques;
    public LoteService(LoteRepository repository, EstoqueRepository estoques) { this.repository = repository; this.estoques = estoques; }
    public List<LoteResponse> listar() { return repository.findAll().stream().map(LoteResponse::new).toList(); }
    public LoteResponse buscar(String id) { return new LoteResponse(repository.findById(id).orElseThrow(() -> new ApiException("Lote nao encontrado", HttpStatus.NOT_FOUND))); }
    public LoteResponse salvar(LoteRequest request) {
        if (request.getDataValidade().isBefore(request.getDataFabricacao())) throw new ApiException("Validade invalida", HttpStatus.BAD_REQUEST);
        Lote lote = repository.findById(request.getNumeroLote()).orElse(new Lote());
        lote.setNumeroLote(request.getNumeroLote()); lote.setDataFabricacao(request.getDataFabricacao());
        lote.setDataValidade(request.getDataValidade()); lote.setQuantidade(request.getQuantidade());
        lote.setEstoque(estoques.findById(request.getIdEstoque()).orElseThrow(() -> new ApiException("Estoque nao encontrado", HttpStatus.NOT_FOUND)));
        return new LoteResponse(repository.save(lote));
    }
    public void excluir(String id) { if (!repository.existsById(id)) throw new ApiException("Lote nao encontrado", HttpStatus.NOT_FOUND); repository.deleteById(id); }
    public boolean vencido(String id) { return buscar(id).getDataValidade().isBefore(LocalDate.now()); }
}
