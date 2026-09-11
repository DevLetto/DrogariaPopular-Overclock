// header-auth.js
// Controla o comportamento do header: login/usuário e carrinho.
// Baseado no conteúdo salvo em localStorage na chave "usuarioLogado".
// Formato esperado: {"idCliente":5,"nome":"doido","email":"...","cpf":"...","contaAprovada":true}

(function () {
  const API_BASE_URL = 'http://localhost:8080/api';
  const USER_STORAGE_KEY = 'usuarioLogado';

  document.addEventListener('DOMContentLoaded', () => {
    const userActions = document.querySelector('.user-actions');
    if (!userActions) return;

    const loginLink = userActions.querySelector('a[href="login.html"]');
    const cartLink = userActions.querySelector('a[href="carrinho.html"]');

    const usuario = getUsuarioLogado();

    if (!usuario) {
      // Sem login: mantém "Entrar" e esconde o carrinho
      if (cartLink) cartLink.style.display = 'none';
      return;
    }

    // Com login: troca "Entrar" pelo nome, ativa dropdown, mostra carrinho
    if (cartLink) {
      cartLink.style.display = '';
      adicionarBadgeCarrinho(cartLink, usuario.idCliente);
    }

    if (loginLink) {
      montarMenuUsuario(loginLink, usuario);
    }
  });

  function getUsuarioLogado() {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error('usuarioLogado invalido no localStorage:', err);
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  }

  function montarMenuUsuario(loginLink, usuario) {
    // Transforma o link de login em botão com o nome do usuário
    loginLink.removeAttribute('href');
    loginLink.setAttribute('role', 'button');
    loginLink.setAttribute('tabindex', '0');
    loginLink.innerHTML = `<img src="../img/usuario_icon.png" alt="${usuario.nome}" /> ${usuario.nome}`;

    // Container do dropdown (hamburguer)
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.hidden = true;
    dropdown.innerHTML = `
      <ul>
        <li><a href="carrinho.html">Meu carrinho</a></li>
        <li><a href="meus_pedidos.html">Meus pedidos</a></li>
        <li><button type="button" class="btn-logout">Sair</button></li>
      </ul>
    `;

    // Wrapper posicionado pra segurar o botão + o dropdown
    const wrapper = document.createElement('div');
    wrapper.className = 'user-menu-wrapper';
    loginLink.parentNode.insertBefore(wrapper, loginLink);
    wrapper.appendChild(loginLink);
    wrapper.appendChild(dropdown);

    // Abre/fecha o menu ao clicar no nome
    const toggleMenu = (event) => {
      event.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
    };
    loginLink.addEventListener('click', toggleMenu);
    loginLink.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMenu(event);
      }
    });

    // Fecha ao clicar fora do menu
    document.addEventListener('click', (event) => {
      if (!wrapper.contains(event.target)) {
        dropdown.hidden = true;
      }
    });

    // Logout
    dropdown.querySelector('.btn-logout').addEventListener('click', () => {
      localStorage.removeItem(USER_STORAGE_KEY);
      window.location.href = 'index.html';
    });
  }

  function adicionarBadgeCarrinho(cartLink, idCliente) {
    fetch(`${API_BASE_URL}/carrinho/${idCliente}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status} ao buscar carrinho`);
        return res.json();
      })
      .then((itens) => {
        const totalItens = Array.isArray(itens)
          ? itens.reduce((soma, item) => soma + (item.quantidade || 0), 0)
          : 0;

        let badge = cartLink.querySelector('.cart-badge');

        if (totalItens > 0) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            cartLink.appendChild(badge);
          }
          badge.textContent = totalItens;
        } else if (badge) {
          badge.remove();
        }
      })
      .catch((err) => {
        console.error('Nao foi possivel carregar o carrinho:', err);
      });
  }
})();