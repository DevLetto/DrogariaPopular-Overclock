package com.drogaria.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.Produto;
import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, Integer>{
	List<Produto> findByCategoriaId(Integer idCategoria);

}
