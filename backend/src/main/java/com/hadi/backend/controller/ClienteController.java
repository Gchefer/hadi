package com.hadi.backend.controller;

import com.hadi.backend.dto.*;
import com.hadi.backend.entity.Cliente;
import com.hadi.backend.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.hadi.backend.util.CpfValidator;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

/**
 * API de Cliente, seguindo o contrato documentado em EndPointsAPICliente.pdf:
 *  GET    /api/cliente/{codigo}          -> buscar cliente
 *  POST   /api/cliente                   -> cadastrar cliente
 *  PUT    /api/cliente                   -> atualizar cliente
 *  DELETE /api/cliente/{codigo}          -> excluir cliente
 *  POST   /api/cliente/login             -> autenticar cliente
 *  PATCH  /api/cliente/resetarSenha      -> resetar senha (fixa: Senha1234)
 *  PATCH  /api/cliente/alterarSenha      -> alterar senha (email + documento + nova senha)
 */
@RestController
@RequestMapping("/api/cliente")
@CrossOrigin(origins = "*")
public class ClienteController {

    private static final String SENHA_PADRAO_RESET = "Senha1234";

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/{codigo}")
    public Object buscarPorCodigo(@PathVariable Long codigo) {
        Optional<Cliente> cliente = clienteRepository.findById(codigo);
        if (cliente.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        return ClienteRespostaDTO.fromEntity(cliente.get());
    }

    @PostMapping
    public String cadastrar(@RequestBody ClienteDTO dto) {
        if (dto.getNome() == null || dto.getNome().isBlank()
                || dto.getEmail() == null || !dto.getEmail().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
                || dto.getSenha() == null || dto.getSenha().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Dados inválidos: informe nome, e-mail válido e senha com no mínimo 8 caracteres.");
        }
        if (clienteRepository.existsByEmail(dto.getEmail())) {
            return "E-mail já cadastrado!";
        }
        Cliente cliente = new Cliente();
        dto.copyToEntity(cliente);
        cliente.setSenha(passwordEncoder.encode(dto.getSenha()));
        clienteRepository.save(cliente);
        return "Cliente gravado com sucesso! " + cliente.getCodigo();
    }

    @PutMapping
    public String alterar(@RequestBody ClienteDTO dto) {
        if (dto.getCodigo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o código do cliente a alterar.");
        }
        Optional<Cliente> existenteOpt = clienteRepository.findById(dto.getCodigo());
        if (existenteOpt.isEmpty()) {
            return "Cliente não encontrado!";
        }
        if (dto.getDocumento() != null && !dto.getDocumento().isBlank() && !CpfValidator.isValido(dto.getDocumento())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF inválido.");
        }
        validarDadosPessoais(dto);
        Cliente cliente = existenteOpt.get();
        dto.copyToEntity(cliente);
        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            cliente.setSenha(passwordEncoder.encode(dto.getSenha()));
        }
        clienteRepository.save(cliente);
        return "Cliente alterado com sucesso! " + cliente.getCodigo();
    }

    /** Data de nascimento (yyyy-MM-dd, não futura, até 120 anos) e gênero (F/M/O). Vazio = "não informado". */
    private void validarDadosPessoais(ClienteDTO dto) {
        String nasc = dto.getDataNascimento();
        if (nasc != null && !nasc.isBlank()) {
            java.time.LocalDate data;
            try {
                data = java.time.LocalDate.parse(nasc);
            } catch (java.time.format.DateTimeParseException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data de nascimento inválida (use AAAA-MM-DD).");
            }
            java.time.LocalDate hoje = java.time.LocalDate.now();
            if (data.isAfter(hoje) || data.isBefore(hoje.minusYears(120))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data de nascimento inválida.");
            }
        }
        String genero = dto.getGenero();
        if (genero != null && !genero.isBlank() && !genero.matches("[FMO]")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gênero inválido.");
        }
    }

    @DeleteMapping("/{codigo}")
    public String excluir(@PathVariable Long codigo) {
        if (!clienteRepository.existsById(codigo)) {
            return "Cliente não encontrado!";
        }
        clienteRepository.deleteById(codigo);
        return "Cliente removido com sucesso!";
    }

    @PostMapping("/login")
    public Object login(@RequestBody LoginDTO dto) {
        Optional<Cliente> cliente = clienteRepository.findByEmail(dto.getEmail())
                .filter(c -> dto.getSenha() != null && passwordEncoder.matches(dto.getSenha(), c.getSenha()));
        if (cliente.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        return ClienteRespostaDTO.fromEntity(cliente.get());
    }

    @PatchMapping("/resetarSenha")
    public String resetarSenha(@RequestBody ResetarSenhaDTO dto) {
        Optional<Cliente> clienteOpt = clienteRepository.findByEmail(dto.getEmail());
        if (clienteOpt.isEmpty()) {
            return "Cliente não encontrado!";
        }
        Cliente cliente = clienteOpt.get();
        cliente.setSenha(passwordEncoder.encode(SENHA_PADRAO_RESET));
        clienteRepository.save(cliente);
        // TODO ENVIAR EMAIL — fora do escopo deste projeto (sem servidor de e-mail configurado)
        return "Sua senha foi reiniciada, verifique o seu email!";
    }

    @PatchMapping("/alterarSenha")
    public String alterarSenha(@RequestBody AlterarSenhaDTO dto) {
        Optional<Cliente> clienteOpt = clienteRepository.findByEmail(dto.getEmail());
        if (clienteOpt.isEmpty() || !java.util.Objects.equals(clienteOpt.get().getDocumento(), dto.getDocumento())) {
            return "Cliente não encontrado!";
        }
        Cliente cliente = clienteOpt.get();
        cliente.setSenha(passwordEncoder.encode(dto.getSenha()));
        clienteRepository.save(cliente);
        return "Sua senha foi alterada, verifique o seu email!";
    }
}
