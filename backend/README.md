# HADI Active Wear — Projeto P2 (Desenvolvimento Web)

Integração do frontend estático construído no **Projeto P1** com o backend REST
fornecido pelo professor (Spring Boot + H2), implementando os métodos de
**Produto**, **Cliente** e **Pedido** descritos nos PDFs de documentação da API.

## Estrutura do repositório

```
.
├── backend/     -> API REST (Spring Boot 3 + H2 em arquivo)
└── (raiz)       -> Site estático HTML/CSS/JS (Projeto P1, integrado à API)
```

## Como rodar

### 1. Backend (porta 8080)

Pré-requisitos: **Java 17+** e **Maven** (ou use o `./mvnw` se preferir gerar o wrapper).

```bash
cd backend
mvn spring-boot:run
```

O H2 grava em arquivo (`backend/data/hadodb.mv.db`), então cadastros, edições e
pedidos continuam lá depois de reiniciar o backend. Na primeira execução o banco é
populado automaticamente (`DataLoader`) com os mesmos produtos que já existiam no
frontend estático e um cliente de teste (para recomeçar do zero, pare o backend e
apague a pasta `backend/data/`):

- **E-mail:** `gustavo@hadi.com`
- **Senha:** `12345678`
- **CPF:** `529.982.247-25`

Console do H2 (opcional, para inspecionar o banco): `http://localhost:8080/h2-console`
— JDBC URL `jdbc:h2:file:./data/hadodb`, usuário `sa`, senha em branco.

CORS já está liberado para qualquer origem (`@CrossOrigin(origins = "*")`), então
não é preciso configurar nada extra para o frontend acessar a API.

#### Usando MySQL (dados persistentes)

Por padrão o backend usa H2 em arquivo (zero configuração). Para usar **MySQL** (o banco `hadi` é criado automaticamente):

```bash
cd backend
# Linux/Mac
MYSQL_USER=root MYSQL_PASSWORD=suasenha mvn spring-boot:run -Dspring-boot.run.profiles=mysql
# Windows (PowerShell)
$env:MYSQL_USER="root"; $env:MYSQL_PASSWORD="suasenha"; mvn spring-boot:run "-Dspring-boot.run.profiles=mysql"
```

Variáveis opcionais: `MYSQL_HOST` (localhost), `MYSQL_PORT` (3306), `MYSQL_DB` (hadi).
Na primeira execução as tabelas são criadas e o seed (produtos + cliente de teste) é inserido;
nas seguintes, os dados já gravados são mantidos.

#### Segurança e cadastro

- Senhas são gravadas com **hash BCrypt** (nunca em texto puro); login compara pelo hash.
- Cadastro valida nome, e-mail e senha (mínimo 8 caracteres) e impede e-mail duplicado.
- Exclusão de produto é **lógica** (`ativo = false`), preservando o histórico de pedidos.

#### Painel admin (cadastro de produtos reais)

Abra `http://localhost:8090/admin.html`, informe a chave de administrador (padrão `hadi-admin`;
troque com a variável de ambiente `HADI_ADMIN_KEY`) e cadastre/edite/exclua produtos, com
upload de foto (salva em `backend/uploads/`). Os produtos aparecem na hora no catálogo e,
se marcados como "vitrine", na home.

#### Minha Conta (frontend)

- **CPF** com máscara e validação pelos dígitos verificadores (também validado no backend).
- **CEP** com consulta automática (ViaCEP) que preenche endereço, estado e cidade.
- **Estados e municípios** carregados da API do IBGE (precisa de internet).
- **Dados pessoais editáveis** (nome, telefone, data de nascimento, gênero) via botão EDITAR, gravados no banco.
- **Verificação de cartão** (modal): algoritmo de Luhn, bandeira, validade, CVV e CPF do titular. Só são guardados bandeira, 4 últimos dígitos e validade (no `localStorage`); número completo e CVV nunca são armazenados.

### 2. Frontend

Qualquer servidor estático funciona (o site não tem build step). Exemplo:

```bash
cd ..   # raiz do repositório
python3 -m http.server 8090
```

Depois abra `http://localhost:8090/index.html` no navegador.

Se o backend estiver rodando em outro host/porta, ajuste a constante
`API_BASE_URL` no topo de `api.js` (raiz).

## O que foi integrado

| Entidade | Endpoints do backend usados pelo frontend |
|---|---|
| **Produto** | `GET /api/produtos` (catálogo com filtros), `GET /api/produto/vitrine` (home), `GET /api/produto/{codigo}` (página de detalhes, carrinho, checkout), `GET /api/produto/busca/{termo}` (modal de busca) |
| **Cliente** | `POST /api/cliente` (cadastro), `POST /api/cliente/login` (login), `PUT /api/cliente` (editar endereço em Minha Conta), `PATCH /api/cliente/resetarSenha` (esqueci a senha) |
| **Pedido** | `POST /api/pedido` (finalizar compra no checkout), `GET /api/pedido/cliente/{codigo}` (aba "Meus Pedidos" em Minha Conta) |
| **CEP / Frete** | `GET /api/cep/{cep}` (endereço pelo ViaCEP), `GET /api/frete/{cep}?subtotal=` (endereço + PAC/SEDEX com valor e prazo; PAC grátis acima de R$ 800). O `POST /api/pedido` aceita `cepEntrega` e `tipoEntrega` e soma o frete ao total, calculado no servidor |
| **Avaliação** | `GET /api/produto/{codigo}/avaliacoes` (média, total, distribuição por nota e lista), `POST /api/avaliacao` (cliente logado avalia; uma avaliação por cliente/produto), `DELETE /api/avaliacao/{codigo}` (admin, header `X-Admin-Key`) |

Os produtos também trazem os atributos usados pelos filtros do catálogo (`departamento`,
`subcategoria`, `generos`, `tamanhos`, `tecnologias`, `atividades`, separados por vírgula) e o
resumo das avaliações (`mediaAvaliacoes`, `totalAvaliacoes`). Na primeira execução o `DataLoader`
grava avaliações de demonstração; em bancos antigos ele completa os atributos de filtro dos produtos de demonstração.

A sessão do cliente logado e o carrinho de compras são guardados no
`localStorage` do navegador (`api.js` (raiz)), já que o escopo do backend
fornecido não inclui autenticação por token/sessão.

## Observações sobre o backend fornecido

A documentação em PDF aponta duas inconsistências já existentes no backend
original (mantidas de propósito, pois fazem parte do contrato documentado):

- O cadastro de **Pedido** retorna a mensagem `"Cliente gravado com sucesso!"`
  (erro de copiar/colar do código-fonte original).
- O envio de e-mail em `resetarSenha`/`alterarSenha` não está implementado
  (`TODO ENVIAR EMAIL`); a senha é apenas redefinida para `Senha1234` no banco.

## Testes realizados

- Fluxo completo validado ponta a ponta com Playwright: catálogo e vitrine
  carregando produtos reais, login, cadastro, recuperação de senha, página de
  produto por código, carrinho, checkout com criação de pedido e "Meus
  Pedidos" em Minha Conta — todos batendo contra um servidor que replica
  exatamente o contrato dos PDFs (mesmos paths, verbos e formatos de retorno).
- O build Maven do backend (`mvn package`) não pôde ser executado no ambiente
  de geração deste código por falta de acesso à internet para baixar as
  dependências do Spring Boot; o código foi revisado manualmente e segue os
  endpoints documentados. **Recomenda-se rodar `mvn spring-boot:run`
  localmente antes da apresentação** para confirmar a build.
