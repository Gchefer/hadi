package com.hadi.backend.config;

import com.hadi.backend.entity.Cliente;
import com.hadi.backend.entity.Produto;
import com.hadi.backend.repository.AvaliacaoRepository;
import com.hadi.backend.repository.ClienteRepository;
import com.hadi.backend.repository.ProdutoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Popula o banco com os produtos que já existiam no frontend estático
 * (catalogo.html / index.html), um cliente de demonstração e avaliações de exemplo,
 * para que a apresentação não comece com o site vazio.
 *
 * Também completa os atributos de filtro (gênero, tamanhos, tecnologias, atividades)
 * de produtos que já estavam gravados no banco antes desses campos existirem.
 */
@Component
public class DataLoader implements CommandLineRunner {

    /** Produto de demonstração com os atributos usados pelos filtros do catálogo. */
    private record Seed(String marca, String nome, String categoria, String preco, String precoOriginal,
                        String imagem, boolean destaque, String departamento, String subcategoria,
                        String generos, String tamanhos, String tecnologias, String atividades) {
    }

    private static final List<Seed> PRODUTOS = List.of(
            // Catálogo principal (catalogo.html)
            new Seed("ARC'TERYX", "JAQUETA BETA AR GORE-TEX", "Jaquetas", "3499.90", null, "arcteryx-beta-ar.png", false,
                    "Roupas", "Jaquetas", "Homens", "P,M,G,GG", "Gore-Tex", "Trekking,Ski e Neve"),
            new Seed("NIKE ACG", "ACTIVITORIUM THERMAL PANTS", "Calças", "899.90", null, "nike-acg-thermal-pants.png", false,
                    "Roupas", "Calças", "Homens", "38,40,42,44", "Thermal", "Trekking,Ski e Neve"),
            new Seed("SALOMON", "SALOMON LAB RECCO SOFTSHELL", "Jaquetas", "3499.90", null, "salomon-recco-softshell.png", false,
                    "Roupas", "Jaquetas", "Homens,Mulheres,Unissex", "P,M,G", "Thermal", "Ski e Neve,Trekking"),
            new Seed("COLUMBIA", "CSC BASIC LOGO T-SHIRT", "Camisetas", "179.99", "260.90", "columbia-logo-tshirt.png", false,
                    "Roupas", "Camisetas", "Homens,Mulheres", "P,M,G,GG", "Proteção UV", "Casual,Trekking"),
            new Seed("PATAGONIA", "FUNHOGGERS SHORTS", "Shorts", "185.90", null, "patagonia-funhoggers-shorts.png", false,
                    "Roupas", "Shorts e Bermudas", "Homens", "P,M,G,GG", "Proteção UV", "Trail Running,Casual"),
            new Seed("THE NORTH FACE", "POLAR FLEECE", "Jaquetas", "359.90", null, "tnf-polar-fleece.png", false,
                    "Roupas", "Jaquetas", "Homens,Mulheres", "M,G,GG,2GG", "Thermal", "Casual,Trekking"),
            new Seed("OAKLEY", "SOFTWARE WINDBREAKER", "Jaquetas", "600.00", null, "oakley-software-windbreaker.png", false,
                    "Roupas", "Jaquetas", "Homens", "M,G,GG", "Proteção UV", "Trail Running"),
            new Seed("NIKE ACG", "NIKE ACG LICHEN FLEECE HOODIE - MOSS", "Moletons", "500.00", null, "nike-acg-lichen-fleece-hoodie.png", false,
                    "Roupas", "Jaquetas", "Mulheres", "PP,P,M,G", "Thermal", "Casual,Trekking"),
            new Seed("NIKE ACG", "NIKE ACG TRAIL SHORTS - MICA GREEN", "Shorts", "299.90", null, "nike-acg-trail-shorts.png", false,
                    "Roupas", "Shorts e Bermudas", "Mulheres", "PP,P,M,G", "Proteção UV", "Trail Running"),

            // Vitrine / SALE: ACESSÓRIOS (index.html)
            new Seed("PATAGONIA", "PATAGONIA ATOM SLINGBAG 8L", "Acessórios", "270.99", "366.62", "patagonia-slingbag.png", true,
                    "Acessórios", "Mochilas e Bolsas", "Homens,Mulheres,Unissex", "", "", "Casual,Trekking"),
            new Seed("OAKLEY", "SATISFY X OAKLEY - EYE JACKET DUNE", "Acessórios", "690.00", "1380.00", "oakley-eye-jacket-dune.png", true,
                    "Acessórios", "Óculos", "Homens,Mulheres,Unissex", "", "Proteção UV", "Casual"),
            new Seed("ARC'TERYX", "ARC'TERYX BIRD HEAD NIGHTSCAPE/GLACIAL", "Acessórios", "390.00", "531.56", "arcteryx-bird-head-beanie.png", true,
                    "Acessórios", "Headwear", "Homens,Mulheres,Unissex", "", "Thermal", "Ski e Neve"),
            new Seed("OAKLEY", "OAKLEY RADAR EV PATH - MASCULINO", "Acessórios", "999.00", "1670.00", "oakley-radar-ev-path.png", true,
                    "Acessórios", "Óculos", "Homens", "", "Proteção UV", "Trail Running,Ski e Neve")
    );

    private final ProdutoRepository produtoRepository;
    private final ClienteRepository clienteRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(ProdutoRepository produtoRepository, ClienteRepository clienteRepository,
                      AvaliacaoRepository avaliacaoRepository, PasswordEncoder passwordEncoder) {
        this.produtoRepository = produtoRepository;
        this.clienteRepository = clienteRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (produtoRepository.count() == 0) {
            PRODUTOS.forEach(this::salvar);
        } else {
            completarAtributosDeFiltro();
        }
        if (clienteRepository.count() == 0) {
            seedCliente();
        }
        if (avaliacaoRepository.count() == 0) {
            AvaliacoesDemo.popular(produtoRepository, avaliacaoRepository);
        }
    }

    private void salvar(Seed s) {
        Produto p = new Produto();
        p.setMarca(s.marca());
        p.setNome(s.nome());
        p.setDescricao(s.marca() + " " + s.nome());
        p.setCategoria(s.categoria());
        p.setPreco(new BigDecimal(s.preco()));
        p.setPrecoOriginal(s.precoOriginal() != null ? new BigDecimal(s.precoOriginal()) : null);
        p.setImagem(s.imagem());
        p.setDestaque(s.destaque());
        p.setAtivo(true);
        aplicarAtributos(p, s);
        produtoRepository.save(p);
    }

    private static void aplicarAtributos(Produto p, Seed s) {
        p.setDepartamento(s.departamento());
        p.setSubcategoria(s.subcategoria());
        p.setGeneros(s.generos());
        p.setTamanhos(s.tamanhos());
        p.setTecnologias(s.tecnologias());
        p.setAtividades(s.atividades());
    }

    /** Bancos criados antes dos filtros: preenche os atributos dos produtos de demonstração (pelo nome). */
    private void completarAtributosDeFiltro() {
        Map<String, Seed> porNome = PRODUTOS.stream().collect(Collectors.toMap(Seed::nome, s -> s));
        for (Produto p : produtoRepository.findAll()) {
            Seed s = porNome.get(p.getNome());
            if (s != null && p.getDepartamento() == null) {
                aplicarAtributos(p, s);
                produtoRepository.save(p);
            }
        }
    }

    private void seedCliente() {
        // Cliente de teste para a apresentação: login com gustavo@hadi.com / 12345678
        Cliente c = new Cliente();
        c.setNome("Gustavo Chefer");
        c.setEmail("gustavo@hadi.com");
        c.setSenha(passwordEncoder.encode("12345678"));
        c.setDocumento("52998224725"); // CPF válido (dígitos verificadores) para os testes
        c.setTelefone("11912345678");
        clienteRepository.save(c);
    }
}
