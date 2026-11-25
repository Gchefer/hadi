# API HADI — Referência

URL base: `http://localhost:8080/api`. Todas as requisições e respostas usam JSON, exceto onde estiver indicado.
CORS está liberado para qualquer origem.

## Convenções

- **Erros de validação** voltam com status HTTP de erro (`400`, `401`, `404`, `409`, `503`) e um JSON do Spring
  com o motivo no campo `message`, por exemplo `{"status":400,"message":"CPF inválido.", ...}`.
- **"Não encontrado"** segue o contrato original da API e **não** usa 404. As buscas por código devolvem `{}`,
  e as operações de escrita devolvem texto puro, como `"produto não encontrado!"`.
- **Sucesso em escrita** (`POST`, `PUT`, `DELETE`) devolve texto puro, em geral com o código gerado no final.
  Exemplo: `"Pedido gravado com sucesso! 12"`.
- 🔒 **Rotas de admin** exigem o header `X-Admin-Token: <token>`, obtido em [`POST /admin/login`](#admin).
  Sem token, ou com token expirado (8 h), a resposta é `401`.

---

## Produto

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/produtos` | Todos os produtos ativos |
| `GET` | `/produto/vitrine` | Produtos ativos com `destaque = true` (home) |
| `GET` | `/produto/{codigo}` | Um produto. Devolve `{}` se não existir ou estiver inativo |
| `GET` | `/produto/busca/{termo}` | Busca por texto (`LIKE %termo%`) |
| `POST` | `/produto` 🔒 | Cadastra. Resposta: `"Produto gravado com sucesso! {codigo}"` |
| `PUT` | `/produto` 🔒 | Altera (`codigo` obrigatório no corpo) |
| `DELETE` | `/produto/{codigo}` 🔒 | Exclusão lógica (`ativo = false`) |
| `POST` | `/produto/imagem` 🔒 | Upload `multipart/form-data`, campo `arquivo` (PNG/JPG/WEBP/GIF, até 5 MB). Resposta: `"uploads/<uuid>.png"` |

**Produto (resposta):**

```json
{
  "codigo": 1,
  "marca": "Arc'teryx",
  "nome": "Jaqueta Beta AR Gore-Tex",
  "descricao": "...",
  "categoria": "Jaquetas",
  "preco": 4299.90,
  "precoOriginal": 4999.90,
  "imagem": "images/beta-ar.png",
  "destaque": true,
  "departamento": "Roupas",
  "subcategoria": "Jaquetas",
  "generos": "Homens,Mulheres",
  "tamanhos": "P,M,G,GG",
  "tecnologias": "Gore-Tex",
  "atividades": "Trekking,Ski e Neve",
  "mediaAvaliacoes": 4.6,
  "totalAvaliacoes": 12
}
```

No cadastro e na edição, `marca`, `nome` e `preco` (> 0) são obrigatórios. Se os campos de filtro
(`departamento` … `atividades`) vierem nulos na edição, os valores atuais são mantidos.
O campo `imagem` pode ser um caminho do site (`images/...`) ou um upload (`uploads/...`). Os uploads são
servidos em `http://localhost:8080/uploads/<arquivo>`.

---

## Cliente

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/cliente/{codigo}` | Dados do cliente (sem senha). `{}` se não existir |
| `POST` | `/cliente` | Cadastro. Resposta: `"Cliente gravado com sucesso! {codigo}"` ou `"E-mail já cadastrado!"` |
| `PUT` | `/cliente` | Altera dados pessoais e endereço (`codigo` obrigatório) |
| `DELETE` | `/cliente/{codigo}` | Remove o cliente |
| `POST` | `/cliente/login` | `{"email","senha"}` → dados do cliente, ou `{}` se as credenciais estiverem erradas |
| `PATCH` | `/cliente/resetarSenha` | `{"email"}` → redefine a senha para `Senha1234` |
| `PATCH` | `/cliente/alterarSenha` | `{"email","documento","senha"}` → nova senha, se e-mail e CPF conferirem |

**Cliente (corpo de cadastro/edição):**

```json
{
  "codigo": 1,
  "nome": "Gustavo",
  "email": "gustavo@hadi.com",
  "senha": "12345678",
  "documento": "529.982.247-25",
  "telefone": "(11) 99999-9999",
  "cep": "01310-100",
  "endereco": "Av. Paulista",
  "numero": "1000",
  "complemento": "ap 12",
  "cidade": "São Paulo",
  "estado": "SP",
  "dataNascimento": "1999-05-20",
  "genero": "Masculino"
}
```

Validações: nome e e-mail obrigatórios, senha com no mínimo 8 caracteres no cadastro, CPF válido
(dígitos verificadores), `dataNascimento` no formato `AAAA-MM-DD`. A senha é gravada com hash BCrypt e
nunca volta nas respostas.

---

## Pedido

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/pedido/{codigo}` | Um pedido. `{}` se não existir |
| `GET` | `/pedido/cliente/{codigoCliente}` | Pedidos do cliente |
| `POST` | `/pedido` | Cria o pedido. Resposta: `"Pedido gravado com sucesso! {codigo}"` |
| `PUT` | `/pedido` | Altera `status` e/ou `formaPagamento` (`codigo` obrigatório) |
| `DELETE` | `/pedido/{codigo}` | Remove o pedido |

**Criar pedido:**

```json
{
  "clienteCodigo": 1,
  "itens": [
    { "produtoCodigo": 3, "quantidade": 1 },
    { "produtoCodigo": 7, "quantidade": 2 }
  ],
  "formaPagamento": "PIX",
  "cepEntrega": "01310-100",
  "tipoEntrega": "SEDEX"
}
```

O servidor usa o **preço atual de cada produto** e calcula o frete a partir de `cepEntrega` e
`tipoEntrega` (`PAC`, que é o padrão, ou `SEDEX`). O total é a soma dos itens com o frete. Valores
enviados pelo navegador não são usados. Produtos inativos são recusados (`"produto não encontrado!"`).
O pedido começa com `status = "RECEBIDO"`.

**Pedido (resposta):**

```json
{
  "codigo": 12,
  "clienteCodigo": 1,
  "clienteNome": "Gustavo",
  "itens": [
    { "produtoCodigo": 3, "produtoNome": "...", "produtoImagem": "...", "quantidade": 1, "precoUnitario": 899.90 }
  ],
  "valorTotal": 932.80,
  "valorFrete": 32.90,
  "tipoEntrega": "SEDEX",
  "cepEntrega": "01310100",
  "formaPagamento": "PIX",
  "status": "RECEBIDO",
  "dataPedido": "2026-11-24T19:30:00"
}
```

---

## Avaliação

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/produto/{codigo}/avaliacoes` | Resumo e lista das avaliações do produto |
| `POST` | `/avaliacao` | Cria uma avaliação (cliente logado, uma por produto) |
| `DELETE` | `/avaliacao/{codigo}` 🔒 | Remove uma avaliação |

**Resposta de `GET /produto/{codigo}/avaliacoes`:**

```json
{
  "media": 4.6,
  "total": 12,
  "porNota": { "5": 8, "4": 3, "3": 1, "2": 0, "1": 0 },
  "avaliacoes": [
    {
      "codigo": 5, "codigoProduto": 1, "autor": "M**RCIA J.",
      "nota": 5, "titulo": "Excelente", "comentario": "...",
      "tamanhoComprado": "M", "recomenda": true, "data": "2026-11-20"
    }
  ]
}
```

**Criar avaliação:** `{"codigoProduto", "codigoCliente", "nota", "titulo", "comentario", "tamanhoComprado", "recomenda"}`.
Regras: `nota` de 1 a 5, `titulo` obrigatório, `comentario` com até 1000 caracteres.
Sem cliente válido, a resposta é `401`. Se o cliente já avaliou o produto, `409`.

---

## CEP e frete

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/cep/{cep}` | Endereço pelo ViaCEP: `{"cep","logradouro","bairro","cidade","uf"}` |
| `GET` | `/frete/{cep}?subtotal=999.90` | Endereço + opções de entrega |

**Resposta de `/frete`:**

```json
{
  "cep": "01310-100",
  "endereco": { "cep": "01310-100", "logradouro": "Avenida Paulista", "bairro": "Bela Vista", "cidade": "São Paulo", "uf": "SP" },
  "opcoes": [
    { "tipo": "PAC",   "valor": 15.90, "prazoDiasUteis": 5 },
    { "tipo": "SEDEX", "valor": 24.90, "prazoDiasUteis": 2 }
  ],
  "freteGratisAPartirDe": 800.00
}
```

O valor depende do **1º dígito do CEP** (região dos Correios), saindo de São Paulo:

| 1º dígito | Região | PAC | Prazo PAC | SEDEX | Prazo SEDEX |
|---|---|---|---|---|---|
| 0, 1 | SP | R$ 15,90 | 5 d.u. | R$ 24,90 | 2 d.u. |
| 2, 3 | RJ, ES, MG | R$ 19,90 | 6 d.u. | R$ 32,90 | 3 d.u. |
| 4, 5 | BA, SE, PE, AL, PB, RN | R$ 27,90 | 9 d.u. | R$ 46,90 | 4 d.u. |
| 6 | CE, PI, MA, Norte | R$ 34,90 | 12 d.u. | R$ 59,90 | 6 d.u. |
| 7 | DF, GO, TO, MT, MS, RO | R$ 25,90 | 8 d.u. | R$ 42,90 | 4 d.u. |
| 8, 9 | PR, SC, RS | R$ 21,90 | 7 d.u. | R$ 36,90 | 3 d.u. |

Com `subtotal` ≥ R$ 800, o PAC sai grátis. Se o ViaCEP estiver fora do ar, `endereco` vem `null`, mas o
frete é calculado do mesmo jeito. CEP com formato inválido devolve `400`, e CEP inexistente devolve `404`.

---

## Admin

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/admin/login` | `{"usuario","senha"}` → `{"token":"..."}` (ou `401`) |
| `POST` | `/admin/logout` | Invalida o token do header `X-Admin-Token` |
| `GET` | `/admin/sessao` | `"ok"` se o token for válido, senão `401` |

Usuário e senha vêm de `HADI_ADMIN_USUARIO` / `HADI_ADMIN_SENHA` (padrão `admin` / `hadi-admin`).
Os tokens ficam em memória e se perdem quando o backend reinicia.

---

## Limitações conhecidas

Pontos a resolver antes de um uso real (o projeto é acadêmico):

- **Clientes não têm token de sessão.** As rotas de cliente e de pedido (`GET`/`PUT`/`DELETE`) não verificam
  quem está chamando. Qualquer um que saiba o código pode ler, alterar ou excluir registros.
- `alterarSenha` exige só e-mail + CPF.
- `POST /avaliacao` confia no `codigoCliente` enviado no corpo da requisição.
- `resetarSenha` não envia e-mail (`TODO ENVIAR EMAIL`). A senha vira `Senha1234` direto no banco.
- O admin tem um único usuário, configurado por variável de ambiente.
