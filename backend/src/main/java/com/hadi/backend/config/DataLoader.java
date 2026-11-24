package com.hadi.backend.config;

import com.hadi.backend.entity.Cliente;
import com.hadi.backend.entity.Produto;
import com.hadi.backend.repository.ClienteRepository;
import com.hadi.backend.repository.ProdutoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Popula o banco H2 (em memória) com os produtos que já existiam no frontend estático
 * (catalogo.html / index.html) e um cliente de demonstração, para que a apresentação
 * não comece com o site vazio.
 */
@Component
public class DataLoader implements CommandLineRunner {

    private final ProdutoRepository produtoRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(ProdutoRepository produtoRepository, ClienteRepository clienteRepository, PasswordEncoder passwordEncoder) {
        this.produtoRepository = produtoRepository;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (produtoRepository.count() == 0) {
            seedProdutos();
        }
        if (clienteRepository.count() == 0) {
            seedCliente();
        }
    }

    private void seedProdutos() {
        // Catálogo principal (catalogo.html)
        salvar("ARC'TERYX", "JAQUETA BETA AR GORE-TEX", "Jaquetas", "3499.90", null, "arcteryx-beta-ar.png", false);
        salvar("NIKE ACG", "ACTIVITORIUM THERMAL PANTS", "Calças", "899.90", null, "nike-acg-thermal-pants.png", false);
        salvar("SALOMON", "SALOMON LAB RECCO SOFTSHELL", "Jaquetas", "3499.90", null, "salomon-recco-softshell.png", false);
        salvar("COLUMBIA", "CSC BASIC LOGO T-SHIRT", "Camisetas", "179.99", "260.90", "columbia-logo-tshirt.png", false);
        salvar("PATAGONIA", "FUNHOGGERS SHORTS", "Shorts", "185.90", null, "patagonia-funhoggers-shorts.png", false);
        salvar("THE NORTH FACE", "POLAR FLEECE", "Jaquetas", "359.90", null, "tnf-polar-fleece.png", false);
        salvar("OAKLEY", "SOFTWARE WINDBREAKER", "Jaquetas", "600.00", null, "oakley-software-windbreaker.png", false);
        salvar("NIKE ACG", "NIKE ACG LICHEN FLEECE HOODIE - MOSS", "Moletons", "500.00", null, "nike-acg-lichen-fleece-hoodie.png", false);
        salvar("NIKE ACG", "NIKE ACG TRAIL SHORTS - MICA GREEN", "Shorts", "299.90", null, "nike-acg-trail-shorts.png", false);

        // Vitrine / SALE: ACESSÓRIOS (index.html)
        salvar("PATAGONIA", "PATAGONIA ATOM SLINGBAG 8L", "Acessórios", "270.99", "366.62", "patagonia-slingbag.png", true);
        salvar("OAKLEY", "SATISFY X OAKLEY - EYE JACKET DUNE", "Acessórios", "690.00", "1380.00", "oakley-eye-jacket-dune.png", true);
        salvar("ARC'TERYX", "ARC'TERYX BIRD HEAD NIGHTSCAPE/GLACIAL", "Acessórios", "390.00", "531.56", "arcteryx-bird-head-beanie.png", true);
        salvar("OAKLEY", "OAKLEY RADAR EV PATH - MASCULINO", "Acessórios", "999.00", "1670.00", "oakley-radar-ev-path.png", true);
    }

    private void salvar(String marca, String nome, String categoria, String preco, String precoOriginal, String imagem, boolean destaque) {
        Produto p = new Produto();
        p.setMarca(marca);
        p.setNome(nome);
        p.setDescricao(marca + " " + nome);
        p.setCategoria(categoria);
        p.setPreco(new BigDecimal(preco));
        p.setPrecoOriginal(precoOriginal != null ? new BigDecimal(precoOriginal) : null);
        p.setImagem(imagem);
        p.setDestaque(destaque);
        p.setAtivo(true);
        produtoRepository.save(p);
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
