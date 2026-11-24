document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // MENU / MEGA MENU (desktop: permanece aberto enquanto o
    // mouse estiver sobre o link OU sobre o painel, com uma
    // pequena tolerância para não fechar "no meio do caminho")
    // ==========================================
    document.querySelectorAll('.has-dropdown').forEach(item => {
        const menu = item.querySelector('.mega-menu');
        if (!menu) return;
        let closeTimer = null;

        const open = () => {
            clearTimeout(closeTimer);
            document.querySelectorAll('.mega-menu.open').forEach(m => { if (m !== menu) m.classList.remove('open'); });
            menu.classList.add('open');
        };
        const scheduleClose = () => {
            clearTimeout(closeTimer);
            closeTimer = setTimeout(() => menu.classList.remove('open'), 200);
        };

        item.addEventListener('mouseenter', open);
        item.addEventListener('mouseleave', scheduleClose);
        item.addEventListener('focusin', open);
        item.addEventListener('focusout', scheduleClose);

        // Mobile: o botão de seta abre/fecha o submenu como acordeão
        // (independente do hover, que não existe em telas de toque)
        const toggleBtn = item.querySelector('.dropdown-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const isOpen = item.classList.contains('open');
                document.querySelectorAll('.has-dropdown.open').forEach(li => {
                    li.classList.remove('open');
                    li.querySelector('.mega-menu')?.classList.remove('open');
                });
                if (!isOpen) {
                    item.classList.add('open');
                    menu.classList.add('open');
                }
            });
        }
    });

    // ==========================================
    // MENU MOBILE (gaveta lateral com hambúrguer)
    // ==========================================
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const navbar = document.querySelector('.navbar');
    const navOverlay = document.getElementById('nav-overlay');
    const btnMobileNavClose = document.querySelector('.mobile-nav-close');

    function openMobileNav() {
        navbar?.classList.add('open');
        navOverlay?.classList.add('active');
        document.body.classList.add('nav-open');
    }
    function closeMobileNav() {
        navbar?.classList.remove('open');
        navOverlay?.classList.remove('active');
        document.body.classList.remove('nav-open');
        document.querySelectorAll('.has-dropdown.open').forEach(li => {
            li.classList.remove('open');
            li.querySelector('.mega-menu')?.classList.remove('open');
        });
    }
    btnMobileMenu?.addEventListener('click', openMobileNav);
    btnMobileNavClose?.addEventListener('click', closeMobileNav);
    navOverlay?.addEventListener('click', closeMobileNav);
    // Fecha a gaveta automaticamente se a tela for redimensionada para desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) closeMobileNav();
    });

    // --- SELEÇÃO DE ELEMENTOS ---
    // Botões do Header
    const btnSearch = document.getElementById('btn-search');
    const btnUser = document.getElementById('btn-user');
    const btnCart = document.getElementById('btn-cart');

    // Modais
    const modalSearch = document.getElementById('modal-search');
    const modalCart = document.getElementById('modal-cart');
    const modalAuth = document.getElementById('modal-auth');
    const userDropdown = document.getElementById('modal-user-menu');
    
    // Botões de fechar
    const closeBtns = document.querySelectorAll('.close-modal');

    // Estado de autenticação real: vem da sessão salva em localStorage pelo api.js
    // depois de um login/cadastro bem-sucedido contra o backend.
    let clienteLogado = (typeof sessao !== 'undefined') ? sessao.obter() : null;
    let isUserLoggedIn = !!clienteLogado;

    function atualizarUIDoUsuario() {
        const primeiroNome = clienteLogado ? ((clienteLogado.nome || '').trim().split(/\s+/)[0] || clienteLogado.email || '') : '';
        const nomeEl = document.getElementById('user-dropdown-name');
        if (nomeEl && clienteLogado) nomeEl.textContent = primeiroNome || 'MINHA CONTA';
        // Saudação da Minha Conta (antes fixa como "MARIANA" no HTML do mockup)
        const saudacao = document.querySelector('.user-greeting');
        if (saudacao) {
            saudacao.innerHTML = '<i class="fa-regular fa-circle-user"></i> ';
            saudacao.append(clienteLogado ? primeiroNome.toUpperCase() : 'VISITANTE');
        }
    }
    atualizarUIDoUsuario();

    // Páginas que mostram dados da conta: depois de entrar, recarrega para buscar os dados do cliente.
    const paginaComDadosDaConta = !!(document.getElementById('form-dados') || document.getElementById('form-checkout-step1'));

    // Confirma no backend que a sessão salva ainda é válida (conta existe e é a mesma).
    // Se o navegador ainda tiver um api.js antigo em cache (sem sessaoPronta), usa a sessão local em vez de quebrar.
    const sessaoValidada = (typeof sessaoPronta !== 'undefined' ? sessaoPronta : Promise.resolve(sessao.obter()));
    sessaoValidada.then((c) => {
        const mudou = !!clienteLogado !== !!c;
        clienteLogado = c;
        isUserLoggedIn = !!c;
        atualizarUIDoUsuario();
        if (mudou && typeof renderCarrinho === 'function') renderCarrinho();
        // Sem login nas páginas da conta/checkout: já abre o modal de acesso.
        if (!c && paginaComDadosDaConta && modalAuth) modalAuth.classList.add('active');
    });

    // "SAIR" do menu do usuário e da barra lateral da Minha Conta (antes esta só navegava, sem deslogar)
    document.querySelectorAll('#btn-logout, .logout-link').forEach((el) => el.addEventListener('click', (e) => {
        e.preventDefault();
        sessao.limpar();
        window.location.href = 'index.html';
    }));

    // --- FUNÇÕES DE ABRIR/FECHAR MODAIS ---
    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        // Ao fechar o modal de acesso, volta para a aba de login (evita reabrir na recuperação de senha)
        if (modal === modalAuth) showAuthView('login');
    }

    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            closeModal(modal);
        });
    });

    // Abrir Pesquisa (só existe em páginas com o header completo)
    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
            modalSearch.classList.add('active');
        });
    }

    // Abrir Carrinho
    if (btnCart) {
        btnCart.addEventListener('click', () => {
            modalCart.classList.add('active');
        });
    }

    // Lógica do Botão de Utilizador (Verifica se está logado)
    if (btnUser) {
        btnUser.addEventListener('click', () => {
            if (isUserLoggedIn) {
                userDropdown.classList.toggle('active');
            } else {
                modalAuth.classList.add('active');
                userDropdown.classList.remove('active');
            }
        });
    }

    // --- LÓGICA DAS ABAS: LOGIN vs PRIMEIRO ACESSO ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove a classe 'active' de todos os botões e formulários
            tabBtns.forEach(b => b.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));

            // Adiciona 'active' ao botão clicado e ao formulário correspondente
            btn.classList.add('active');
            const targetFormId = btn.getAttribute('data-target');
            document.getElementById(targetFormId).classList.add('active');
        });
    });

    // --- RECUPERAR SENHA (3º estado do modal de autenticação) ---
    const authModalBox = document.querySelector('.modal-center');
    const authTitle = document.getElementById('auth-title');
    const formRecover = document.getElementById('form-recover');
    const recoverSuccess = document.getElementById('recover-success');

    function showAuthView(view) {
        if (!authModalBox) return;
        const isRecover = view === 'recover' || view === 'success';
        authModalBox.classList.toggle('recover-mode', isRecover);
        if (authTitle) authTitle.textContent = isRecover ? 'RECUPERAR SENHA' : 'BEM VINDO(A)';

        authForms.forEach(f => f.classList.remove('active'));
        tabBtns.forEach(b => b.classList.remove('active'));

        if (view === 'recover') formRecover?.classList.add('active');
        else if (view === 'success') recoverSuccess?.classList.add('active');
        else {
            const target = view === 'register' ? 'form-register' : 'form-login';
            document.getElementById(target)?.classList.add('active');
            document.querySelector(`.tab-btn[data-target="${target}"]`)?.classList.add('active');
        }
    }

    // "ESQUECEU A SENHA?" (login) e "ESQUECI A SENHA" (Minha Conta)
    document.getElementById('link-forgot')?.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthView('recover');
    });
    document.querySelectorAll('.open-recover').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            modalAuth?.classList.add('active');
            userDropdown?.classList.remove('active');
            showAuthView('recover');
        });
    });

    formRecover?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailValue = document.getElementById('recover-email').value.trim();
        // PATCH /api/cliente/resetarSenha: zera a senha do cliente para "Senha1234" (regra fixa do backend)
        if (typeof api !== 'undefined') {
            try { await api.resetarSenha(emailValue); } catch { /* segue para a tela de sucesso mesmo assim */ }
        }
        document.getElementById('recover-sent-to').textContent = emailValue.toUpperCase();
        showAuthView('success');
    });
    document.getElementById('resend-recover')?.addEventListener('click', async () => {
        const emailValue = document.getElementById('recover-sent-to')?.textContent || '';
        if (typeof api !== 'undefined' && emailValue) {
            try { await api.resetarSenha(emailValue); } catch { /* ignora falha no reenvio */ }
        }
        alert('Enviamos o link novamente. Confira sua caixa de entrada.');
    });
    document.querySelectorAll('.back-to-login').forEach(btn => {
        btn.addEventListener('click', () => showAuthView('login'));
    });

    // Ao reabrir o modal pelo ícone de utilizador, volta sempre para o Login
    btnUser?.addEventListener('click', () => { if (!isUserLoggedIn) showAuthView('login'); });

    // --- LOGIN (integrado com POST /api/cliente/login) ---
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        const loginError = document.getElementById('login-error');
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (loginError) loginError.textContent = '';
            if (!formLogin.checkValidity()) {
                formLogin.reportValidity();
                return;
            }
            const email = document.getElementById('login-email').value.trim();
            const senha = document.getElementById('login-pass').value;
            const btn = formLogin.querySelector('button[type="submit"]');
            btn.disabled = true;
            try {
                const cliente = await api.login(email, senha);
                if (!cliente || !cliente.codigo) {
                    if (loginError) loginError.textContent = 'E-MAIL OU SENHA INVÁLIDOS.';
                    return;
                }
                sessao.salvar(cliente);
                clienteLogado = cliente;
                isUserLoggedIn = true;
                atualizarUIDoUsuario();
                if (typeof renderCarrinho === 'function') renderCarrinho(); // carrinho da conta (+ itens sem login)
                closeModal(modalAuth);
                formLogin.reset();
                if (paginaComDadosDaConta) window.location.reload();
            } catch (err) {
                if (loginError) loginError.textContent = err.status
                    ? (err.message || 'ERRO AO FAZER LOGIN.').toUpperCase()
                    : 'NÃO FOI POSSÍVEL CONECTAR AO SERVIDOR. VERIFIQUE SE O BACKEND ESTÁ RODANDO EM ' + API_BASE_URL;
                console.error(err);
            } finally {
                btn.disabled = false;
            }
        });
    }

    // --- CADASTRO / PRIMEIRO ACESSO (integrado com POST /api/cliente) ---
    const formRegister = document.getElementById('form-register');
    if (formRegister) {
        const registerError = document.getElementById('register-error');
        const registerPass = document.getElementById('register-pass');
        const registerPass2 = document.getElementById('register-pass2');
        [registerPass, registerPass2].forEach(inp => {
            inp?.addEventListener('input', () => { if (registerError) registerError.textContent = ''; });
        });

        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!formRegister.checkValidity()) {
                // Deixa o navegador apontar o campo obrigatório vazio/e-mail inválido
                formRegister.reportValidity();
                return;
            }
            if (registerPass.value.length < 8) {
                registerError.textContent = 'A SENHA DEVE TER PELO MENOS 8 CARACTERES.';
                registerPass.focus();
                return;
            }
            if (registerPass.value !== registerPass2.value) {
                registerError.textContent = 'AS SENHAS NÃO COINCIDEM.';
                registerPass2.focus();
                return;
            }

            const nome = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const senha = registerPass.value;
            const btn = formRegister.querySelector('button[type="submit"]');
            btn.disabled = true;
            try {
                const resposta = await api.cadastrarCliente({ nome, email, senha });
                if (typeof resposta === 'string' && resposta.toLowerCase().includes('sucesso')) {
                    // O backend responde "Cliente gravado com sucesso! <codigo>" — extraímos o código.
                    const codigoMatch = resposta.match(/(\d+)\s*$/);
                    clienteLogado = { codigo: codigoMatch ? Number(codigoMatch[1]) : null, nome, email };
                    sessao.salvar(clienteLogado);
                    isUserLoggedIn = true;
                    atualizarUIDoUsuario();
                    if (typeof renderCarrinho === 'function') renderCarrinho();
                    closeModal(modalAuth);
                    formRegister.reset();
                    if (paginaComDadosDaConta) window.location.reload();
                } else {
                    // Ex.: "E-mail já cadastrado!"
                    registerError.textContent = (resposta || 'NÃO FOI POSSÍVEL CRIAR A CONTA.').toUpperCase();
                }
            } catch (err) {
                registerError.textContent = err.status
                    ? (err.message || 'NÃO FOI POSSÍVEL CRIAR A CONTA.').toUpperCase()
                    : 'NÃO FOI POSSÍVEL CONECTAR AO SERVIDOR. VERIFIQUE SE O BACKEND ESTÁ RODANDO EM ' + API_BASE_URL;
                console.error(err);
            } finally {
                btn.disabled = false;
            }
        });
    }

    // --- CHECKOUT (PASSO 1): validação antes de avançar para pagamento ---
    const formCheckoutStep1 = document.getElementById('form-checkout-step1');
    if (formCheckoutStep1) {
        const checkoutStep1Error = document.getElementById('checkout-step1-error');
        formCheckoutStep1.addEventListener('submit', (e) => {
            e.preventDefault();
            if (checkoutStep1Error) checkoutStep1Error.textContent = '';
            if (!formCheckoutStep1.checkValidity()) {
                formCheckoutStep1.reportValidity();
                if (checkoutStep1Error) checkoutStep1Error.textContent = 'PREENCHA TODOS OS CAMPOS OBRIGATÓRIOS CORRETAMENTE.';
                return;
            }
            nextStep(2);
        });
    }

    // (Dados Pessoais, endereço e cartões da Minha Conta ficam em conta.js)

    const pedidosLista = document.getElementById('pedidos-lista');
    if (pedidosLista && typeof api !== 'undefined') sessaoValidada.then(() => {
        const pedidosVazio = document.getElementById('pedidos-vazio');
        if (!clienteLogado || !clienteLogado.codigo) {
            if (pedidosVazio) { pedidosVazio.textContent = 'FAÇA LOGIN PARA VER SEUS PEDIDOS.'; pedidosVazio.style.display = 'block'; }
        } else {
            api.buscarPedidosDoCliente(clienteLogado.codigo)
                .then(pedidos => {
                    if (!pedidos || pedidos.length === 0) {
                        if (pedidosVazio) { pedidosVazio.textContent = 'VOCÊ AINDA NÃO FEZ NENHUM PEDIDO.'; pedidosVazio.style.display = 'block'; }
                        return;
                    }
                    pedidos.forEach(pedido => {
                        const card = document.createElement('div');
                        card.className = 'order-details-card';
                        const itensHtml = (pedido.itens || []).map(item => `
                            <div class="order-product">
                                <img src="${caminhoImagem(item.produtoImagem)}" alt="${item.produtoNome}" style="width:80px; mix-blend-mode:multiply;" onerror="this.replaceWith(Object.assign(document.createElement('i'), {className:'fa-solid fa-image'}))">
                                <div><h4>${item.produtoNome}</h4><p>QUANTIDADE: ${item.quantidade}</p></div>
                            </div>`).join('');
                        card.innerHTML = `
                            ${itensHtml}
                            <ul class="order-summary-list mt-20">
                                <li><span>PEDIDO</span> <span>#${pedido.codigo}</span></li>
                                <li><span>VALOR TOTAL</span> <span>${formatarPreco(pedido.valorTotal)}</span></li>
                                <li><span>FORMA DE PAGAMENTO</span> <span>${pedido.formaPagamento || '-'}</span></li>
                                <li><span>STATUS</span> <span>${pedido.status || '-'}</span></li>
                            </ul>`;
                        pedidosLista.appendChild(card);
                    });
                })
                .catch(() => {
                    if (pedidosVazio) { pedidosVazio.textContent = 'NÃO FOI POSSÍVEL CARREGAR SEUS PEDIDOS.'; pedidosVazio.style.display = 'block'; }
                });
        }
    });

    // Fechar menu de utilizador ao clicar fora
    if (btnUser && userDropdown) {
        document.addEventListener('click', (e) => {
            if (!btnUser.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }

    // --- NEWSLETTER (rodapé da Home) ---
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            alert(`Obrigado! Enviaremos novidades para ${emailInput.value}`);
            newsletterForm.reset();
        });
    }

    // ==========================================
    // PRODUTOS: catálogo (catalogo.html) e vitrine (index.html), via API
    // ==========================================
    function renderProductCard(produto) {
        const precoOld = produto.precoOriginal
            ? `<span class="price-old">${formatarPreco(produto.precoOriginal)}</span>`
            : '';
        let discount = '';
        if (produto.precoOriginal && produto.precoOriginal > 0) {
            const pct = Math.round((1 - produto.preco / produto.precoOriginal) * 100);
            if (pct > 0) discount = ` <span class="discount">-${pct}%</span>`;
        }
        const article = document.createElement('article');
        article.className = 'product-card';
        article.innerHTML = `
            <a href="produto.html?codigo=${produto.codigo}" class="product-card-link">
                <div class="img-wrapper">
                    <img src="${caminhoImagem(produto.imagem)}" alt="${produto.nome}" onerror="this.replaceWith(Object.assign(document.createElement('i'), {className:'fa-solid fa-image'}))">
                </div>
                <div class="product-info">
                    <h3>${produto.marca || ''}</h3>
                    <p class="product-name">${produto.nome || ''}</p>
                    <div class="prices">
                        ${precoOld}
                        <span class="price-new">${formatarPreco(produto.preco)}${discount}</span>
                    </div>
                </div>
            </a>`;
        return article;
    }

    // Catálogo (catalogo.html): filtros, ordenação e paginação ficam em busca.js

    const vitrineGrid = document.getElementById('vitrine-grid');
    if (vitrineGrid && typeof api !== 'undefined') {
        api.buscarVitrine()
            .then(produtos => {
                vitrineGrid.innerHTML = '';
                (produtos || []).forEach(p => vitrineGrid.appendChild(renderProductCard(p)));
            })
            .catch(() => { /* Home segue normalmente sem a vitrine se o backend estiver fora do ar */ });
    }

    // ==========================================
    // CARRINHO: integrado com a API de Produto + localStorage (api.js)
    // ==========================================
    const cartItemsEl = document.getElementById('cart-items');
    const cartEmptyMsg = document.getElementById('cart-empty-msg');
    const cartTotalEl = document.getElementById('cart-total');

    let renderCarrinhoId = 0;
    async function renderCarrinho() {
        if (!cartItemsEl || typeof api === 'undefined') return;
        const meuId = ++renderCarrinhoId; // cliques rápidos (+/-) não podem duplicar itens na tela
        const itens = carrinho.obter();
        cartItemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());

        if (itens.length === 0) {
            if (cartEmptyMsg) cartEmptyMsg.style.display = 'block';
            if (cartTotalEl) cartTotalEl.textContent = '';
            return;
        }
        if (cartEmptyMsg) cartEmptyMsg.style.display = 'none';

        let total = 0;
        const produtos = await Promise.all(itens.map(i => api.buscarProdutoPorCodigo(i.codigo).catch(() => undefined)));
        if (meuId !== renderCarrinhoId) return; // um render mais novo já assumiu
        cartItemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());
        for (const [idx, item] of itens.entries()) {
            const produto = produtos[idx];
            if (produto === undefined) continue; // backend fora do ar: mantém o item guardado
            if (!produto.codigo) { // {} = produto excluído/inexistente
                carrinho.remover(item.codigo);
                continue;
            }
            total += Number(produto.preco) * item.quantidade;

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="${caminhoImagem(produto.imagem)}" alt="${produto.nome}" onerror="this.replaceWith(Object.assign(document.createElement('i'), {className:'fa-solid fa-image'}))">
                <div class="item-details">
                    <h4>${produto.marca || ''}</h4>
                    <p>${produto.nome || ''}</p>
                    <p>${formatarPreco(produto.preco)}</p>
                    <div class="cart-item-footer">
                        <div class="qty-stepper">
                            <button type="button" class="qty-minus" aria-label="Diminuir">-</button>
                            <span class="qty-value">${String(item.quantidade).padStart(2, '0')}</span>
                            <button type="button" class="qty-plus" aria-label="Aumentar">+</button>
                        </div>
                        <button type="button" class="cart-item-remove" aria-label="Remover"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`;
            div.querySelector('.qty-plus').addEventListener('click', () => {
                carrinho.atualizarQuantidade(item.codigo, item.quantidade + 1);
                renderCarrinho();
            });
            div.querySelector('.qty-minus').addEventListener('click', () => {
                carrinho.atualizarQuantidade(item.codigo, item.quantidade - 1);
                renderCarrinho();
            });
            div.querySelector('.cart-item-remove').addEventListener('click', () => {
                carrinho.remover(item.codigo);
                renderCarrinho();
            });
            cartItemsEl.appendChild(div);
        }
        if (cartTotalEl) cartTotalEl.textContent = 'TOTAL: ' + formatarPreco(total);
    }
    renderCarrinho();
    // Recarrega sempre que o carrinho é aberto (outra página pode ter adicionado itens)
    document.getElementById('btn-cart')?.addEventListener('click', renderCarrinho);

    const couponToggle = document.querySelector('.coupon-toggle');
    if (couponToggle) {
        couponToggle.addEventListener('click', () => {
            couponToggle.nextElementSibling.classList.toggle('open');
        });
    }

    // "VOLTAR AO CARRINHO" (checkout) reabre o modal do carrinho
    const btnBackToCart = document.getElementById('btn-back-to-cart');
    if (btnBackToCart && modalCart) {
        btnBackToCart.addEventListener('click', (e) => {
            e.preventDefault();
            modalCart.classList.add('active');
        });
    }

    // ==========================================
    // PÁGINA DE PRODUTO (produto.html)
    // ==========================================
    const productDetail = document.querySelector('.product-detail-layout');
    if (productDetail) {
        // Produto vindo da API: ?codigo=X (sem código, mostra o produto 1 — Arc'teryx de demonstração)
        const codigoProduto = new URLSearchParams(window.location.search).get('codigo') || '1';
        let produtoAtual = Number(codigoProduto) || 1;
        const escHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const listaAttr = s => (s || '').split(',').map(x => x.trim()).filter(Boolean);
        const estrelasHTML = (nota) => [1, 2, 3, 4, 5].map(i =>
            nota >= i ? '<i class="fa-solid fa-star"></i>'
                : nota >= i - 0.5 ? '<i class="fa-solid fa-star-half-stroke"></i>'
                    : '<i class="fa-regular fa-star"></i>').join('');

        function preencherProduto(produto) {
            document.getElementById('detail-brand').textContent = produto.marca || '';
            document.getElementById('detail-title').textContent = produto.nome || '';
            document.getElementById('detail-price').textContent = formatarPreco(produto.preco);
            const parcelas = document.querySelector('.product-price-row .installments');
            if (parcelas) parcelas.textContent = `OU 12X DE ${formatarPreco(Number(produto.preco) / 12).replace(/\s/g, '')} SEM JUROS`;
            const img = document.getElementById('detail-image-main');
            if (img) {
                img.src = caminhoImagem(produto.imagem);
                img.alt = produto.nome || '';
            }
            document.title = `${produto.nome} - HADI`;

            // Breadcrumb: HOME > ATIVIDADE > DEPARTAMENTO > SUBCATEGORIA
            const crumbs = document.getElementById('detail-breadcrumbs');
            if (crumbs) {
                const partes = [listaAttr(produto.atividades)[0], produto.departamento, produto.subcategoria || produto.categoria].filter(Boolean);
                crumbs.innerHTML = '<a href="index.html">HOME</a>' + partes.map(p => ` &gt; <a href="catalogo.html">${escHTML(p.toUpperCase())}</a>`).join('');
            }

            // Tamanhos do produto (acessórios sem tamanho escondem o seletor)
            const tamanhos = listaAttr(produto.tamanhos);
            const sizeBox = document.getElementById('detail-sizes');
            if (sizeBox) {
                sizeBox.hidden = !tamanhos.length;
                sizeBox.querySelector('.size-options').innerHTML = tamanhos
                    .map((t, i) => `<button type="button" class="size-btn${i === Math.floor((tamanhos.length - 1) / 2) ? ' active' : ''}">${escHTML(t)}</button>`).join('');
            }
            const selTam = document.getElementById('review-tamanho');
            if (selTam) selTam.innerHTML = '<option value="">TAMANHO COMPRADO (OPCIONAL)</option>' + tamanhos.map(t => `<option>${escHTML(t)}</option>`).join('');
            if (selTam) selTam.hidden = !tamanhos.length;
            const tabMedidas = document.querySelector('.detail-tab-btn[data-tab="medidas"]');
            if (tabMedidas && !tamanhos.length) tabMedidas.hidden = true;

            // Descrição gerada a partir dos dados do produto (antes era o texto fixo da Arc'teryx)
            const desc = document.getElementById('tab-descricao');
            if (desc) {
                const itens = [
                    ['TECNOLOGIA', listaAttr(produto.tecnologias).join(', ')],
                    ['INDICADO PARA', listaAttr(produto.atividades).join(', ')],
                    ['GÊNERO', listaAttr(produto.generos).join(', ')],
                    ['TAMANHOS', tamanhos.join(' / ')],
                ].filter(([, v]) => v);
                desc.innerHTML = `<p>${escHTML(produto.descricao || `${produto.marca} ${produto.nome}`)}</p>` +
                    (itens.length ? `<ul>${itens.map(([k, v]) => `<li><strong>${k}:</strong> ${escHTML(v.toUpperCase())}</li>`).join('')}</ul>` : '');
            }
        }

        // "Você também pode gostar": outros produtos, priorizando a mesma subcategoria
        function carregarRelacionados(produto) {
            const relatedGrid = document.getElementById('related-grid');
            if (!relatedGrid) return;
            api.listarProdutos().then(produtos => {
                const outros = (produtos || []).filter(p => p.codigo !== produto.codigo);
                const mesmaSub = outros.filter(p => p.subcategoria && p.subcategoria === produto.subcategoria);
                const resto = outros.filter(p => !mesmaSub.includes(p)).sort((a, b) => (b.mediaAvaliacoes || 0) - (a.mediaAvaliacoes || 0));
                relatedGrid.innerHTML = '';
                [...mesmaSub, ...resto].slice(0, 4).forEach(p => relatedGrid.appendChild(renderProductCard(p)));
            }).catch(() => { /* sem sugestões se o backend falhar */ });
        }

        if (typeof api !== 'undefined') {
            api.buscarProdutoPorCodigo(codigoProduto)
                .then(produto => {
                    if (!produto || !produto.codigo) return;
                    preencherProduto(produto);
                    carregarRelacionados(produto);
                })
                .catch(() => { /* backend fora do ar: mantém o conteúdo demo */ });
        }

        // ---------- AVALIAÇÕES ----------
        const reviewsTrackEl = document.getElementById('reviews-track');
        const formReview = document.getElementById('form-review');
        const reviewError = document.getElementById('review-error');
        let notaEscolhida = 0;

        function renderAvaliacoes(dados) {
            const total = dados.total || 0;
            const media = Number(dados.media) || 0;
            const lista = dados.avaliacoes || [];
            document.getElementById('reviews-summary').innerHTML = total
                ? `<span class="stars" aria-hidden="true">${estrelasHTML(media)}</span><span>${total} ${total === 1 ? 'AVALIAÇÃO' : 'AVALIAÇÕES'}</span>`
                : '';
            document.getElementById('reviews-media').textContent = total ? media.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) : '–';
            document.getElementById('reviews-media-stars').innerHTML = estrelasHTML(media);
            const recomendam = lista.filter(a => a.recomenda).length;
            document.getElementById('reviews-recomendam').textContent = total ? `${Math.round(recomendam / total * 100)}% RECOMENDAM` : 'SEM AVALIAÇÕES AINDA';
            document.getElementById('reviews-bars').innerHTML = [5, 4, 3, 2, 1].map(n => {
                const qtd = (dados.porNota && dados.porNota[n]) || 0;
                const pct = total ? Math.round(qtd / total * 100) : 0;
                return `<li><span>${n} <i class="fa-solid fa-star"></i></span><span class="bar"><span style="width:${pct}%"></span></span><span>${qtd}</span></li>`;
            }).join('');
            document.getElementById('reviews-empty').hidden = total > 0;
            document.querySelector('.reviews-carousel').hidden = total === 0;
            reviewsTrackEl.innerHTML = lista.map(a => `
                <article class="review-card">
                    <span class="stars">${estrelasHTML(a.nota)}</span>
                    <p class="review-title">${escHTML(a.titulo)}</p>
                    ${a.comentario ? `<p class="review-text">${escHTML(a.comentario)}</p>` : ''}
                    <p class="review-author">${escHTML(a.autor)}${a.tamanhoComprado ? ` · TAMANHO ${escHTML(a.tamanhoComprado)}` : ''}</p>
                    <p class="review-date">${a.data ? new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR') : ''}${a.recomenda ? ' · <i class="fa-solid fa-thumbs-up"></i> RECOMENDA' : ''}</p>
                </article>`).join('');
        }

        function carregarAvaliacoes() {
            if (typeof api === 'undefined' || !api.listarAvaliacoes) return;
            api.listarAvaliacoes(produtoAtual).then(renderAvaliacoes).catch(() => {
                document.getElementById('reviews-empty').hidden = false;
                document.getElementById('reviews-empty').textContent = 'NÃO FOI POSSÍVEL CARREGAR AS AVALIAÇÕES.';
            });
        }
        carregarAvaliacoes();

        function pintarNota(n) {
            formReview.querySelectorAll('.review-stars-input button').forEach(b => {
                const on = Number(b.dataset.nota) <= n;
                b.querySelector('i').className = on ? 'fa-solid fa-star' : 'fa-regular fa-star';
                b.setAttribute('aria-pressed', on);
            });
        }
        formReview?.querySelectorAll('.review-stars-input button').forEach(b => {
            b.addEventListener('click', () => { notaEscolhida = Number(b.dataset.nota); pintarNota(notaEscolhida); });
        });

        document.getElementById('btn-write-review')?.addEventListener('click', () => {
            if (!isUserLoggedIn || !clienteLogado) {
                // Precisa estar logado: abre o modal de login
                modalAuth?.classList.add('active');
                return;
            }
            formReview.hidden = false;
            document.getElementById('review-titulo').focus();
        });
        document.getElementById('btn-cancel-review')?.addEventListener('click', () => {
            formReview.hidden = true;
            reviewError.textContent = '';
        });

        formReview?.addEventListener('submit', async (e) => {
            e.preventDefault();
            reviewError.classList.remove('ok');
            reviewError.textContent = '';
            const titulo = document.getElementById('review-titulo').value.trim();
            if (!notaEscolhida) { reviewError.textContent = 'ESCOLHA UMA NOTA DE 1 A 5 ESTRELAS.'; return; }
            if (!titulo) { reviewError.textContent = 'DÊ UM TÍTULO PARA A SUA AVALIAÇÃO.'; return; }
            if (!clienteLogado) { modalAuth?.classList.add('active'); return; }
            const btn = formReview.querySelector('button[type="submit"]');
            btn.disabled = true;
            try {
                await api.avaliarProduto({
                    codigoProduto: produtoAtual,
                    codigoCliente: clienteLogado.codigo,
                    nota: notaEscolhida,
                    titulo,
                    comentario: document.getElementById('review-comentario').value.trim(),
                    tamanhoComprado: document.getElementById('review-tamanho').value || null,
                    recomenda: document.getElementById('review-recomenda').checked,
                });
                formReview.reset();
                notaEscolhida = 0;
                pintarNota(0);
                formReview.hidden = true;
                carregarAvaliacoes();
                reviewsTrackEl.scrollTo({ left: 0 });
            } catch (err) {
                reviewError.textContent = err.status
                    ? (err.message || 'NÃO FOI POSSÍVEL ENVIAR A AVALIAÇÃO.').toUpperCase()
                    : 'NÃO FOI POSSÍVEL CONECTAR AO SERVIDOR.';
            } finally {
                btn.disabled = false;
            }
        });

        // Seleção de tamanho (só um por vez; os botões são recriados com os tamanhos do produto)
        document.querySelector('.size-options')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.size-btn');
            if (!btn) return;
            document.querySelectorAll('.size-options .size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });

        // Quantidade
        const qtyValue = document.querySelector('.add-to-cart-row .qty-value');
        document.querySelector('.add-to-cart-row .qty-plus')?.addEventListener('click', () => {
            qtyValue.textContent = String(Number(qtyValue.textContent) + 1).padStart(2, '0');
        });
        document.querySelector('.add-to-cart-row .qty-minus')?.addEventListener('click', () => {
            qtyValue.textContent = String(Math.max(1, Number(qtyValue.textContent) - 1)).padStart(2, '0');
        });

        // "ADICIONAR" -> adiciona ao carrinho real (localStorage, api.js) e abre o carrinho
        document.getElementById('btn-add-to-cart')?.addEventListener('click', () => {
            const codigo = produtoAtual;
            const quantidade = Number(qtyValue?.textContent) || 1;
            carrinho.adicionar(codigo, quantidade);
            if (typeof renderCarrinho === 'function') renderCarrinho();
            modalCart?.classList.add('active');
        });

        // Abas: Descrição / Frete e prazo / Medidas
        document.querySelectorAll('.detail-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.detail-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.detail-tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
            });
        });

        // Calcular frete (simulação)
        const cepInput = document.getElementById('cep-input');
        cepInput?.addEventListener('input', () => {
            let v = cepInput.value.replace(/\D/g, '').slice(0, 8);
            if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5)}`;
            cepInput.value = v;
        });
        document.getElementById('btn-calcular-frete')?.addEventListener('click', () => {
            const resultado = document.getElementById('frete-resultado');
            if (!/^\d{5}-?\d{3}$/.test(cepInput.value)) {
                resultado.innerHTML = '<p class="form-error">DIGITE UM CEP VÁLIDO.</p>';
                return;
            }
            resultado.innerHTML = `
                <label class="radio-card"><input type="radio" name="frete-opcao" checked>
                    <div class="card-content"><div class="radio-header"><span>PAC</span><span>R$16,40</span></div><p class="desc">4 DIAS ÚTEIS</p></div>
                </label>
                <label class="radio-card"><input type="radio" name="frete-opcao">
                    <div class="card-content"><div class="radio-header"><span>SEDEX</span><span>R$13,40</span></div><p class="desc">7 DIAS ÚTEIS</p></div>
                </label>`;
        });

        // Carrossel de avaliações
        const reviewsTrack = document.getElementById('reviews-track');
        document.querySelector('.review-arrow-right')?.addEventListener('click', () => {
            if (reviewsTrack.firstElementChild) reviewsTrack.scrollBy({ left: reviewsTrack.firstElementChild.offsetWidth + 20, behavior: 'smooth' });
        });
        document.querySelector('.review-arrow-left')?.addEventListener('click', () => {
            if (reviewsTrack.firstElementChild) reviewsTrack.scrollBy({ left: -(reviewsTrack.firstElementChild.offsetWidth + 20), behavior: 'smooth' });
        });
    }

    // ==========================================
    // PÁGINA DE CATÁLOGO: FILTROS (aba "FILTRAR")
    // ==========================================
    const sidebarFilters = document.getElementById('sidebar-filters');

    if (sidebarFilters) {
        // Abrir/fechar o painel de filtros no mobile
        const btnMobileFilter = document.getElementById('btn-mobile-filter');
        const btnCloseFilter = document.getElementById('btn-close-filter');

        if (btnMobileFilter) {
            btnMobileFilter.addEventListener('click', () => {
                sidebarFilters.classList.add('active');
            });
        }
        if (btnCloseFilter) {
            btnCloseFilter.addEventListener('click', () => {
                sidebarFilters.classList.remove('active');
            });
        }

        // Recolher/expandir cada grupo de filtro (PREÇO, CATEGORIAS, GÊNERO...)
        sidebarFilters.querySelectorAll('.filter-title').forEach(title => {
            title.addEventListener('click', () => {
                title.closest('.filter-group').classList.toggle('collapsed');
            });
        });

        // Expandir subcategorias ao marcar a categoria-mãe (ROUPAS, ACESSÓRIOS, FOOTWEAR)
        sidebarFilters.querySelectorAll('.category-toggle').forEach(toggle => {
            toggle.addEventListener('change', () => {
                toggle.closest('.category-item').classList.toggle('expanded', toggle.checked);
            });
        });

        // Seleção de tamanhos (TAMANHOS)
        sidebarFilters.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
            });
        });

        // Limpar filtros
        const btnClear = sidebarFilters.querySelector('.filter-actions .btn-outline');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                sidebarFilters.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                sidebarFilters.querySelectorAll('.size-btn.active').forEach(btn => btn.classList.remove('active'));
                sidebarFilters.querySelectorAll('.category-item.expanded').forEach(item => item.classList.remove('expanded'));
                const slider = document.getElementById('price-slider');
                const maxLabel = document.getElementById('price-max');
                if (slider && maxLabel) {
                    slider.value = slider.max;
                    maxLabel.textContent = `R$ ${Number(slider.max).toLocaleString('pt-BR')}`;
                }
            });
        }

        // "LIMPAR TODOS OS FILTROS" no topo da página de catálogo
        const btnClearAll = document.getElementById('btn-clear-all-filters');
        if (btnClearAll && btnClear) {
            btnClearAll.addEventListener('click', () => btnClear.click());
        }
    }

    // ==========================================
    // PÁGINA MINHA CONTA: troca de abas
    // ==========================================
    const accountTabLinks = document.querySelectorAll('.account-tab-link');
    if (accountTabLinks.length) {
        function activateAccountTab(tabName) {
            accountTabLinks.forEach(l => l.classList.toggle('active', l.dataset.tab === tabName));
            document.querySelectorAll('.account-tab-content').forEach(c => {
                c.classList.toggle('active', c.id === `tab-${tabName}`);
            });
        }
        accountTabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                activateAccountTab(link.dataset.tab);
                history.replaceState(null, '', `?tab=${link.dataset.tab}`);
            });
        });
        // Abre a aba indicada na URL (?tab=dados / pedidos / config), vinda do menu de utilizador
        const requestedTab = new URLSearchParams(window.location.search).get('tab');
        if (requestedTab && document.getElementById(`tab-${requestedTab}`)) {
            activateAccountTab(requestedTab);
        }
    }
});

// Atualização em tempo real do Slider de Preço
const priceSlider = document.getElementById('price-slider');
const priceMaxDisplay = document.getElementById('price-max');

if (priceSlider) {
    priceSlider.addEventListener('input', (e) => {
        // Formata o número para o padrão brasileiro (ex: 7.000)
        const valor = Number(e.target.value).toLocaleString('pt-BR');
        priceMaxDisplay.textContent = `R$ ${valor}`;
    });
}

function nextStep(stepNumber) {
    // 1. Ocultar todos os conteúdos de passos
    document.querySelectorAll('.checkout-step-content').forEach(el => {
        el.classList.remove('active');
    });

    // 2. Remover a classe "active" do menu superior
    document.querySelectorAll('.checkout-steps .step').forEach(el => {
        el.classList.remove('active');
    });

    // 3. Ativar o passo atual (Conteúdo e Menu)
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    document.getElementById(`step-nav-${stepNumber}`).classList.add('active');

    // 4. Lógica de botões na Sidebar (Resumo)
    const btnFinalizar = document.getElementById('btn-finalizar');
    const checkoutSidebar = document.getElementById('checkout-sidebar');

    if (stepNumber === 1) {
        btnFinalizar.style.display = 'none'; // No passo 1, o botão de avançar está no formulário
    } else if (stepNumber === 2) {
        btnFinalizar.style.display = 'block'; // No passo 2, mostramos "FINALIZAR COMPRA" no resumo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (stepNumber === 3) {
        checkoutSidebar.style.display = 'none'; // No passo 3 (Sucesso), escondemos a sidebar
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/* ==========================================================================
   CHECKOUT: resumo real (carrinho + API de Produto) e finalização (POST /api/pedido)
   ========================================================================== */
async function renderResumoCheckout() {
    const container = document.getElementById('summary-products');
    if (!container || typeof api === 'undefined') return;
    const itens = carrinho.obter();
    container.innerHTML = '';
    let subtotal = 0;

    let quantidadeTotal = 0;
    for (const item of itens) {
        let produto;
        try {
            produto = await api.buscarProdutoPorCodigo(item.codigo);
        } catch {
            continue; // backend fora do ar
        }
        if (!produto || !produto.codigo) {
            carrinho.remover(item.codigo); // produto excluído do catálogo: não pode ir para o pedido
            continue;
        }
        subtotal += Number(produto.preco) * item.quantidade;
        quantidadeTotal += item.quantidade;

        const div = document.createElement('div');
        div.className = 'summary-product';
        div.innerHTML = `
            <img src="${caminhoImagem(produto.imagem)}" alt="${produto.nome}" class="summary-img" onerror="this.replaceWith(Object.assign(document.createElement('i'), {className:'fa-solid fa-image'}))">
            <div class="summary-prod-info">
                <p class="summary-prod-name">${produto.nome || ''}</p>
                <p class="summary-prod-price">${formatarPreco(produto.preco)} ${item.quantidade > 1 ? '&times; ' + item.quantidade : ''}</p>
            </div>`;
        container.appendChild(div);
    }

    document.getElementById('checkout-subtotal').textContent = formatarPreco(subtotal);
    document.getElementById('checkout-total').textContent = formatarPreco(subtotal);
    document.getElementById('checkout-items-count').textContent = 'ITENS NO CARRINHO: ' + quantidadeTotal;
}

async function finalizarPedido() {
    const erroEl = document.getElementById('checkout-finalizar-error');
    if (erroEl) erroEl.textContent = '';

    const cliente = (typeof sessao !== 'undefined') ? sessao.obter() : null;
    if (!cliente || !cliente.codigo) {
        if (erroEl) erroEl.textContent = 'FAÇA LOGIN PARA FINALIZAR O PEDIDO.';
        return;
    }
    const itens = carrinho.obter();
    if (itens.length === 0) {
        if (erroEl) erroEl.textContent = 'SEU CARRINHO ESTÁ VAZIO.';
        return;
    }
    const formaPagamentoInput = document.querySelector('input[name="pagamento"]:checked');
    const formaPagamento = formaPagamentoInput ? formaPagamentoInput.closest('label').textContent.trim() : 'CARTÃO DE CRÉDITO';

    const btn = document.getElementById('btn-finalizar');
    if (btn) btn.disabled = true;
    try {
        const resposta = await api.criarPedido({
            clienteCodigo: cliente.codigo,
            formaPagamento,
            itens: itens.map(i => ({ produtoCodigo: i.codigo, quantidade: i.quantidade })),
        });
        // A API responde 200 também em falhas de negócio ("Cliente não encontrado!", "produto não encontrado!").
        if (typeof resposta !== 'string' || !resposta.toLowerCase().includes('sucesso')) {
            if (erroEl) erroEl.textContent = String(resposta || 'NÃO FOI POSSÍVEL FINALIZAR O PEDIDO.').toUpperCase()
                + (/cliente/i.test(resposta) ? ' FAÇA LOGIN NOVAMENTE.' : '');
            renderResumoCheckout();
            return;
        }
        const codigoMatch = resposta.match(/(\d+)\s*$/);

        document.getElementById('confirm-codigo').textContent = codigoMatch ? '#' + codigoMatch[1] : '-';
        document.getElementById('confirm-total').textContent = document.getElementById('checkout-total').textContent;
        document.getElementById('confirm-pagamento').textContent = formaPagamento;

        carrinho.limpar();
        nextStep(3);
    } catch (err) {
        if (erroEl) erroEl.textContent = err.status
            ? (err.message || 'NÃO FOI POSSÍVEL FINALIZAR O PEDIDO.').toUpperCase()
            : 'NÃO FOI POSSÍVEL FINALIZAR O PEDIDO. VERIFIQUE SE O BACKEND ESTÁ RODANDO.';
        console.error(err);
    } finally {
        if (btn) btn.disabled = false;
    }
}

/* Checkout passo 1: preenche com os dados da conta logada (antes vinham fixos do mockup). */
async function preencherCheckoutComConta() {
    const cliente = await (typeof sessaoPronta !== 'undefined' ? sessaoPronta : Promise.resolve(sessao.obter()));
    const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
    const d = (v) => String(v || '').replace(/\D/g, '');
    if (!cliente) {
        const erro = document.getElementById('checkout-step1-error');
        if (erro) erro.textContent = 'FAÇA LOGIN PARA CARREGAR SEUS DADOS E FINALIZAR O PEDIDO.';
        return;
    }
    set('checkout-email', cliente.email);
    set('checkout-nome', cliente.nome);
    const cpf = d(cliente.documento);
    if (cpf.length === 11) set('checkout-cpf', cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
    const tel = d(cliente.telefone);
    if (tel) set('checkout-tel', tel.length === 11 ? tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : tel.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3'));
    const cep = d(cliente.cep);
    if (cep.length === 8) set('checkout-cep', cep.replace(/(\d{5})(\d{3})/, '$1-$2'));
    // "endereco" vem do ViaCEP como "Logradouro - Bairro": o número entra logo após a rua.
    const [rua, ...bairro] = String(cliente.endereco || '').split(' - ');
    const linha1 = [rua, cliente.numero].filter(Boolean).join(', ');
    const cidadeUf = [cliente.cidade, cliente.estado].filter(Boolean).join('/');
    set('checkout-endereco', [linha1, cliente.complemento, ...bairro, cidadeUf].filter(Boolean).join(' - '));
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('summary-products')) renderResumoCheckout();
    if (document.getElementById('form-checkout-step1') && typeof sessao !== 'undefined') preencherCheckoutComConta();
});