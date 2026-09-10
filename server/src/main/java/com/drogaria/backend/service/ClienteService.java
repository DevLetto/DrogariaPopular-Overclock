package com.drogaria.backend.service;

import com.drogaria.backend.dto.*;
import com.drogaria.backend.entity.Cliente;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.ClienteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ClienteService {
	private final ClienteRepository r;

	public ClienteService(ClienteRepository r) {
		this.r = r;
	}

	public ClienteResponse buscar(Integer id) {
		return new ClienteResponse(
				r.findById(id).orElseThrow(() -> new ApiException("Cliente nao encontrado", HttpStatus.NOT_FOUND)));
	}

	public ClienteResponse atualizar(Integer id, ClienteUpdateRequest x) {
		Cliente c = r.findById(id).orElseThrow(() -> new ApiException("Cliente nao encontrado", HttpStatus.NOT_FOUND));
		c.setNome(x.getNome());
		c.setEmail(x.getEmail().toLowerCase());
		c.setTelefone(x.getTelefone());
		return new ClienteResponse(r.save(c));
	}

	public void excluir(Integer id) {
		Cliente c = r.findById(id).orElseThrow(() -> new ApiException("Cliente nao encontrado", HttpStatus.NOT_FOUND));
		c.setContaAprovada(false);
		r.save(c);
	}
}