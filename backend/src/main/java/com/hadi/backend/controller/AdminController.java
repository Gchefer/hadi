package com.hadi.backend.controller;

import com.hadi.backend.service.AdminAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Autenticação do painel admin:
 *  POST /api/admin/login   {usuario, senha}  -> {token}
 *  POST /api/admin/logout  (header X-Admin-Token)
 *  GET  /api/admin/sessao  (header X-Admin-Token) -> 200 se o token ainda vale, 401 se não
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminAuthService adminAuth;

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> corpo) {
        return Map.of("token", adminAuth.login(corpo.get("usuario"), corpo.get("senha")));
    }

    @PostMapping("/logout")
    public String logout(@RequestHeader(value = "X-Admin-Token", required = false) String token) {
        adminAuth.logout(token);
        return "Sessão encerrada.";
    }

    @GetMapping("/sessao")
    public String sessao(@RequestHeader(value = "X-Admin-Token", required = false) String token) {
        adminAuth.exigirAdmin(token);
        return "ok";
    }
}
