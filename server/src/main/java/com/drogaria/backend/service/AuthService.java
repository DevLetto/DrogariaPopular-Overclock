package com.drogaria.backend.service;

import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.drogaria.backend.dto.CadastroRequest;
import com.drogaria.backend.dto.ClienteResponse;
import com.drogaria.backend.dto.LoginRequest;
import com.drogaria.backend.entity.Cliente;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.ClienteRepository;
import com.drogaria.backend.repository.EnderecoRepository;

@Service
public class AuthService {

    private final ClienteRepository clienteRepository;
    private final EnderecoRepository enderecoRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${app.security.admin-emails:}")
    private String adminEmails;
    @Value("${app.security.pharmacist-emails:}")
    private String pharmacistEmails;
    @Value("${app.security.attendant-emails:}")
    private String attendantEmails;
    @Value("${app.security.stock-emails:}")
    private String stockEmails;

    public AuthService(ClienteRepository clienteRepository, EnderecoRepository enderecoRepository,
            BCryptPasswordEncoder passwordEncoder) {
        this.clienteRepository = clienteRepository;
        this.enderecoRepository = enderecoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public ClienteResponse login(LoginRequest request) {
        String identificador = request.getIdentificador().trim();
        String cpfLimpo = identificador.replaceAll("\\D", "");

        Optional<Cliente> clienteOpt;
        if (identificador.contains("@")) {
            clienteOpt = clienteRepository.findByEmail(identificador.toLowerCase());
        } else {
            clienteOpt = clienteRepository.findByCpf(cpfLimpo);
        }

        Cliente cliente = clienteOpt
                .orElseThrow(() -> new ApiException("E-mail/CPF ou senha invalidos", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getSenha(), cliente.getSenha())) {
            throw new ApiException("E-mail/CPF ou senha invalidos", HttpStatus.UNAUTHORIZED);
        }

        if (!cliente.isContaAprovada()) {
            throw new ApiException("Cadastro ainda nao foi aprovado", HttpStatus.FORBIDDEN);
        }

        String role = autenticarNaSessao(cliente);
        ClienteResponse response = new ClienteResponse(cliente);
        response.setRole(role);
        return response;
    }

    @Transactional
    public ClienteResponse cadastrar(CadastroRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String cpf = request.getCpf().trim();

        if (clienteRepository.existsByEmail(email)) {
            throw new ApiException("Ja existe uma conta com esse e-mail", HttpStatus.CONFLICT);
        }
        if (clienteRepository.existsByCpf(cpf)) {
            throw new ApiException("Ja existe uma conta com esse CPF", HttpStatus.CONFLICT);
        }

        Cliente cliente = new Cliente();
        cliente.setNome(request.getNome().trim());
        cliente.setCpf(cpf);
        cliente.setEmail(email);
        cliente.setTelefone(request.getTelefone().trim());
        cliente.setSenha(passwordEncoder.encode(request.getSenha()));
        cliente.setDataCadastro(java.time.LocalDate.now());
        cliente.setContaAprovada(false);

        cliente = clienteRepository.save(cliente);
        return new ClienteResponse(cliente);
    }

    private String autenticarNaSessao(Cliente cliente) {
        String email = cliente.getEmail().toLowerCase();
        String role = emailsAdministrativos().contains(email) ? "ROLE_ADMINISTRADOR"
            : emails(pharmacistEmails).contains(email) ? "ROLE_FARMACEUTICO"
            : emails(attendantEmails).contains(email) ? "ROLE_ATENDENTE"
            : emails(stockEmails).contains(email) ? "ROLE_FUNCIONARIO_ESTOQUE_LOGISTICA"
            : "ROLE_CLIENTE";
        Authentication authentication = new UsernamePasswordAuthenticationToken(
            cliente.getEmail(), null, java.util.List.of(() -> role));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return role;
    }

    private Set<String> emailsAdministrativos() {
        return emails(adminEmails);
    }

    private Set<String> emails(String value) {
        return Arrays.stream(value.split(","))
            .map(String::trim)
            .map(String::toLowerCase)
            .filter(email -> !email.isBlank())
            .collect(Collectors.toSet());
    }
}