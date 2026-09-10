package com.drogaria.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.Endereco;

public interface EnderecoRepository extends JpaRepository<Endereco, Integer> {
	List<Endereco> findByClienteId(Integer idCliente);
}
