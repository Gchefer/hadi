package com.hadi.backend.controller;

import com.hadi.backend.dto.ProdutoDTO;
import com.hadi.backend.entity.Produto;
import com.hadi.backend.repository.AvaliacaoRepository;
import com.hadi.backend.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * API de Produto, seguindo o contrato documentado em EndPointsAPIProduto.pdf:
 *  GET    /api/produto/{codigo}        -> consultar por código
 *  POST   /api/produto                 -> cadastrar
 *  PUT    /api/produto                  -> alterar
 *  DELETE /api/produto/{codigo}        -> excluir
 *  GET    /api/produtos                -> listar todos
 *  GET    /api/produto/vitrine         -> produtos em destaque (home)
 *  GET    /api/produto/busca/{termo}   -> busca textual (LIKE %termo%)
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ProdutoController {

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private AvaliacaoRepository avaliacaoRepository;

    /** Converte para DTO já com média e total de avaliações (estrelas nos cards e na página do produto). */
    private List<ProdutoDTO> comAvaliacoes(List<Produto> produtos) {
        Map<Long, Object[]> resumo = new HashMap<>();
        for (Object[] linha : avaliacaoRepository.resumoPorProduto()) resumo.put((Long) linha[0], linha);
        return produtos.stream().map(p -> {
            ProdutoDTO dto = ProdutoDTO.fromEntity(p);
            Object[] r = resumo.get(p.getCodigo());
            if (r != null) {
                dto.setMediaAvaliacoes(Math.round(((Number) r[1]).doubleValue() * 10) / 10.0);
                dto.setTotalAvaliacoes(((Number) r[2]).longValue());
            }
            return dto;
        }).collect(Collectors.toList());
    }

    /** Chave do painel admin (header X-Admin-Key). Configurável em hadi.admin.key. */
    @Value("${hadi.admin.key:hadi-admin}")
    private String adminKey;

    @Value("${hadi.uploads.dir:uploads}")
    private String uploadsDir;

    private void exigirAdmin(String chave) {
        if (chave == null || !chave.equals(adminKey)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chave de administrador inválida.");
        }
    }

    private void validar(ProdutoDTO dto) {
        if (dto.getMarca() == null || dto.getMarca().isBlank()
                || dto.getNome() == null || dto.getNome().isBlank()
                || dto.getPreco() == null || dto.getPreco().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe marca, nome e preço maior que zero.");
        }
    }

    @GetMapping("/produto/{codigo}")
    public Object buscarPorCodigo(@PathVariable Long codigo) {
        Optional<Produto> produto = produtoRepository.findById(codigo);
        if (produto.isEmpty() || !produto.get().isAtivo()) {
            return java.util.Collections.emptyMap(); // {} — contrato documentado para "não encontrado"
        }
        return comAvaliacoes(List.of(produto.get())).get(0);
    }

    @PostMapping("/produto")
    public String cadastrar(@RequestHeader(value = "X-Admin-Key", required = false) String chave,
                            @RequestBody ProdutoDTO dto) {
        exigirAdmin(chave);
        validar(dto);
        Produto produto = new Produto();
        aplicarDTO(dto, produto);
        produto.setAtivo(true);
        produtoRepository.save(produto);
        return "Produto gravado com sucesso! " + produto.getCodigo();
    }

    @PutMapping("/produto")
    public String alterar(@RequestHeader(value = "X-Admin-Key", required = false) String chave,
                          @RequestBody ProdutoDTO dto) {
        exigirAdmin(chave);
        validar(dto);
        if (dto.getCodigo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o código do produto a alterar.");
        }
        Optional<Produto> existenteOpt = produtoRepository.findById(dto.getCodigo());
        if (existenteOpt.isEmpty()) {
            return "produto não encontrado!";
        }
        Produto produto = existenteOpt.get();
        aplicarDTO(dto, produto);
        produtoRepository.save(produto);
        return "Produto alterado com sucesso! " + produto.getCodigo();
    }

    @DeleteMapping("/produto/{codigo}")
    public String excluir(@RequestHeader(value = "X-Admin-Key", required = false) String chave,
                          @PathVariable Long codigo) {
        exigirAdmin(chave);
        Optional<Produto> opt = produtoRepository.findById(codigo);
        if (opt.isEmpty()) {
            return "produto não encontrado!";
        }
        // Exclusão lógica: preserva o histórico de pedidos que já contêm o produto (chave estrangeira).
        Produto produto = opt.get();
        produto.setAtivo(false);
        produtoRepository.save(produto);
        return "Produto removido com sucesso!";
    }

    /** Upload de foto do produto (painel admin). Retorna o caminho relativo, ex: uploads/abc123.png */
    @PostMapping("/produto/imagem")
    public String enviarImagem(@RequestHeader(value = "X-Admin-Key", required = false) String chave,
                               @RequestParam("arquivo") MultipartFile arquivo) throws IOException {
        exigirAdmin(chave);
        String original = arquivo.getOriginalFilename() == null ? "" : arquivo.getOriginalFilename().toLowerCase();
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
        if (!ext.matches("\\.(png|jpe?g|webp|gif)")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Envie uma imagem PNG, JPG, WEBP ou GIF.");
        }
        Path dir = Paths.get(uploadsDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        String nome = UUID.randomUUID() + ext;
        Files.copy(arquivo.getInputStream(), dir.resolve(nome), StandardCopyOption.REPLACE_EXISTING);
        return "uploads/" + nome;
    }

    @GetMapping("/produtos")
    public List<ProdutoDTO> listarTodos() {
        return comAvaliacoes(produtoRepository.findByAtivoTrue());
    }

    @GetMapping("/produto/vitrine")
    public List<ProdutoDTO> carregarVitrine() {
        return comAvaliacoes(produtoRepository.findByDestaqueTrueAndAtivoTrue());
    }

    @GetMapping("/produto/busca/{termo}")
    public List<ProdutoDTO> buscarPorDescricao(@PathVariable String termo) {
        return comAvaliacoes(produtoRepository.fazerBusca("%" + termo + "%"));
    }

    private void aplicarDTO(ProdutoDTO dto, Produto produto) {
        produto.setMarca(dto.getMarca());
        produto.setNome(dto.getNome());
        produto.setDescricao(dto.getDescricao());
        produto.setCategoria(dto.getCategoria());
        produto.setPreco(dto.getPreco());
        produto.setPrecoOriginal(dto.getPrecoOriginal());
        produto.setImagem(dto.getImagem());
        produto.setDestaque(dto.isDestaque());
        // Atributos de filtro: só altera os que vierem preenchidos (o painel admin pode não enviá-los)
        if (dto.getDepartamento() != null) produto.setDepartamento(dto.getDepartamento());
        if (dto.getSubcategoria() != null) produto.setSubcategoria(dto.getSubcategoria());
        if (dto.getGeneros() != null) produto.setGeneros(dto.getGeneros());
        if (dto.getTamanhos() != null) produto.setTamanhos(dto.getTamanhos());
        if (dto.getTecnologias() != null) produto.setTecnologias(dto.getTecnologias());
        if (dto.getAtividades() != null) produto.setAtividades(dto.getAtividades());
    }
}
