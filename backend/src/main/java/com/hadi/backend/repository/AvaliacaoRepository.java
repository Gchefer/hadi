package com.hadi.backend.repository;

import com.hadi.backend.entity.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    List<Avaliacao> findByProdutoCodigoOrderByDataDescCodigoDesc(Long codigoProduto);

    /** Uma linha por produto: [codigoProduto, média das notas, quantidade]. */
    @Query("SELECT a.produto.codigo, AVG(a.nota), COUNT(a) FROM Avaliacao a GROUP BY a.produto.codigo")
    List<Object[]> resumoPorProduto();


    boolean existsByProdutoCodigoAndClienteCodigo(Long codigoProduto, Long codigoCliente);
}
