package com.drogaria.backend.service;

import com.drogaria.backend.dto.*;
import com.drogaria.backend.entity.Categoria;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.CategoriaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoriaService {
	private final CategoriaRepository repository;

	public CategoriaService(CategoriaRepository repository) {
		this.repository = repository;
	}

	public List<CategoriaResponse> listar() {
		return repository.findAll().stream().map(CategoriaResponse::new).toList();
	}

	public CategoriaResponse buscar(Integer id) {
		return new CategoriaResponse(repository.findById(id)
				.orElseThrow(() -> new ApiException("Categoria nao encontrada", HttpStatus.NOT_FOUND)));
	}

	public CategoriaResponse salvar(CategoriaRequest r) {
		Categoria c = new Categoria();
		c.setNome(r.getNome().trim());
		return new CategoriaResponse(repository.save(c));
	}

	public CategoriaResponse atualizar(Integer id, CategoriaRequest r) {
		Categoria c = repository.findById(id)
				.orElseThrow(() -> new ApiException("Categoria nao encontrada", HttpStatus.NOT_FOUND));
		c.setNome(r.getNome().trim());
		return new CategoriaResponse(repository.save(c));
	}

	public void excluir(Integer id) {
		if (!repository.existsById(id))
			throw new ApiException("Categoria nao encontrada", HttpStatus.NOT_FOUND);
		repository.deleteById(id);
	}
}