document.addEventListener('DOMContentLoaded', () => {
    
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

    // Abrir Pesquisa
    btnSearch.addEventListener('click', () => {
        modalSearch.classList.add('active');
    });

    // Abrir Carrinho
    btnCart.addEventListener('click', () => {
        modalCart.classList.add('active');
    });

    // Lógica do Botão de Utilizador (Verifica se está logado)
    btnUser.addEventListener('click', () => {
        if (isUserLoggedIn) {
            userDropdown.classList.toggle('active');
        } else {
            modalAuth.classList.add('active');
            userDropdown.classList.remove('active');
        }
    });

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
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        // Simula o login com sucesso
        isUserLoggedIn = true; 
        closeModal(modalAuth);
        alert('Bem-vindo, Gustavo!');
    });

    // Fechar menu de utilizador ao clicar fora
    document.addEventListener('click', (e) => {
        if (!btnUser.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
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