// ======================================================
// BOTÃO "VOLTAR À LOJA"
// ======================================================

const backBtn = document.getElementById("btnVoltarALoja");

if (backBtn) {
  backBtn.addEventListener("click", voltar);
}

function voltar() {
  window.location.href = "index.html";
}

// ======================================================
// MENU: garante o item "Funcionários" em todas as páginas
// do painel (evita editar a sidebar de cada HTML na mão).
// Se a página já tiver o link, nada é feito.
// ======================================================

(function garantirMenuFuncionarios() {
  if (
    document.querySelector('.sidebar-menu a[href="admin_funcionarios.html"]')
  ) {
    return;
  }

  const rotulo = [
    ...document.querySelectorAll(".sidebar-menu .menu-label"),
  ].find((el) => el.textContent.trim().toUpperCase().startsWith("PESSOAS"));

  const lista = rotulo?.nextElementSibling;

  if (!lista || lista.tagName !== "UL") {
    return;
  }

  const item = document.createElement("li");

  item.innerHTML = `
        <a href="admin_funcionarios.html">
            <img src="../img/usuario_icon.png" alt="" class="sidebar-icon">
            Funcionários
        </a>
    `;

  // Logo depois de "Clientes"
  if (lista.firstElementChild) {
    lista.firstElementChild.after(item);
  } else {
    lista.appendChild(item);
  }
})();

// ======================================================
// RODAPÉ DA SIDEBAR: botão "conta atual / trocar de conta"
// Mostra nome e cargo de quem está logado. Os dados vêm do
// admin_guard.js (que pergunta ao servidor); se o guard não
// estiver na página, usa o localStorage.usuarioLogado.
// Ao clicar, encerra a sessão e vai para a tela de login.
// ======================================================

(function configurarBotaoConta() {
  const API_AUTH = "/api/auth";
  const PAGINA_LOGIN = "admin_login.html";

  const CARGOS = {
    ROLE_ADMINISTRADOR: "Administrador",
    ROLE_FARMACEUTICO: "Farmacêutico",
    ROLE_ATENDENTE: "Atendente",
    ROLE_FUNCIONARIO_ESTOQUE_LOGISTICA: "Estoque e logística",
  };

  const rodape = document.querySelector(".sidebar-footer");

  if (!rodape) {
    return;
  }

  const avatar = rodape.querySelector(".user-avatar");
  const info = rodape.querySelector(".user-info");
  const titulo = info?.querySelector("p, strong");
  const subtitulo = info?.querySelector("span");

  // Estado atual (atualizado por renderizar)
  let usuario = null;
  let nome = "";
  let cargo = "";

  function lerUsuarioSalvo() {
    try {
      return JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    } catch (_) {
      return null;
    }
  }

  function rotuloCargo(valor) {
    if (!valor) {
      return "Sem cargo";
    }

    if (CARGOS[valor]) {
      return CARGOS[valor];
    }

    const limpo = String(valor)
      .replace(/^ROLE_/, "")
      .replaceAll("_", " ")
      .toLowerCase();

    return limpo.charAt(0).toUpperCase() + limpo.slice(1);
  }

  function renderizar(dados) {
    usuario = dados || null;

    const role =
      usuario?.role ?? usuario?.perfil ?? usuario?.tipoFuncionario ?? "";

    nome = usuario
      ? (usuario.nome ?? usuario.nomeCompleto ?? usuario.email ?? "Usuário")
      : "Visitante";

    cargo = usuario ? rotuloCargo(role) : "Entrar";

    if (avatar) {
      avatar.textContent = nome.trim().charAt(0).toUpperCase() || "?";
    }

    if (titulo) {
      titulo.textContent = nome;
    }

    if (subtitulo) {
      subtitulo.textContent = cargo;
    }

    rodape.setAttribute(
      "title",
      usuario ? `Trocar de conta (${nome})` : "Entrar",
    );
  }

  // -------- vira botão --------

  rodape.classList.add("conta-botao");
  rodape.setAttribute("role", "button");
  rodape.setAttribute("tabindex", "0");

  const icone = document.createElement("span");

  icone.className = "conta-trocar";
  icone.setAttribute("aria-hidden", "true");

  icone.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 4 3 8l4 4"></path>
            <path d="M3 8h14"></path>
            <path d="m17 20 4-4-4-4"></path>
            <path d="M21 16H7"></path>
        </svg>
    `;

  rodape.appendChild(icone);

  adicionarEstilos();

  // Primeiro com o que já existe; depois o guard confirma com o servidor
  renderizar(window.__usuarioAdmin ?? lerUsuarioSalvo());

  document.addEventListener("admin-usuario-pronto", (event) => {
    renderizar(event.detail);
  });

  rodape.addEventListener("click", trocarConta);

  rodape.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      trocarConta();
    }
  });

  // -------- ação --------

  let trocando = false;

  async function trocarConta() {
    if (trocando) {
      return;
    }

    trocando = true;

    rodape.classList.add("conta-trocando");

    if (usuario) {
      // Só para a tela de login mostrar "você saiu da conta de ..."
      sessionStorage.setItem("contaAnterior", JSON.stringify({ nome, cargo }));
    }

    await encerrarSessao();

    window.location.href = PAGINA_LOGIN;
  }

  async function encerrarSessao() {
    // Se o servidor demorar, não prende a pessoa na tela
    const controle = new AbortController();
    const limite = setTimeout(() => controle.abort(), 4000);

    try {
      const resposta = await fetch(`${API_AUTH}/csrf`, {
        credentials: "include",
        signal: controle.signal,
      });

      const csrf = await resposta.json();

      await fetch(`${API_AUTH}/logout`, {
        method: "POST",
        credentials: "include",
        signal: controle.signal,
        headers: {
          [csrf.headerName || "X-CSRF-TOKEN"]: csrf.token,
        },
      });
    } catch (erro) {
      console.warn("Não foi possível encerrar a sessão no servidor:", erro);
    } finally {
      clearTimeout(limite);

      localStorage.removeItem("usuarioLogado");
    }
  }

  function adicionarEstilos() {
    if (document.getElementById("estilos-conta-botao")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "estilos-conta-botao";

    style.textContent = `

            .sidebar-footer.conta-botao {
                cursor: pointer;
                border-radius: 10px;
                transition: background 0.2s ease, opacity 0.2s ease;
            }

            .sidebar-footer.conta-botao:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .sidebar-footer.conta-botao:focus-visible {
                outline: 2px solid #ffffff;
                outline-offset: 2px;
            }

            .sidebar-footer.conta-trocando {
                opacity: 0.6;
                pointer-events: none;
            }

            .sidebar-footer .user-info {
                min-width: 0;
            }

            .sidebar-footer .user-info p,
            .sidebar-footer .user-info strong,
            .sidebar-footer .user-info span {
                display: block;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .sidebar-footer .conta-trocar {
                margin-left: auto;
                display: flex;
                flex-shrink: 0;
                opacity: 0.7;
            }

            .sidebar-footer.conta-botao:hover .conta-trocar {
                opacity: 1;
            }
        `;

    document.head.appendChild(style);
  }
})();
