(function () {
  const API_BASE_URL = 'http://localhost:8080/api';
  const USER_STORAGE_KEY = 'usuarioLogado';
  const ROLE_ADMIN = 'ROLE_ADMINISTRADOR';

  document.addEventListener('DOMContentLoaded', () => {
    // =========================================================
    // LOGO → VOLTAR PARA A PÁGINA INICIAL
    // =========================================================

    const logo = document.querySelector('.logo');

    if (logo) {
      logo.style.cursor = 'pointer';

      logo.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

    // =========================================================
    // MENU DO USUÁRIO
    // =========================================================

    const userActions = document.querySelector('.user-actions');

    if (!userActions) return;

    const loginLink = userActions.querySelector('a[href="login.html"]');
    const cartLink = userActions.querySelector('a[href="carrinho.html"]');

    const usuario = getUsuarioLogado();

    // =========================================================
    // USUÁRIO NÃO LOGADO
    // =========================================================

    if (!usuario) {
      if (cartLink) {
        cartLink.style.display = 'none';
      }

      return;
    }

    // =========================================================
    // USUÁRIO LOGADO
    // =========================================================

    if (cartLink) {
      cartLink.style.display = '';

      adicionarBadgeCarrinho(
        cartLink,
        usuario.idCliente
      );
    }

    if (loginLink) {
      montarMenuUsuario(
        loginLink,
        usuario
      );
    }
  });

  // =========================================================
  // RECUPERA USUÁRIO LOGADO
  // =========================================================

  function getUsuarioLogado() {
    const raw = localStorage.getItem(USER_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error(
        'usuarioLogado invalido no localStorage:',
        err
      );

      localStorage.removeItem(USER_STORAGE_KEY);

      return null;
    }
  }

  // =========================================================
  // MENU DO USUÁRIO
  // =========================================================

  function montarMenuUsuario(loginLink, usuario) {
    const ehAdmin = usuario.role === ROLE_ADMIN;

    loginLink.removeAttribute('href');

    loginLink.setAttribute(
      'role',
      'button'
    );

    loginLink.setAttribute(
      'tabindex',
      '0'
    );

    loginLink.innerHTML = `
      <img
        src="../img/usuario_icon.png"
        alt="${usuario.nome}"
      />
      ${usuario.nome}
    `;

    // =========================================================
    // DROPDOWN
    // =========================================================

    const dropdown = document.createElement('div');

    dropdown.className = 'user-dropdown';

    dropdown.hidden = true;

    dropdown.innerHTML = `
      <ul>

        ${
          ehAdmin
            ? `
              <li>
                <a href="admin_produtos.html">
                  Gerenciamento
                </a>
              </li>
            `
            : ''
        }

        <li>
          <a href="carrinho.html">
            Meu carrinho
          </a>
        </li>

        <li>
          <a href="meus_pedidos.html">
            Meus pedidos
          </a>
        </li>

        <li>
          <button
            type="button"
            class="btn-logout"
          >
            Sair
          </button>
        </li>

      </ul>
    `;

    // =========================================================
    // WRAPPER DO MENU
    // =========================================================

    const wrapper = document.createElement('div');

    wrapper.className = 'user-menu-wrapper';

    loginLink.parentNode.insertBefore(
      wrapper,
      loginLink
    );

    wrapper.appendChild(loginLink);

    wrapper.appendChild(dropdown);

    // =========================================================
    // ABRIR / FECHAR MENU
    // =========================================================

    const toggleMenu = (event) => {
      event.stopPropagation();

      dropdown.hidden = !dropdown.hidden;
    };

    loginLink.addEventListener(
      'click',
      toggleMenu
    );

    loginLink.addEventListener(
      'keydown',
      (event) => {
        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();

          toggleMenu(event);
        }
      }
    );

    // =========================================================
    // FECHAR AO CLICAR FORA
    // =========================================================

    document.addEventListener(
      'click',
      (event) => {
        if (!wrapper.contains(event.target)) {
          dropdown.hidden = true;
        }
      }
    );

    // =========================================================
    // LOGOUT
    // =========================================================

    const btnLogout =
      dropdown.querySelector('.btn-logout');

    if (btnLogout) {
      btnLogout.addEventListener(
        'click',
        () => {
          localStorage.removeItem(
            USER_STORAGE_KEY
          );

          window.location.href = 'index.html';
        }
      );
    }
  }

  // =========================================================
  // BADGE DO CARRINHO
  // =========================================================

  function adicionarBadgeCarrinho(
    cartLink,
    idCliente
  ) {
    fetch(
      `${API_BASE_URL}/carrinho/${idCliente}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Erro ${res.status} ao buscar carrinho`
          );
        }

        return res.json();
      })

      .then((itens) => {
        const totalItens =
          Array.isArray(itens)
            ? itens.reduce(
                (soma, item) =>
                  soma + (item.quantidade || 0),
                0
              )
            : 0;

        let badge =
          cartLink.querySelector(
            '.cart-badge'
          );

        // =====================================================
        // TEM ITENS NO CARRINHO
        // =====================================================

        if (totalItens > 0) {
          if (!badge) {
            badge =
              document.createElement('span');

            badge.className =
              'cart-badge';

            cartLink.appendChild(
              badge
            );
          }

          badge.textContent =
            totalItens;
        }

        // =====================================================
        // CARRINHO VAZIO
        // =====================================================

        else if (badge) {
          badge.remove();
        }
      })

      .catch((err) => {
        console.error(
          'Nao foi possivel carregar o carrinho:',
          err
        );
      });
  }
})();