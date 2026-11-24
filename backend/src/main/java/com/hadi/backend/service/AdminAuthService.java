package com.hadi.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Login do painel admin. Usuário e senha vêm de hadi.admin.usuario / hadi.admin.senha
 * (variáveis de ambiente HADI_ADMIN_USUARIO / HADI_ADMIN_SENHA). O login devolve um token
 * aleatório, enviado depois no header X-Admin-Token. Os tokens ficam em memória: reiniciar
 * o backend desloga o admin.
 */
@Service
public class AdminAuthService {

    private static final Duration VALIDADE = Duration.ofHours(8);
    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${hadi.admin.usuario:admin}")
    private String usuario;

    @Value("${hadi.admin.senha:hadi-admin}")
    private String senha;

    private final Map<String, Instant> sessoes = new ConcurrentHashMap<>();

    /** Retorna um token novo se usuário/senha conferem; senão, 401. */
    public String login(String usuarioInformado, String senhaInformada) {
        // Compara os dois campos sempre (tempo constante) para não revelar qual deles errou.
        boolean ok = iguais(usuario, usuarioInformado) & iguais(senha, senhaInformada);
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário ou senha de administrador inválidos.");
        }
        limparExpiradas();
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessoes.put(token, Instant.now().plus(VALIDADE));
        return token;
    }

    public void logout(String token) {
        if (token != null) sessoes.remove(token);
    }

    /** Lança 401 se o token não existir ou estiver expirado. */
    public void exigirAdmin(String token) {
        Instant expira = token == null ? null : sessoes.get(token);
        if (expira == null || expira.isBefore(Instant.now())) {
            if (token != null) sessoes.remove(token);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão de administrador inválida ou expirada. Faça login novamente.");
        }
    }

    private void limparExpiradas() {
        Instant agora = Instant.now();
        sessoes.values().removeIf(exp -> exp.isBefore(agora));
    }

    private static boolean iguais(String esperado, String informado) {
        if (informado == null) informado = "";
        return MessageDigest.isEqual(esperado.getBytes(StandardCharsets.UTF_8), informado.getBytes(StandardCharsets.UTF_8));
    }
}
