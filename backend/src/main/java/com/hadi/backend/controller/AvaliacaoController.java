package com.hadi.backend.controller;

import com.hadi.backend.dto.AvaliacaoDTO;
import com.hadi.backend.entity.Avaliacao;
import com.hadi.backend.entity.Cliente;
import com.hadi.backend.entity.Produto;
import com.hadi.backend.repository.AvaliacaoRepository;
import com.hadi.backend.repository.ClienteRepository;
import com.hadi.backend.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * API de Avaliação de produto:
 *  GET    /api/produto/{codigo}/avaliacoes  -> avaliações do produto + resumo (média, total, distribuição)
 *  POST   /api/avaliacao                    -> cria uma avaliação (cliente logado)
 *  DELETE /api/avaliacao/{codigo}           -> remove (painel admin, header X-Admin-Key)
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AvaliacaoController {

    @Autowired
    private AvaliacaoRepository avaliacaoRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Value("${hadi.admin.key:hadi-admin}")
    private String adminKey;

    @GetMapping("/produto/{codigo}/avaliacoes")
    public Map<String, Object> listarDoProduto(@PathVariable Long codigo) {
        List<AvaliacaoDTO> avaliacoes = avaliacaoRepository.findByProdutoCodigoOrderByDataDescCodigoDesc(codigo)
                .stream().map(AvaliacaoDTO::fromEntity).toList();

        int[] distribuicao = new int[5]; // índice 0 = 1 estrela ... índice 4 = 5 estrelas
        double soma = 0;
        for (AvaliacaoDTO a : avaliacoes) {
            distribuicao[a.getNota() - 1]++;
            soma += a.getNota();
        }
        Map<String, Integer> porNota = new LinkedHashMap<>();
        for (int n = 5; n >= 1; n--) porNota.put(String.valueOf(n), distribuicao[n - 1]);

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("media", avaliacoes.isEmpty() ? 0 : Math.round(soma / avaliacoes.size() * 10) / 10.0);
        resposta.put("total", avaliacoes.size());
        resposta.put("porNota", porNota);
        resposta.put("avaliacoes", avaliacoes);
        return resposta;
    }

    @PostMapping("/avaliacao")
    public AvaliacaoDTO avaliar(@RequestBody AvaliacaoDTO dto) {
        if (dto.getCodigoProduto() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o produto avaliado.");
        }
        if (dto.getNota() < 1 || dto.getNota() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A nota deve ser de 1 a 5 estrelas.");
        }
        if (dto.getTitulo() == null || dto.getTitulo().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dê um título para a sua avaliação.");
        }
        if (dto.getComentario() != null && dto.getComentario().length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O comentário pode ter no máximo 1000 caracteres.");
        }
        if (dto.getCodigoCliente() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faça login para avaliar o produto.");
        }
        Produto produto = produtoRepository.findById(dto.getCodigoProduto())
                .filter(Produto::isAtivo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        Cliente cliente = clienteRepository.findById(dto.getCodigoCliente())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente não encontrado. Faça login novamente."));
        if (avaliacaoRepository.existsByProdutoCodigoAndClienteCodigo(produto.getCodigo(), cliente.getCodigo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você já avaliou este produto.");
        }

        Avaliacao a = new Avaliacao();
        a.setProduto(produto);
        a.setCliente(cliente);
        a.setAutor(cliente.getNome());
        a.setNota(dto.getNota());
        a.setTitulo(dto.getTitulo().trim().toUpperCase());
        a.setComentario(dto.getComentario() == null ? null : dto.getComentario().trim());
        a.setTamanhoComprado(dto.getTamanhoComprado());
        a.setRecomenda(dto.getRecomenda() == null || dto.getRecomenda());
        a.setData(LocalDate.now());
        return AvaliacaoDTO.fromEntity(avaliacaoRepository.save(a));
    }

    @DeleteMapping("/avaliacao/{codigo}")
    public String excluir(@RequestHeader(value = "X-Admin-Key", required = false) String chave,
                          @PathVariable Long codigo) {
        if (chave == null || !chave.equals(adminKey)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chave de administrador inválida.");
        }
        if (!avaliacaoRepository.existsById(codigo)) {
            return "avaliação não encontrada!";
        }
        avaliacaoRepository.deleteById(codigo);
        return "Avaliação removida com sucesso!";
    }
}
