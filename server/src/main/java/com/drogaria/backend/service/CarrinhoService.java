package com.drogaria.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.drogaria.backend.dto.CarrinhoResponse;
import com.drogaria.backend.entity.Carrinho_itens;
import com.drogaria.backend.repository.CarrinhoRepository;

@Service
public class CarrinhoService {

	private final CarrinhoRepository carrinhoRepository;

	public CarrinhoService(CarrinhoRepository carrinhoRepository) {
		this.carrinhoRepository = carrinhoRepository;
	}

	public List<CarrinhoResponse> buscar(Integer idUsuario) {

		List<Carrinho_itens> carrinho = carrinhoRepository.findByIdUsuario(idUsuario);

		return carrinho.stream().map(item -> new CarrinhoResponse(item)).toList();

	}

}
