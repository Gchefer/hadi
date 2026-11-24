package com.hadi.backend.repository;

import com.hadi.backend.entity.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    List<Produto> findByAtivoTrue();

    /** Produtos marcados para aparecer na vitrine/sale da home. */
    List<Produto> findByDestaqueTrueAndAtivoTrue();

    /**
     * Busca textual por marca, nome ou descrição.
     * O termo chega envolto em "%" pelo controller (equivalente ao LIKE do SQL).
     */
    @Query("SELECT p FROM Produto p WHERE p.ativo = true AND (" +
            "LOWER(p.nome) LIKE LOWER(:termo) OR " +
            "LOWER(p.marca) LIKE LOWER(:termo) OR " +
            "LOWER(p.descricao) LIKE LOWER(:termo))")
    List<Produto> fazerBusca(@Param("termo") String termo);
}
