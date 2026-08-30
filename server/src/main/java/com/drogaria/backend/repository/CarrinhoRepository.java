package com.drogaria.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.Carrinho_itens;

public interface CarrinhoRepository extends JpaRepository<Carrinho_itens, Integer> {
	
	List<Carrinho_itens> findByIdUsuario(Integer idUsuario);
    
	Optional<Carrinho_itens> findByIdUsuarioAndIdProduto(
			Integer idUsuario,
			Integer idProduto
			);
	
}
	