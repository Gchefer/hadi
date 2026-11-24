package com.hadi.backend.controller;

import com.hadi.backend.service.FreteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Consulta de CEP e frete:
 *  GET /api/cep/{cep}                    -> endereço do CEP (ViaCEP)
 *  GET /api/frete/{cep}?subtotal=999.90  -> endereço + opções de entrega (PAC/SEDEX, valor e prazo)
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class FreteController {

    @Autowired
    private FreteService freteService;

    @GetMapping("/cep/{cep}")
    public Map<String, String> consultarCep(@PathVariable String cep) {
        return freteService.consultarEndereco(cep);
    }

    @GetMapping("/frete/{cep}")
    public Map<String, Object> calcularFrete(@PathVariable String cep,
                                             @RequestParam(required = false) BigDecimal subtotal) {
        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("cep", FreteService.normalizarCep(cep).replaceFirst("(\\d{5})(\\d{3})", "$1-$2"));
        try {
            resposta.put("endereco", freteService.consultarEndereco(cep));
        } catch (ResponseStatusException e) {
            if (e.getStatusCode().value() != 503) throw e; // CEP inexistente/inválido: erro para o usuário
            resposta.put("endereco", null);                  // ViaCEP fora do ar: ainda calcula o frete
        }
        resposta.put("opcoes", freteService.calcular(cep, subtotal));
        resposta.put("freteGratisAPartirDe", FreteService.FRETE_GRATIS_A_PARTIR_DE);
        return resposta;
    }
}
