package com.drogaria.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.Produto;

public interface ProdutoRepository extends JpaRepository<Produto, Integer>{

}
