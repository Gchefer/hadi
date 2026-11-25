# HADI Active Wear

Loja virtual de roupas e equipamentos outdoor (trekking, trail running, ski e neve).
O projeto tem duas partes:

- **Frontend** — site estático em HTML, CSS e JavaScript puro (sem build), na raiz do repositório.
- **Backend** — API REST em **Spring Boot 3.3 / Java 17**, na pasta [`backend/`](backend/), com banco H2 (padrão) ou MySQL.

O site consome a API para catálogo, busca, cadastro/login de clientes, carrinho, frete, pedidos e avaliações.
Um painel administrativo (`admin.html`) permite cadastrar produtos com foto.

---

## Sumário

- [Como rodar](#como-rodar)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Páginas do site](#páginas-do-site)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Configuração](#configuração)
- [Contas de teste](#contas-de-teste)
- [API](#api)
- [Licença](#licença)

---

## Como rodar

### Jeito rápido (um comando)

Pré-requisitos: **Python 3**, **Java 17+** e **Maven** (`mvn`) no PATH.

```bash
python rodar.py
```

O script [`rodar.py`](rodar.py):

1. sobe o backend com `mvn spring-boot:run` em <http://localhost:8080>. Se a porta já estiver em uso, usa o backend que já está rodando;
2. serve o site em <http://localhost:8090>, sem cache, para o navegador não ficar com JS/CSS antigos;
3. espera a API responder (até 3 min, porque na primeira vez o Maven baixa as dependências) e abre o navegador;
4. encerra tudo com `Ctrl+C`.

### Jeito manual

```bash
# Terminal 1 — backend
cd backend
mvn spring-boot:run

# Terminal 2 — frontend (qualquer servidor estático serve)
python3 -m http.server 8090
```

Abra <http://localhost:8090/index.html>.

> O site precisa ser aberto por um servidor HTTP (não por `file://`) e com o backend no ar. Sem a API, catálogo, login e checkout não carregam.

---

## Estrutura do repositório

```
.
├── index.html          Home (vitrine de destaques)
├── catalogo.html       Catálogo com filtros
├── produto.html        Página de produto (?codigo=N)
├── checkout.html       Finalização da compra
├── minha-conta.html    Login/cadastro, dados pessoais, endereço, cartões e pedidos
├── admin.html          Painel administrativo de produtos e avaliações
│
├── api.js              Cliente da API + sessão do cliente e carrinho (localStorage)
├── script.js           Menu/mega menu, carrinho lateral, catálogo, produto, checkout
├── busca.js / busca.css  Modal de busca
├── frete.js            Consulta de CEP e cálculo de frete
├── conta.js            Minha Conta: CPF, CEP, municípios (IBGE), cartões
├── style.css           Estilos do site
│
├── images/ img/        Imagens do site (images.zip / img.zip são cópias compactadas)
├── telas/              Protótipos das telas em PDF
├── rodar.py            Sobe backend + front com um comando
│
└── backend/            API REST Spring Boot
    ├── pom.xml
    └── src/main/
        ├── java/com/hadi/backend/
        │   ├── controller/   Endpoints REST (Produto, Cliente, Pedido, Avaliação, Frete, Admin)
        │   ├── service/      AdminAuthService (login admin), FreteService (CEP + frete)
        │   ├── entity/       Entidades JPA (Produto, Cliente, Pedido, ItemPedido, Avaliacao)
        │   ├── dto/          Objetos de entrada/saída da API
        │   ├── repository/   Repositórios Spring Data JPA
        │   ├── config/       AppConfig (BCrypt, /uploads), DataLoader e AvaliacoesDemo (seed)
        │   └── util/         CpfValidator
        └── resources/
            ├── application.properties         Perfil padrão (H2 em arquivo)
            └── application-mysql.properties   Perfil MySQL
```

Pastas geradas em tempo de execução (ignoradas pelo git): `backend/data/` (banco H2),
`backend/uploads/` (fotos enviadas pelo admin) e `backend/target/` (build).

---

## Páginas do site

| Página | O que faz | Endpoints usados |
|---|---|---|
| `index.html` | Home com produtos em destaque | `GET /api/produto/vitrine` |
| `catalogo.html` | Lista de produtos com filtros (departamento, subcategoria, gênero, tamanho, tecnologia, atividade, preço) e busca (`?q=termo`) | `GET /api/produtos` |
| `produto.html?codigo=N` | Detalhes, cálculo de frete, adicionar ao carrinho, avaliações | `GET /api/produto/{codigo}`, `GET /api/frete/{cep}`, `GET/POST` avaliações |
| `checkout.html` | Endereço, frete (PAC/SEDEX), pagamento e criação do pedido | `GET /api/frete/{cep}`, `POST /api/pedido` |
| `minha-conta.html` | Login, cadastro, esqueci a senha, dados pessoais, endereço, cartões, "Meus Pedidos" | `/api/cliente/*`, `GET /api/pedido/cliente/{codigo}` |
| `admin.html` | Login do admin, CRUD de produtos com upload de foto, remoção de avaliações | `/api/admin/*`, `POST/PUT/DELETE /api/produto`, `POST /api/produto/imagem` |
| Modal de busca (todas as páginas) | Busca instantânea; Enter leva ao catálogo | `GET /api/produto/busca/{termo}` |

---

## Arquitetura

```
Navegador ──HTTP──▶ site estático (:8090)            HTML/CSS/JS, sem build
    │
    └──fetch()────▶ API Spring Boot (:8080/api) ──JPA──▶ H2 (backend/data) ou MySQL
                          │
                          ├──▶ ViaCEP  (endereço pelo CEP)
                          └──▶ /uploads/** (fotos dos produtos)
```

- **Comunicação:** todo o acesso à API passa por [`api.js`](api.js). A URL base é a constante
  `API_BASE_URL` (padrão `http://localhost:8080/api`). CORS está liberado para qualquer origem.
- **Sessão do cliente:** o backend não emite token para clientes. Depois do login, os dados do cliente
  ficam no `localStorage` (`hadi_cliente`). O carrinho também (`hadi_carrinho_<codigo>` por cliente,
  `hadi_carrinho_anon` para visitante).
- **Sessão do admin:** `POST /api/admin/login` devolve um token aleatório, válido por 8 h e guardado em
  memória no servidor. O painel envia esse token no header `X-Admin-Token`. Reiniciar o backend desloga o admin.
- **Banco:** o Hibernate cria/atualiza as tabelas (`ddl-auto=update`). Na primeira execução o
  `DataLoader` popula produtos, um cliente de teste e avaliações de demonstração.

### Modelo de dados

```
Cliente 1 ──── N Pedido 1 ──── N ItemPedido N ──── 1 Produto
   │                                                   │
   └──────────── 1 ──── N Avaliacao N ──── 1 ──────────┘
```

| Entidade | Campos principais |
|---|---|
| **Produto** | `codigo`, `marca`, `nome`, `descricao`, `categoria`, `preco`, `precoOriginal`, `imagem`, `destaque` (vitrine), `ativo`, e os filtros `departamento`, `subcategoria`, `generos`, `tamanhos`, `tecnologias`, `atividades` (texto separado por vírgula) |
| **Cliente** | `codigo`, `nome`, `email` (único), `senha` (hash BCrypt), `documento` (CPF), `telefone`, endereço (`cep`, `endereco`, `numero`, `complemento`, `cidade`, `estado`), `dataNascimento`, `genero` |
| **Pedido** | `codigo`, `cliente`, `itens`, `valorTotal`, `valorFrete`, `tipoEntrega`, `cepEntrega`, `formaPagamento`, `status` (padrão `RECEBIDO`), `dataPedido` |
| **ItemPedido** | `produto`, `quantidade`, `precoUnitario` (preço no momento da compra) |
| **Avaliacao** | `produto`, `cliente`, `nota` (1–5), `titulo`, `comentario` (até 1000 caracteres), `tamanhoComprado`, `recomenda`, `data` |

---

## Funcionalidades

**Loja**
- Vitrine na home, catálogo com filtros combináveis e busca por nome/descrição.
- Carrinho lateral persistente, separado por cliente.
- Frete calculado no servidor pela região do CEP (saindo de SP): PAC e SEDEX com valor e prazo.
  **PAC grátis a partir de R$ 800.** O endereço vem do ViaCEP. O cálculo do valor não depende dele.
- O total do pedido (itens + frete) é sempre recalculado no backend, sem confiar em valores vindos do navegador.
- Avaliações com média, distribuição por nota e lista. Só cliente logado avalia, uma vez por produto.

**Conta do cliente**
- Cadastro com validação de nome, e-mail (sem duplicar) e senha (mínimo 8 caracteres).
- Senhas gravadas com hash **BCrypt**.
- CPF com máscara e validação dos dígitos verificadores (no front e no back).
- CEP com preenchimento automático; estados e municípios carregados da API do IBGE.
- Verificação de cartão (algoritmo de Luhn, bandeira, validade, CVV). Só ficam guardados bandeira,
  4 últimos dígitos e validade, no `localStorage`. Número completo e CVV nunca são armazenados.
- Histórico de pedidos.

**Administração**
- Login de administrador com token.
- Cadastro, edição e exclusão de produtos, com upload de foto (PNG, JPG, WEBP ou GIF, até 5 MB).
- A exclusão de produto é **lógica** (`ativo = false`), o que preserva o histórico de pedidos.
- Remoção de avaliações.

---

## Configuração

Todas as opções ficam em [`backend/src/main/resources/application.properties`](backend/src/main/resources/application.properties)
e podem ser sobrescritas por variável de ambiente:

| Variável | Padrão | Para quê |
|---|---|---|
| `HADI_ADMIN_USUARIO` | `admin` | Usuário do painel admin |
| `HADI_ADMIN_SENHA` | `hadi-admin` | Senha do painel admin (**troque fora do ambiente local**) |
| `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_DB` | `localhost` / `3306` / `hadi` | Conexão MySQL (perfil `mysql`) |
| `MYSQL_USER` / `MYSQL_PASSWORD` | `root` / vazio | Credenciais MySQL |

**H2 (padrão):** grava em `backend/data/hadodb.mv.db`. Console em <http://localhost:8080/h2-console>
(JDBC URL `jdbc:h2:file:./data/hadodb`, usuário `sa`, senha em branco). Para zerar o banco, pare o
backend e apague `backend/data/`.

**MySQL:** o banco é criado automaticamente.

```bash
cd backend
MYSQL_USER=root MYSQL_PASSWORD=suasenha mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

**Frontend:** se a API estiver em outro host ou porta, ajuste `API_BASE_URL` no topo de [`api.js`](api.js).

---

## Contas de teste

Criadas pelo `DataLoader` na primeira execução:

| Tipo | Login | Senha |
|---|---|---|
| Cliente | `gustavo@hadi.com` (CPF `529.982.247-25`) | `12345678` |
| Administrador | `admin` | `hadi-admin` |

---

## API

A referência completa dos endpoints, com corpo das requisições e respostas, está em
**[`docs/API.md`](docs/API.md)**. Detalhes extras do backend estão em [`backend/README.md`](backend/README.md).

Resumo:

| Recurso | Endpoints |
|---|---|
| Produto | `GET /api/produtos` · `GET /api/produto/vitrine` · `GET /api/produto/{codigo}` · `GET /api/produto/busca/{termo}` · `POST`/`PUT /api/produto` 🔒 · `DELETE /api/produto/{codigo}` 🔒 · `POST /api/produto/imagem` 🔒 |
| Cliente | `GET /api/cliente/{codigo}` · `POST /api/cliente` · `PUT /api/cliente` · `DELETE /api/cliente/{codigo}` · `POST /api/cliente/login` · `PATCH /api/cliente/resetarSenha` · `PATCH /api/cliente/alterarSenha` |
| Pedido | `GET /api/pedido/{codigo}` · `GET /api/pedido/cliente/{codigo}` · `POST`/`PUT /api/pedido` · `DELETE /api/pedido/{codigo}` |
| Avaliação | `GET /api/produto/{codigo}/avaliacoes` · `POST /api/avaliacao` · `DELETE /api/avaliacao/{codigo}` 🔒 |
| CEP / Frete | `GET /api/cep/{cep}` · `GET /api/frete/{cep}?subtotal=` |
| Admin | `POST /api/admin/login` · `POST /api/admin/logout` · `GET /api/admin/sessao` |

🔒 = exige o header `X-Admin-Token`.

---

## Licença

[MIT](LICENSE) © 2026 Gustavo Chefer
