
package com.drogaria.backend.service;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.drogaria.backend.dto.FuncionarioRequest;
import com.drogaria.backend.dto.FuncionarioResponse;
import com.drogaria.backend.entity.Administrador;
import com.drogaria.backend.entity.Atendente;
import com.drogaria.backend.entity.Farmaceutico;
import com.drogaria.backend.entity.Funcionario;
import com.drogaria.backend.entity.FuncionarioEstoqueLogistica;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.ClienteRepository;
import com.drogaria.backend.repository.FuncionarioRepository;

@Service
public class FuncionarioService {

	private final FuncionarioRepository repository;
	private final BCryptPasswordEncoder encoder;
	private final ClienteRepository clienteRepository;

	public FuncionarioService(FuncionarioRepository repository, ClienteRepository clienteRepository,
			BCryptPasswordEncoder encoder) {

		this.repository = repository;
		this.clienteRepository = clienteRepository;
		this.encoder = encoder;
	}

	public List<FuncionarioResponse> listar() {
		return repository.findAll().stream().map(FuncionarioResponse::new).toList();
	}

	public FuncionarioResponse buscar(Integer id) {

		Funcionario funcionario = repository.findById(id)
				.orElseThrow(() -> new ApiException("Funcionario nao encontrado", HttpStatus.NOT_FOUND));

		return new FuncionarioResponse(funcionario);
	}

	@Transactional
	public FuncionarioResponse salvar(FuncionarioRequest request) {

		String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

		if (repository.existsByEmail(email)) {
			throw new ApiException("Ja existe um funcionario com esse e-mail", HttpStatus.CONFLICT);
		}

		if (clienteRepository.existsByEmail(email)) {
			throw new ApiException("Ja existe um cliente com esse e-mail", HttpStatus.CONFLICT);
		}

		if (request.getSenha() == null || request.getSenha().isBlank()) {
			throw new ApiException("Informe uma senha para o funcionario", HttpStatus.BAD_REQUEST);
		}

		Funcionario funcionario = criarFuncionario(request.getTipoFuncionario());

		funcionario.setNome(request.getNome().trim());
		funcionario.setEmail(email);
		funcionario.setSenha(encoder.encode(request.getSenha()));

		return new FuncionarioResponse(repository.save(funcionario));
	}

	@Transactional
	public FuncionarioResponse atualizar(Integer id, FuncionarioRequest request) {

		Funcionario funcionario = repository.findById(id)
				.orElseThrow(() -> new ApiException("Funcionario nao encontrado", HttpStatus.NOT_FOUND));

		String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

		if (repository.findByEmail(email).filter(outro -> !outro.getId().equals(id)).isPresent()) {

			throw new ApiException("Ja existe outro funcionario com esse e-mail", HttpStatus.CONFLICT);
		}

		if (clienteRepository.existsByEmail(email)) {
			throw new ApiException("Ja existe um cliente com esse e-mail", HttpStatus.CONFLICT);
		}

		String tipoAtual = identificarTipo(funcionario);
		String tipoRecebido = normalizarTipo(request.getTipoFuncionario());

		if (!tipoAtual.equals(tipoRecebido)) {
			throw new ApiException("Nao e permitido alterar o cargo por esta operacao", HttpStatus.BAD_REQUEST);
		}

		funcionario.setNome(request.getNome().trim());
		funcionario.setEmail(email);

		if (request.getSenha() != null && !request.getSenha().isBlank()) {
			funcionario.setSenha(encoder.encode(request.getSenha()));
		}

		return new FuncionarioResponse(repository.save(funcionario));
	}

	@Transactional
	public void excluir(Integer id) {

		if (!repository.existsById(id)) {
			throw new ApiException("Funcionario nao encontrado", HttpStatus.NOT_FOUND);
		}

		repository.deleteById(id);
	}

	private Funcionario criarFuncionario(String tipo) {

		return switch (normalizarTipo(tipo)) {
		case "ADMINISTRADOR" -> new Administrador();
		case "FARMACEUTICO" -> new Farmaceutico();
		case "ATENDENTE" -> new Atendente();
		case "ESTOQUE_LOGISTICA" -> new FuncionarioEstoqueLogistica();

		default -> throw new ApiException("Tipo de funcionario invalido", HttpStatus.BAD_REQUEST);
		};
	}

	private String identificarTipo(Funcionario funcionario) {

		if (funcionario instanceof Administrador) {
			return "ADMINISTRADOR";
		}

		if (funcionario instanceof Farmaceutico) {
			return "FARMACEUTICO";
		}

		if (funcionario instanceof Atendente) {
			return "ATENDENTE";
		}

		if (funcionario instanceof FuncionarioEstoqueLogistica) {
			return "ESTOQUE_LOGISTICA";
		}

		return "FUNCIONARIO";
	}

	private String normalizarTipo(String tipo) {

		if (tipo == null || tipo.isBlank()) {
			throw new ApiException("Informe o tipo de funcionario", HttpStatus.BAD_REQUEST);
		}

		return tipo.trim().toUpperCase(Locale.ROOT);
	}
}
