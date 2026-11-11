/**
 * Comportamentos compartilhados por todas as páginas do painel admin:
 *  1. Botão "Voltar à loja"
 *  2. Item "Funcionários" no menu lateral
 *  3. Rodapé da sidebar vira o botão da conta atual (nome + cargo).
 *     Ao clicar, a sessão é encerrada e a pessoa vai para admin_login.html.
 *
 * Tudo roda dentro de uma função para não colidir com as variáveis
 * globais dos scripts de cada página.
 */
(function () {
    "use strict";

    const API_AUTH = "http://localhost:8080/api/auth";
    const PAGINA_LOGIN = "admin_login.html";

    // ======================================================
    // 1. VOLTAR À LOJA
    // ======================================================

    function voltar() {
        window.location.href = "index.html";
    }

    window.voltar = voltar;

    const backBtn = document.getElementById("btnVoltarALoja");

    if (backBtn) {
        backBtn.addEventListener("click", voltar);
    }

    // ======================================================
    // 2. MENU: garante o item "Funcionários"
    // ======================================================

    function garantirMenuFuncionarios() {

        if (document.querySelector('.sidebar-menu a[href="admin_funcionarios.html"]')) {
            return;
        }

        const rotulo = [...document.querySelectorAll(".sidebar-menu .menu-label")]
            .find((el) => el.textContent.trim().toUpperCase().startsWith("PESSOAS"));

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

        if (lista.firstElementChild) {
            lista.firstElementChild.after(item);
        } else {
            lista.appendChild(item);
        }
    }

    // ======================================================
    // 3. CONTA ATUAL (rodapé da sidebar)
    // ======================================================

    const CARGOS = [
        ["ADMINISTRADOR", "Administrador"],
        ["FARMACEUTICO", "Farmacêutico"],
        ["ATENDENTE", "Atendente"],
        ["ESTOQUE", "Estoque e logística"],
        ["LOGISTICA", "Estoque e logística"],
        ["CLIENTE", "Cliente"]
    ];

    function lerUsuarioLogado() {
        try {
            return JSON.parse(localStorage.getItem("usuarioLogado"));
        } catch (_) {
            return null;
        }
    }

    // O formato exato do AuthResponse pode variar, então tentamos os nomes mais comuns.
    function obterNome(usuario) {

        const nome =
            usuario.nome ??
            usuario.nomeCompleto ??
            usuario.nomeUsuario ??
            usuario.name ??
            usuario.usuario?.nome ??
            null;

        if (nome) {
            return String(nome).trim();
        }

        return usuario.email ? String(usuario.email).split("@")[0] : null;
    }

    function obterRole(usuario) {

        const autoridade = Array.isArray(usuario.authorities)
            ? (usuario.authorities[0]?.authority ?? usuario.authorities[0])
            : null;

        const papel = Array.isArray(usuario.roles) ? usuario.roles[0] : null;

        return [
            usuario.role,
            usuario.tipoFuncionario,
            usuario.cargo,
            usuario.perfil,
            usuario.tipo,
            autoridade,
            papel
        ].find(Boolean) ?? null;
    }

    function formatarCargo(role) {

        if (!role) {
            return null;
        }

        const chave = String(role)
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const encontrado = CARGOS.find(([trecho]) => chave.includes(trecho));

        if (encontrado) {
            return encontrado[1];
        }

        const texto = chave.replace(/^ROLE_/, "").replaceAll("_", " ").toLowerCase();

        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function adicionarEstilosConta() {

        if (document.getElementById("estilos-conta-atual")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "estilos-conta-atual";

        style.textContent = `
            .sidebar-footer.conta-botao {
                cursor: pointer;
                border-radius: 10px;
                user-select: none;
                transition: background 0.2s ease, opacity 0.2s ease;
            }

            .sidebar-footer.conta-botao:hover {
                background: rgba(128, 128, 128, 0.18);
            }

            .sidebar-footer.conta-botao:focus-visible {
                outline: 2px solid rgba(255, 255, 255, 0.7);
                outline-offset: 2px;
            }

            .sidebar-footer.conta-botao.conta-ocupada {
                opacity: 0.6;
                pointer-events: none;
            }

            .sidebar-footer.conta-botao .user-info {
                min-width: 0;
                flex: 1;
            }

            .sidebar-footer.conta-botao .user-info p,
            .sidebar-footer.conta-botao .user-info strong,
            .sidebar-footer.conta-botao .user-info span {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .conta-botao-icone {
                display: flex;
                align-items: center;
                flex-shrink: 0;
                margin-left: auto;
                opacity: 0.7;
                transition: opacity 0.2s ease, transform 0.2s ease;
            }

            .sidebar-footer.conta-botao:hover .conta-botao-icone {
                opacity: 1;
                transform: scale(1.1);
            }
        `;

        document.head.appendChild(style);
    }

    let trocandoConta = false;

    async function trocarConta(rodape, nome, cargo) {

        if (trocandoConta) {
            return;
        }

        trocandoConta = true;

        rodape.classList.add("conta-ocupada");

        try {

            // Usado pela tela de login para avisar quem acabou de sair
            if (nome) {
                sessionStorage.setItem("contaAnterior", JSON.stringify({ nome, cargo }));
            }

            const respostaCsrf = await fetch(`${API_AUTH}/csrf`, { credentials: "include" });
            const csrf = await respostaCsrf.json();

            await fetch(`${API_AUTH}/logout`, {
                method: "POST",
                credentials: "include",
                headers: { [csrf.headerName || "X-CSRF-TOKEN"]: csrf.token }
            });

        } catch (erro) {

            // Mesmo que o servidor não responda, seguimos para o login.
            console.warn("Não foi possível encerrar a sessão no servidor:", erro);

        } finally {

            try {
                localStorage.removeItem("usuarioLogado");
            } catch (_) {
                // armazenamento indisponível
            }

            window.location.href = PAGINA_LOGIN;
        }
    }

    function configurarContaAtual() {

        const rodape = document.querySelector(".sidebar-footer");

        if (!rodape) {
            return;
        }

        const usuario = lerUsuarioLogado();

        const nome = usuario ? obterNome(usuario) : null;
        const cargo = usuario ? formatarCargo(obterRole(usuario)) : null;

        // Reaproveita os elementos que cada página já tem (p ou strong),
        // assim o visual de cada tela continua o mesmo.
        const avatar = rodape.querySelector(".user-avatar");
        const elementoNome = rodape.querySelector(".user-info p, .user-info strong");
        const elementoCargo = rodape.querySelector(".user-info span");

        const nomeExibido = nome || (usuario ? "Minha conta" : "Visitante");
        const cargoExibido = usuario ? (cargo || "Funcionário") : "Entrar";

        if (avatar) {
            avatar.textContent = nomeExibido.charAt(0).toUpperCase();
        }

        if (elementoNome) {
            elementoNome.textContent = nomeExibido;
        }

        if (elementoCargo) {
            elementoCargo.textContent = cargoExibido;
        }

        adicionarEstilosConta();

        rodape.classList.add("conta-botao");
        rodape.setAttribute("role", "button");
        rodape.setAttribute("tabindex", "0");
        rodape.setAttribute("title", "Trocar de conta");
        rodape.setAttribute(
            "aria-label",
            usuario
                ? `Conta de ${nomeExibido}, ${cargoExibido}. Clique para trocar de conta`
                : "Entrar em uma conta"
        );

        const icone = document.createElement("span");

        icone.className = "conta-botao-icone";
        icone.setAttribute("aria-hidden", "true");

        icone.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M6.99 11 3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/>
            </svg>
        `;

        rodape.appendChild(icone);

        rodape.addEventListener("click", () => trocarConta(rodape, nome, cargo));

        rodape.addEventListener("keydown", (event) => {

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                trocarConta(rodape, nome, cargo);
            }
        });
    }

    // ======================================================
    // INICIALIZAÇÃO
    // ======================================================

    garantirMenuFuncionarios();
    configurarContaAtual();
})();