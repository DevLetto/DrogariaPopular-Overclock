package com.drogaria.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.drogaria.backend.dto.CarrinhoResponse;
import com.drogaria.backend.entity.Carrinho_itens;
import com.drogaria.backend.exception.ApiException;
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

	public CarrinhoResponse adicionar(Integer idUsuario, Integer idProduto, Integer quantidade,
			Integer salvoParaDepois) {

		Optional<Carrinho_itens> itemExistence = carrinhoRepository.findByIdUsuarioAndIdProduto(idUsuario, idProduto);

		Carrinho_itens item;

		if (itemExistence.isPresent()) {

			item = itemExistence.get();

			item.setQuantidade(item.getQuantidade() + quantidade);

		} else {

			item = new Carrinho_itens();

			item.setIdUsuario(idUsuario);
			item.setIdProduto(idProduto);
			item.setQuantidade(quantidade);
			item.setSalvoParaDepois(salvoParaDepois);

		}

		Carrinho_itens itemSalvo = carrinhoRepository.save(item);

		return new CarrinhoResponse(itemSalvo);

	}

	public CarrinhoResponse editar(Integer idUsuario, Integer idProduto, Integer quantidade, Integer salvoParaDepois) {

		Optional<Carrinho_itens> itemExistence = carrinhoRepository.findByIdUsuarioAndIdProduto(idUsuario, idProduto);

		Carrinho_itens item;

		item = itemExistence.get();

		item.setQuantidade(item.getQuantidade() + quantidade);

		item.setSalvoParaDepois(salvoParaDepois);

		Carrinho_itens itemSalvo = carrinhoRepository.save(item);

		return new CarrinhoResponse(itemSalvo);
	}
	
	public CarrinhoResponse deletar(Integer idUsuario, Integer idProduto) {
		
		Optional<Carrinho_itens> itemExistence = carrinhoRepository.findByIdUsuarioAndIdProduto(idUsuario, idProduto);
		
		Carrinho_itens item = itemExistence.get();
		
		carrinhoRepository.delete(item);
		
		return new CarrinhoResponse(item);
	}

}
