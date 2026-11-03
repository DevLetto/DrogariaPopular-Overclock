package com.drogaria.backend.controller;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.drogaria.backend.dto.ReceitaRequest;
import com.drogaria.backend.dto.ReceitaResponse;
import com.drogaria.backend.service.CarrinhoService;
import com.drogaria.backend.service.ReceitaService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/receita")
public class ReceitaController {
	private final ReceitaService s;
	private final CarrinhoService a;

	public ReceitaController(ReceitaService s, CarrinhoService a) {
		this.s = s;
		this.a = a;	
	}

	@GetMapping
	public List<ReceitaResponse> listar() {
		return s.listar();
	}

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<ReceitaResponse> enviar(@Valid @RequestBody ReceitaRequest r, Authentication x) {
		a.validarAcesso(r.getIdCliente(), x);
		return ResponseEntity.status(HttpStatus.CREATED).body(s.enviar(r));
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ReceitaResponse> enviarArquivo(
			@RequestParam("arquivo") MultipartFile arquivo,
			@RequestParam(value = "idCliente", required = false) Integer idCliente,
			Authentication authentication) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(s.enviarArquivo(arquivo, idCliente, authentication));
	}

	@GetMapping("/{id}")
	public ReceitaResponse buscar(
			@PathVariable Integer id,
			Authentication auth) {
		return s.buscar(id, auth);
	}

	@GetMapping("/{id}/arquivo")
	public ResponseEntity<Resource> baixarArquivo(
			@PathVariable Integer id,
			Authentication authentication) {
		return s.baixarArquivo(id, authentication);
	}

	@GetMapping("/cliente/{id}")
	public List<ReceitaResponse> cliente(@PathVariable Integer id, Authentication x) {
		a.validarAcesso(id, x);
		return s.cliente(id);
	}

	@PutMapping("/{id}/aprovar")
    public ReceitaResponse aprovar(
        @PathVariable Integer id,
        Authentication auth) {

    return s.aprovar(id, auth);
    }

	@PutMapping("/{id}/rejeitar")
    public ReceitaResponse rejeitar(
        @PathVariable Integer id,
        @RequestParam("motivo") String motivo,
        Authentication auth) {

    return s.rejeitar(id, motivo, auth);
    }
}   