package com.drogaria.backend.controller;

import com.drogaria.backend.dto.*;
import com.drogaria.backend.service.CategoriaService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categoria")
public class CategoriaController {
	private final CategoriaService service;

	public CategoriaController(CategoriaService service) {
		this.service = service;
	}

	@GetMapping
	public List<CategoriaResponse> listar() {
		return service.listar();
	}

	@GetMapping("/{id}")
	public CategoriaResponse buscar(@PathVariable Integer id) {
		return service.buscar(id);
	}

	@PostMapping
	public ResponseEntity<CategoriaResponse> salvar(@Valid @RequestBody CategoriaRequest r) {
		return ResponseEntity.status(HttpStatus.CREATED).body(service.salvar(r));
	}

	@PutMapping("/{id}")
	public CategoriaResponse atualizar(@PathVariable Integer id, @Valid @RequestBody CategoriaRequest r) {
		return service.atualizar(id, r);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable Integer id) {
		service.excluir(id);
		return ResponseEntity.noContent().build();
	}
}