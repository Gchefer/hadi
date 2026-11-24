package com.hadi.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Consulta de CEP (ViaCEP) e cálculo de frete.
 *
 * O endereço vem do ViaCEP (https://viacep.com.br). O valor do frete é calculado aqui mesmo,
 * pela região do CEP (o 1º dígito do CEP identifica a região dos Correios), saindo de São Paulo:
 * assim o pedido sempre consegue calcular o frete, mesmo se o ViaCEP estiver fora do ar.
 */
@Service
public class FreteService {

    /** Compras a partir deste valor têm PAC grátis (mesma regra anunciada na home). */
    public static final BigDecimal FRETE_GRATIS_A_PARTIR_DE = new BigDecimal("800.00");

    public record Opcao(String tipo, BigDecimal valor, int prazoDiasUteis) {
    }

    /** [PAC, prazo PAC, SEDEX, prazo SEDEX] por 1º dígito do CEP. */
    private static final Map<Character, Object[]> TABELA = Map.of(
            '0', new Object[]{"15.90", 5, "24.90", 2},   // SP (Grande SP)
            '1', new Object[]{"15.90", 5, "24.90", 2},   // SP (interior)
            '2', new Object[]{"19.90", 6, "32.90", 3},   // RJ / ES
            '3', new Object[]{"19.90", 6, "32.90", 3},   // MG
            '4', new Object[]{"27.90", 9, "46.90", 4},   // BA / SE
            '5', new Object[]{"27.90", 9, "46.90", 4},   // PE / AL / PB / RN
            '6', new Object[]{"34.90", 12, "59.90", 6},  // CE / PI / MA / Norte
            '7', new Object[]{"25.90", 8, "42.90", 4},   // DF / GO / TO / MT / MS / RO
            '8', new Object[]{"21.90", 7, "36.90", 3},   // PR / SC
            '9', new Object[]{"21.90", 7, "36.90", 3}    // RS
    );

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();
    private final ObjectMapper json = new ObjectMapper();

    public static String normalizarCep(String cep) {
        String digitos = cep == null ? "" : cep.replaceAll("\\D", "");
        if (digitos.length() != 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CEP inválido. Use o formato 00000-000.");
        }
        return digitos;
    }

    /** Opções de entrega para o CEP, considerando o frete grátis pelo subtotal. */
    public List<Opcao> calcular(String cep, BigDecimal subtotal) {
        Object[] t = TABELA.get(normalizarCep(cep).charAt(0));
        boolean gratis = subtotal != null && subtotal.compareTo(FRETE_GRATIS_A_PARTIR_DE) >= 0;
        return List.of(
                new Opcao("PAC", gratis ? BigDecimal.ZERO.setScale(2) : new BigDecimal((String) t[0]), (int) t[1]),
                new Opcao("SEDEX", new BigDecimal((String) t[2]), (int) t[3]));
    }

    /** Valor do frete para o tipo escolhido (PAC/SEDEX). */
    public Opcao opcao(String cep, String tipo, BigDecimal subtotal) {
        return calcular(cep, subtotal).stream()
                .filter(o -> o.tipo().equalsIgnoreCase(tipo == null ? "PAC" : tipo.trim()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de entrega inválido. Use PAC ou SEDEX."));
    }

    /** Endereço do CEP pelo ViaCEP: logradouro, bairro, cidade, uf. */
    public Map<String, String> consultarEndereco(String cep) {
        String digitos = normalizarCep(cep);
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://viacep.com.br/ws/" + digitos + "/json/"))
                    .timeout(Duration.ofSeconds(5)).GET().build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 400) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CEP inválido.");
            }
            JsonNode n = json.readTree(resp.body());
            if (n.path("erro").asBoolean(false) || n.path("erro").asText().equals("true")) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CEP não encontrado.");
            }
            Map<String, String> endereco = new LinkedHashMap<>();
            endereco.put("cep", digitos.substring(0, 5) + "-" + digitos.substring(5));
            endereco.put("logradouro", n.path("logradouro").asText(""));
            endereco.put("bairro", n.path("bairro").asText(""));
            endereco.put("cidade", n.path("localidade").asText(""));
            endereco.put("uf", n.path("uf").asText(""));
            return endereco;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Não foi possível consultar o CEP agora.");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Não foi possível consultar o CEP agora.");
        }
    }
}
