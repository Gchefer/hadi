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

    // Estado de Autenticação Simulado (Altere para true para ver o menu "A Minha Conta")
    let isUserLoggedIn = false;

    // --- FUNÇÕES DE ABRIR/FECHAR MODAIS ---
    function closeModal(modal) {
        if(modal) modal.classList.remove('active');
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

    // --- SIMULAÇÃO DE LOGIN ---
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simula o login com sucesso
            isUserLoggedIn = true;
            closeModal(modalAuth);
            alert('Bem-vindo, Gustavo!');
        });
    }

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
    // CARRINHO: quantidade, remover item e cupom
    // ==========================================
    document.querySelectorAll('.cart-item').forEach(item => {
        const qtyValue = item.querySelector('.qty-value');
        item.querySelector('.qty-plus')?.addEventListener('click', () => {
            qtyValue.textContent = String(Number(qtyValue.textContent) + 1).padStart(2, '0');
        });
        item.querySelector('.qty-minus')?.addEventListener('click', () => {
            qtyValue.textContent = String(Math.max(1, Number(qtyValue.textContent) - 1)).padStart(2, '0');
        });
        item.querySelector('.cart-item-remove')?.addEventListener('click', () => item.remove());
    });

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