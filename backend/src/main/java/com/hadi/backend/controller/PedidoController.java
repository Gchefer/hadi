package com.hadi.backend.controller;

import com.hadi.backend.dto.PedidoDTO;
import com.hadi.backend.dto.PedidoRespostaDTO;
import com.hadi.backend.entity.Cliente;
import com.hadi.backend.entity.ItemPedido;
import com.hadi.backend.entity.Pedido;
import com.hadi.backend.entity.Produto;
import com.hadi.backend.repository.ClienteRepository;
import com.hadi.backend.repository.PedidoRepository;
import com.hadi.backend.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * API de Pedido, seguindo o contrato documentado em EndPointsAPIPedido.pdf:
 *  GET    /api/pedido/{codigo}  -> buscar pedido
 *  POST   /api/pedido           -> cadastrar pedido (gerado a partir do carrinho do checkout)
 *  PUT    /api/pedido           -> alterar pedido (ex: status/forma de pagamento)
 *  DELETE /api/pedido/{codigo}  -> excluir pedido
 *
 *  Bônus (não exigido pelo PDF, mas necessário para a aba "Meus Pedidos" de minha-conta.html):
 *  GET    /api/pedido/cliente/{codigoCliente} -> listar pedidos de um cliente
 */
@RestController
@RequestMapping("/api/pedido")
@CrossOrigin(origins = "*")
public class PedidoController {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    // readOnly transactional: com open-in-view=false, os itens (lazy) precisam ser lidos com a sessão aberta.
    @Transactional(readOnly = true)
    @GetMapping("/{codigo}")
    public Object buscarPorCodigo(@PathVariable Long codigo) {
        Optional<Pedido> pedido = pedidoRepository.findById(codigo);
        if (pedido.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        return PedidoRespostaDTO.fromEntity(pedido.get());
    }

    @Transactional(readOnly = true)
    @GetMapping("/cliente/{codigoCliente}")
    public List<PedidoRespostaDTO> listarPorCliente(@PathVariable Long codigoCliente) {
        return pedidoRepository.findByCliente_CodigoOrderByDataPedidoDesc(codigoCliente).stream()
                .map(PedidoRespostaDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @PostMapping
    public String cadastrar(@RequestBody PedidoDTO dto) {
        if (dto.getClienteCodigo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o cliente do pedido.");
        }
        Optional<Cliente> clienteOpt = clienteRepository.findById(dto.getClienteCodigo());
        if (clienteOpt.isEmpty()) {
            return "Cliente não encontrado!";
        }
        if (dto.getItens() == null || dto.getItens().isEmpty()) {
            return "Pedido sem itens!";
        }

        Pedido pedido = new Pedido();
        pedido.setCliente(clienteOpt.get());
        pedido.setFormaPagamento(dto.getFormaPagamento());

        BigDecimal total = BigDecimal.ZERO;
        for (PedidoDTO.ItemDTO itemDTO : dto.getItens()) {
            if (itemDTO.getProdutoCodigo() == null || itemDTO.getQuantidade() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Itens do pedido devem ter produto e quantidade maior que zero.");
            }
            Optional<Produto> produtoOpt = produtoRepository.findById(itemDTO.getProdutoCodigo());
            // Produto excluído (ativo = false) não pode mais ser vendido.
            if (produtoOpt.isEmpty() || !produtoOpt.get().isAtivo()) {
                return "produto não encontrado!";
            }
            Produto produto = produtoOpt.get();
            ItemPedido item = new ItemPedido();
            item.setPedido(pedido);
            item.setProduto(produto);
            item.setQuantidade(itemDTO.getQuantidade());
            item.setPrecoUnitario(produto.getPreco());
            pedido.getItens().add(item);
            total = total.add(produto.getPreco().multiply(BigDecimal.valueOf(itemDTO.getQuantidade())));
        }
        pedido.setValorTotal(total);

        pedidoRepository.save(pedido);
        return "Pedido gravado com sucesso! " + pedido.getCodigo();
    }

    @PutMapping
    public String alterar(@RequestBody PedidoDTO dto) {
        if (dto.getCodigo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o código do pedido a alterar.");
        }
        Optional<Pedido> existenteOpt = pedidoRepository.findById(dto.getCodigo());
        if (existenteOpt.isEmpty()) {
            return "Pedido não encontrado!";
        }
        Pedido pedido = existenteOpt.get();
        if (dto.getStatus() != null) {
            pedido.setStatus(dto.getStatus());
        }
        if (dto.getFormaPagamento() != null) {
            pedido.setFormaPagamento(dto.getFormaPagamento());
        }
        pedidoRepository.save(pedido);
        return "Pedido alterado com sucesso! " + pedido.getCodigo();
    }

    @DeleteMapping("/{codigo}")
    public String excluir(@PathVariable Long codigo) {
        if (!pedidoRepository.existsById(codigo)) {
            return "Pedido não encontrado!";
        }
        pedidoRepository.deleteById(codigo);
        return "Pedido removido com sucesso!";
    }
}
