package com.drogaria.backend.service;

import com.drogaria.backend.dto.CadastroRequest;
import com.drogaria.backend.dto.LoginRequest;
import com.drogaria.backend.dto.UsuarioResponse;
import com.drogaria.backend.entity.Endereco;
import com.drogaria.backend.entity.Usuario;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.EnderecoRepository;
import com.drogaria.backend.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final EnderecoRepository enderecoRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UsuarioRepository usuarioRepository, EnderecoRepository enderecoRepository) {
        this.usuarioRepository = usuarioRepository;
        this.enderecoRepository = enderecoRepository;
    }

    public UsuarioResponse login(LoginRequest request) {
        String identificador = request.getIdentificador().trim();
        String cpfLimpo = identificador.replaceAll("\\D", "");

        Optional<Usuario> usuarioOpt;
        if (identificador.contains("@")) {
            usuarioOpt = usuarioRepository.findByEmail(identificador.toLowerCase());
        } else {
            usuarioOpt = usuarioRepository.findByCpf(cpfLimpo);
        }

        Usuario usuario = usuarioOpt
                .orElseThrow(() -> new ApiException("E-mail/CPF ou senha invalidos", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getSenha(), usuario.getSenha())) {
            throw new ApiException("E-mail/CPF ou senha invalidos", HttpStatus.UNAUTHORIZED);
        }

        if (!"ATIVO".equals(usuario.getStatusCadastro())) {
            throw new ApiException("Cadastro ainda nao esta ativo (" + usuario.getStatusCadastro() + ")",
                    HttpStatus.FORBIDDEN);
        }

        return new UsuarioResponse(usuario);
    }

    @Transactional
    public UsuarioResponse cadastrar(CadastroRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String cpf = request.getCpf().trim();

        if (usuarioRepository.existsByEmail(email)) {
            throw new ApiException("Ja existe uma conta com esse e-mail", HttpStatus.CONFLICT);
        }
        if (usuarioRepository.existsByCpf(cpf)) {
            throw new ApiException("Ja existe uma conta com esse CPF", HttpStatus.CONFLICT);
        }

        Usuario usuario = new Usuario();
        usuario.setNome(request.getNome().trim());
        usuario.setCpf(cpf);
        usuario.setEmail(email);
        usuario.setTelefone(request.getTelefone().trim());
        usuario.setSenha(passwordEncoder.encode(request.getSenha()));
        usuario.setStatusCadastro("ATIVO");

        usuario = usuarioRepository.save(usuario);

        Endereco endereco = new Endereco();
        endereco.setUsuario(usuario);
        endereco.setDescricao(request.getEndereco().trim());
        endereco.setPrincipal(true);
        enderecoRepository.save(endereco);

        return new UsuarioResponse(usuario);
    }
}
