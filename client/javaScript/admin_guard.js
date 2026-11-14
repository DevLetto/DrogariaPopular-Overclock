/**
 * admin_guard.js — proteção de rotas do painel (lado do navegador).
 *
 * Colocar no <head> de TODAS as páginas admin (menos admin_login.html):
 *   <script src="../javaScript/admin_guard.js"></script>
 *
 * Como funciona:
 *  1. Esconde a página assim que carrega (evita "piscar" o painel).
 *  2. Pergunta ao servidor quem está logado: GET /api/auth/me.
 *  3. Sem sessão  -> manda para admin_login.html.
 *     Cargo sem permissão nessa página -> manda para a página inicial do cargo.
 *  4. Tudo certo -> mostra a página e avisa o admin_header.js (nome e cargo).
 *
 * IMPORTANTE: isto é só experiência de uso. A segurança de verdade é o
 * SecurityConfig do back-end; aqui a gente só evita mostrar tela que a
 * pessoa não pode usar.
 */
(function () {

    const API_AUTH = "http://localhost:8080/api/auth";
    const PAGINA_LOGIN = "admin_login.html";
    const PAGINA_LOJA = "index.html";

    const ADMIN = "ROLE_ADMINISTRADOR";
    const ATENDENTE = "ROLE_ATENDENTE";
    const FARMACEUTICO = "ROLE_FARMACEUTICO";
    const ESTOQUE = "ROLE_FUNCIONARIO_ESTOQUE_LOGISTICA";

    // ------------------------------------------------------
    // QUEM PODE ABRIR CADA PÁGINA (espelha o SecurityConfig)
    // Página admin que não estiver aqui -> só administrador.
    // ------------------------------------------------------
    const PERMISSOES = {
        "admin_dashboard.html": [ADMIN],
        "admin_produtos.html": [ADMIN, ESTOQUE],
        "admin_pedidos.html": [ADMIN, ATENDENTE],
        "admin_receitas.html": [ADMIN, FARMACEUTICO],
        "admin_promocoes.html": [ADMIN],
        "admin_categorias.html": [ADMIN],
        "admin_clientes.html": [ADMIN],
        "admin_funcionarios.html": [ADMIN],
        "admin_lojas.html": [ADMIN],
        "admin_servicos.html": [ADMIN]
    };

    // Página inicial de cada cargo (tem que estar liberada para ele acima!)
    const PAGINA_INICIAL = {
        [ADMIN]: "admin_produtos.html",
        [ATENDENTE]: "admin_pedidos.html",
        [FARMACEUTICO]: "admin_receitas.html",
        [ESTOQUE]: "admin_produtos.html"
    };

    const pagina = location.pathname.split("/").pop() || "";

    // ------------------------------------------------------
    // 1) ESCONDE A PÁGINA ATÉ CONFIRMAR O ACESSO
    // ------------------------------------------------------
    const estiloOculto = document.createElement("style");

    estiloOculto.id = "admin-guard-oculta";
    estiloOculto.textContent = "html { visibility: hidden !important; }";

    document.documentElement.appendChild(estiloOculto);

    verificarAcesso();

    // ------------------------------------------------------
    // 2) PERGUNTA AO SERVIDOR
    // ------------------------------------------------------
    async function verificarAcesso() {

        let resposta;

        try {

            resposta = await fetch(`${API_AUTH}/me`, { credentials: "include" });

        } catch (erro) {

            // Servidor fora do ar: não dá pra saber quem é a pessoa
            mostrarErroDeConexao();
            return;
        }

        // Sem sessão (o back responde 401 ou 403 para anônimo)
        if (resposta.status === 401 || resposta.status === 403) {

            localStorage.removeItem("usuarioLogado");

            irPara(PAGINA_LOGIN);
            return;
        }

        if (!resposta.ok) {
            mostrarErroDeConexao();
            return;
        }

        const usuario = await resposta.json();

        // ------------------------------------------------------
        // 3) CARGO PODE ABRIR ESTA PÁGINA?
        // ------------------------------------------------------
        const permitidos = PERMISSOES[pagina] ?? [ADMIN];

        if (!permitidos.includes(usuario.role)) {

            const destino = PAGINA_INICIAL[usuario.role];

            // Cliente (ou cargo desconhecido) não tem página no painel
            if (!destino || destino === pagina) {

                sessionStorage.setItem(
                    "avisoAcesso",
                    "Essa conta não tem acesso ao painel."
                );

                irPara(PAGINA_LOJA);
                return;
            }

            sessionStorage.setItem(
                "avisoAcesso",
                "Você não tem permissão para acessar essa página."
            );

            irPara(destino);
            return;
        }

        // ------------------------------------------------------
        // 4) LIBERADO
        // ------------------------------------------------------
        try {
            localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
        } catch (_) {
            // sem localStorage: segue sem ele
        }

        window.__usuarioAdmin = usuario;

        document.dispatchEvent(
            new CustomEvent("admin-usuario-pronto", { detail: usuario })
        );

        estiloOculto.remove();

        quandoCorpoExistir(mostrarAvisoPendente);
    }

    function irPara(destino) {
        // replace: o botão "voltar" do navegador não cai de novo na página bloqueada
        location.replace(destino);
    }

    // ------------------------------------------------------
    // AVISOS NA TELA
    // ------------------------------------------------------
    function quandoCorpoExistir(funcao) {

        if (document.body) {
            funcao();
        } else {
            document.addEventListener("DOMContentLoaded", funcao, { once: true });
        }
    }

    function mostrarAvisoPendente() {

        const texto = sessionStorage.getItem("avisoAcesso");

        sessionStorage.removeItem("avisoAcesso");

        if (!texto) {
            return;
        }

        const aviso = document.createElement("div");

        aviso.textContent = texto;

        aviso.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 10001;
            max-width: 360px;
            padding: 14px 18px;
            border-radius: 9px;
            background: #b42318;
            color: #ffffff;
            font: 14px/1.4 sans-serif;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
        `;

        document.body.appendChild(aviso);

        setTimeout(() => aviso.remove(), 4500);
    }

    function mostrarErroDeConexao() {

        quandoCorpoExistir(() => {

            const painel = document.createElement("div");

            // visibility: visible funciona mesmo com o <html> escondido
            painel.style.cssText = `
                visibility: visible;
                position: fixed;
                inset: 0;
                z-index: 10002;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 14px;
                padding: 24px;
                background: #f4f6fc;
                color: #0b1157;
                font-family: sans-serif;
                text-align: center;
            `;

            painel.innerHTML = `
                <strong style="font-size: 20px;">
                    Não foi possível verificar o seu acesso
                </strong>

                <span>Confira se o servidor está rodando e tente de novo.</span>

                <button
                    type="button"
                    style="
                        padding: 11px 20px;
                        border: 0;
                        border-radius: 8px;
                        background: #0b1157;
                        color: #ffffff;
                        font-weight: 700;
                        cursor: pointer;
                    "
                >
                    Tentar de novo
                </button>
            `;

            painel.querySelector("button").addEventListener("click", () => location.reload());

            document.body.appendChild(painel);
        });
    }
})();