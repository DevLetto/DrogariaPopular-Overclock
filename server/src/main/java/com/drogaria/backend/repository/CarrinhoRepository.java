package com.drogaria.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.Carrinho;

public interface CarrinhoRepository extends JpaRepository<Carrinho, Integer> {
	Optional<Carrinho> findByClienteId(Integer idCliente);
}
	