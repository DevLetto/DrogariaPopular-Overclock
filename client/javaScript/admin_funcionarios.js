/**
 * Painel administrativo de funcionários.
 *
 * APIs utilizadas (todas restritas a ROLE_ADMINISTRADOR no SecurityConfig):
 * GET    /api/funcionario
 * POST   /api/funcionario
 * PUT    /api/funcionario/{id}
 * DELETE /api/funcionario/{id}
 */

const API_BASE_URL = "http://localhost:8080/api";
let tokenCsrf = null;
let headerNameCsrf = null;
let preparacaoCsrf = null;

// ======================================================
// CSRF
// ======================================================

async function obterCsrf() {
    if (tokenCsrf && headerNameCsrf) {
        return { token: tokenCsrf, headerName: headerNameCsrf };
    }

    if (!preparacaoCsrf) {
        preparacaoCsrf = fetch(
            `${API_BASE_URL}/auth/csrf`,
            { credentials: "include" }
        ).then(async (resposta) => {
            if (!resposta.ok) {
                throw new Error(
                    "Não foi possível obter o token CSRF. Atualize a página e autentique-se novamente."
                );
            }

            const dados = await resposta.json();

            if (!dados?.token) {
                throw new Error(
                    "O servidor não retornou um token CSRF válido. Atualize a página."
                );
            }

            tokenCsrf = dados.token;
            headerNameCsrf = dados.headerName || "X-CSRF-TOKEN";

            return { token: tokenCsrf, headerName: headerNameCsrf };
        }).catch((erro) => {
            tokenCsrf = null;
            headerNameCsrf = null;
            throw erro;
        }).finally(() => {
            preparacaoCsrf = null;
        });
    }

    return preparacaoCsrf;
}

async function prepararOpcoesCsrf(opcoes) {
    const metodo = String(opcoes.method || "GET").toUpperCase();

    if (!["POST", "PUT", "DELETE"].includes(metodo)) {
        return opcoes;
    }

    const csrf = await obterCsrf();

    return {
        ...opcoes,
        headers: {
            ...(opcoes.headers || {}),
            [csrf.headerName]: csrf.token
        }
    };
}

// ======================================================
// ESTADO
// ======================================================

const CARGOS = {
    ADMINISTRADOR: { texto: "Administrador", classe: "cargo-administrador" },
    FARMACEUTICO: { texto: "Farmacêutico", classe: "cargo-farmaceutico" },
    ATENDENTE: { texto: "Atendente", classe: "cargo-atendente" },
    ESTOQUE_LOGISTICA: { texto: "Estoque e logística", classe: "cargo-estoque" }
};

const estado = {
    funcionarios: [],
    filtro: "todos",
    busca: ""
};

const TAMANHO_MINIMO_SENHA = 6;

// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener("DOMContentLoaded", inicializar);

async function inicializar() {
    configurarEventos();
    await carregarFuncionarios();
}

function configurarEventos() {

    document
        .getElementById("btn-novo-funcionario")
        .addEventListener("click", () => abrirFormulario());

    document
        .getElementById("input-busca")
        .addEventListener("input", (event) => {
            estado.busca = event.target.value.trim().toLowerCase();
            renderizarTabela();
        });

    const pills = document.querySelectorAll(".filter-pills .pill");

    pills.forEach((botao) => {
        botao.addEventListener("click", () => {
            pills.forEach((b) => b.classList.remove("active"));
            botao.classList.add("active");

            estado.filtro = botao.dataset.filtro || "todos";
            renderizarTabela();
        });
    });

    // Um único listener para todos os botões "Ver detalhes"
    document
        .getElementById("funcionarios-tbody")
        .addEventListener("click", (event) => {
            const botao = event.target.closest(".btn-detalhes");

            if (botao) {
                abrirDetalhes(botao.dataset.id);
            }
        });
}

// ======================================================
// API
// ======================================================

async function requisicao(endpoint, opcoes = {}) {

    const opcoesComCsrf = await prepararOpcoesCsrf(opcoes);

    // Atenção: os headers são montados DEPOIS do spread das opções,
    // senão o Content-Type some nas requisições com CSRF (POST/PUT/DELETE).
    const resposta = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...opcoesComCsrf,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(opcoesComCsrf.headers || {})
            }
        }
    );

    if (!resposta.ok) {

        if (resposta.status === 401 || resposta.status === 403) {
            tokenCsrf = null;
            headerNameCsrf = null;

            throw new Error(
                "Acesso negado ou sessão expirada. Entre como administrador, atualize a página e tente novamente."
            );
        }

        let mensagem = `Erro HTTP ${resposta.status}`;

        try {
            const erro = await resposta.json();

            mensagem =
                erro.message ||
                erro.mensagem ||
                erro.error ||
                mensagem;
        } catch (_) {
            // resposta não era JSON
        }

        throw new Error(mensagem);
    }

    if (resposta.status === 204) {
        return null;
    }

    const texto = await resposta.text();

    if (!texto) {
        return null;
    }

    try {
        return JSON.parse(texto);
    } catch (_) {
        return texto;
    }
}

// ======================================================
// CARREGAR
// ======================================================

async function carregarFuncionarios() {

    try {

        const dados = await requisicao("/funcionario");

        estado.funcionarios = Array.isArray(dados) ? dados : [];

        renderizarTabela();
        atualizarResumo();

    } catch (erro) {

        console.error("Erro ao carregar funcionários:", erro);

        document.getElementById("funcionarios-tbody").innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 30px;">
                    Não foi possível carregar os funcionários: ${escaparHTML(erro.message)}
                </td>
            </tr>
        `;

        mostrarToast(erro.message, "erro");
    }
}

// ======================================================
// TABELA
// ======================================================

function renderizarTabela() {

    const tbody = document.getElementById("funcionarios-tbody");

    const lista = estado.funcionarios.filter((funcionario) => {

        const texto = `${funcionario.nome ?? ""} ${funcionario.email ?? ""}`.toLowerCase();

        const correspondeBusca = !estado.busca || texto.includes(estado.busca);

        const correspondeFiltro =
            estado.filtro === "todos" ||
            funcionario.tipoFuncionario === estado.filtro;

        return correspondeBusca && correspondeFiltro;
    });

    if (lista.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 30px;">
                    Nenhum funcionário encontrado.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = lista.map(criarLinha).join("");
}

function criarLinha(funcionario) {

    const cargo = obterCargo(funcionario.tipoFuncionario);
    const inicial = (funcionario.nome || "?").trim().charAt(0).toUpperCase();

    return `
        <tr>

            <td>
                <div class="func-celula">

                    <div class="func-avatar">
                        ${escaparHTML(inicial)}
                    </div>

                    <strong>${escaparHTML(funcionario.nome || "-")}</strong>

                </div>
            </td>

            <td>${escaparHTML(funcionario.email || "-")}</td>

            <td>
                <span class="cargo-badge ${cargo.classe}">
                    ${escaparHTML(cargo.texto)}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="btn-detalhes"
                    data-id="${funcionario.id}"
                >
                    Ver detalhes
                </button>
            </td>

        </tr>
    `;
}

function atualizarResumo() {

    const contar = (tipo) =>
        estado.funcionarios.filter((f) => f.tipoFuncionario === tipo).length;

    document.getElementById("total-funcionarios").textContent = estado.funcionarios.length;
    document.getElementById("total-administradores").textContent = contar("ADMINISTRADOR");
    document.getElementById("total-farmaceuticos").textContent = contar("FARMACEUTICO");
    document.getElementById("total-atendentes").textContent = contar("ATENDENTE");
}

function obterCargo(tipo) {
    return CARGOS[tipo] || { texto: tipo || "Funcionário", classe: "cargo-estoque" };
}

// ======================================================
// MODAL (base)
// ======================================================

function criarModal(conteudo) {

    fecharModal();

    const modal = document.createElement("div");

    modal.className = "func-modal";

    modal.innerHTML = `
        <div class="func-modal-overlay"></div>

        <div class="func-modal-box" role="dialog" aria-modal="true">
            ${conteudo}
        </div>
    `;

    document.body.appendChild(modal);

    modal
        .querySelector(".func-modal-overlay")
        .addEventListener("click", fecharModal);

    modal
        .querySelectorAll("[data-fechar]")
        .forEach((botao) => botao.addEventListener("click", fecharModal));

    document.addEventListener("keydown", fecharComEsc);

    return modal;
}

function fecharModal() {

    document.querySelector(".func-modal")?.remove();

    document.removeEventListener("keydown", fecharComEsc);
}

function fecharComEsc(event) {

    if (event.key === "Escape") {
        fecharModal();
    }
}

// ======================================================
// DETALHES
// ======================================================

function abrirDetalhes(id) {

    const funcionario = estado.funcionarios.find(
        (f) => String(f.id) === String(id)
    );

    if (!funcionario) {
        return;
    }

    const cargo = obterCargo(funcionario.tipoFuncionario);

    const modal = criarModal(`

        <div class="func-modal-header">

            <div>
                <h2>${escaparHTML(funcionario.nome)}</h2>
                <span>Funcionário #${funcionario.id}</span>
            </div>

            <button
                type="button"
                class="func-modal-fechar"
                data-fechar
                aria-label="Fechar"
            >
                &times;
            </button>

        </div>

        <div class="func-info-grid">

            <div>
                <small>NOME</small>
                <strong>${escaparHTML(funcionario.nome)}</strong>
            </div>

            <div>
                <small>CARGO</small>
                <strong>${escaparHTML(cargo.texto)}</strong>
            </div>

            <div class="func-info-largo">
                <small>E-MAIL</small>
                <strong>${escaparHTML(funcionario.email)}</strong>
            </div>

        </div>

        <div class="func-modal-footer">

            <button
                type="button"
                class="btn-func btn-func-perigo"
                data-acao="excluir"
            >
                Excluir
            </button>

            <button
                type="button"
                class="btn-func btn-func-primary"
                data-acao="editar"
            >
                Editar
            </button>

        </div>
    `);

    modal
        .querySelector('[data-acao="editar"]')
        .addEventListener("click", () => abrirFormulario(funcionario));

    modal
        .querySelector('[data-acao="excluir"]')
        .addEventListener("click", () => excluirFuncionario(funcionario));
}

// ======================================================
// FORMULÁRIO (cadastrar / editar)
// ======================================================

function abrirFormulario(funcionario = null) {

    const editando = Boolean(funcionario);

    const opcoesCargo = Object.entries(CARGOS)
        .map(([valor, cargo]) => `
            <option
                value="${valor}"
                ${funcionario?.tipoFuncionario === valor ? "selected" : ""}
            >
                ${escaparHTML(cargo.texto)}
            </option>
        `)
        .join("");

    const modal = criarModal(`

        <div class="func-modal-header">

            <div>
                <h2>${editando ? "Editar funcionário" : "Novo funcionário"}</h2>

                <span>
                    ${editando
                        ? "Altere os dados de acesso da pessoa."
                        : "A pessoa poderá entrar no painel com o e-mail e a senha abaixo."}
                </span>
            </div>

            <button
                type="button"
                class="func-modal-fechar"
                data-fechar
                aria-label="Fechar"
            >
                &times;
            </button>

        </div>

        <form id="form-funcionario" novalidate>

            <div class="func-form-grid">

                <div class="func-form-grupo func-info-largo">
                    <label for="func-nome">Nome completo</label>

                    <input
                        id="func-nome"
                        name="nome"
                        type="text"
                        maxlength="150"
                        autocomplete="off"
                        value="${escaparHTML(funcionario?.nome ?? "")}"
                    >
                </div>

                <div class="func-form-grupo func-info-largo">
                    <label for="func-email">E-mail</label>

                    <input
                        id="func-email"
                        name="email"
                        type="email"
                        maxlength="150"
                        autocomplete="off"
                        value="${escaparHTML(funcionario?.email ?? "")}"
                    >
                </div>

                <div class="func-form-grupo func-info-largo">
                    <label for="func-cargo">Cargo</label>

                    <select
                        id="func-cargo"
                        name="tipoFuncionario"
                        ${editando ? "disabled" : ""}
                    >
                        ${editando ? "" : '<option value="">Selecione...</option>'}
                        ${opcoesCargo}
                    </select>

                    ${editando
                        ? '<span class="func-dica">O cargo não pode ser alterado depois do cadastro.</span>'
                        : ""}
                </div>

                <div class="func-form-grupo">
                    <label for="func-senha">
                        ${editando ? "Nova senha" : "Senha"}
                    </label>

                    <input
                        id="func-senha"
                        name="senha"
                        type="password"
                        autocomplete="new-password"
                        placeholder="${editando ? "Deixe em branco para manter" : `Mínimo de ${TAMANHO_MINIMO_SENHA} caracteres`}"
                    >
                </div>

                <div class="func-form-grupo">
                    <label for="func-senha-confirmacao">Confirmar senha</label>

                    <input
                        id="func-senha-confirmacao"
                        name="senhaConfirmacao"
                        type="password"
                        autocomplete="new-password"
                    >
                </div>

            </div>

            <div class="func-modal-footer">

                <button
                    type="button"
                    class="btn-func btn-func-secundario"
                    data-fechar
                >
                    Cancelar
                </button>

                <button type="submit" class="btn-func btn-func-primary">
                    ${editando ? "Salvar alterações" : "Cadastrar funcionário"}
                </button>

            </div>

        </form>
    `);

    const form = modal.querySelector("#form-funcionario");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await salvarFuncionario(form, funcionario);
    });

    form.elements.nome.focus();
}

async function salvarFuncionario(form, funcionario) {

    const editando = Boolean(funcionario);

    const nome = form.elements.nome.value.trim();
    const email = form.elements.email.value.trim();
    const tipoFuncionario = form.elements.tipoFuncionario.value;
    const senha = form.elements.senha.value;
    const confirmacao = form.elements.senhaConfirmacao.value;

    // -------- validações no front (o back valida de novo) --------

    if (!nome) {
        return mostrarToast("Informe o nome do funcionário.", "erro");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return mostrarToast("Informe um e-mail válido.", "erro");
    }

    if (!tipoFuncionario) {
        return mostrarToast("Selecione o cargo.", "erro");
    }

    if (!editando && !senha) {
        return mostrarToast("Informe uma senha para o funcionário.", "erro");
    }

    if (senha && senha.length < TAMANHO_MINIMO_SENHA) {
        return mostrarToast(
            `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`,
            "erro"
        );
    }

    if (senha !== confirmacao) {
        return mostrarToast("As senhas não conferem.", "erro");
    }

    const corpo = { nome, email, tipoFuncionario };

    if (senha) {
        corpo.senha = senha;
    }

    const botao = form.querySelector('button[type="submit"]');
    const textoOriginal = botao.textContent;

    botao.disabled = true;
    botao.textContent = "Salvando...";

    try {

        await requisicao(
            editando ? `/funcionario/${funcionario.id}` : "/funcionario",
            {
                method: editando ? "PUT" : "POST",
                body: JSON.stringify(corpo)
            }
        );

        fecharModal();

        await carregarFuncionarios();

        mostrarToast(
            editando
                ? "Funcionário atualizado com sucesso!"
                : "Funcionário cadastrado com sucesso!",
            "sucesso"
        );

    } catch (erro) {

        console.error("Erro ao salvar funcionário:", erro);

        mostrarToast(erro.message, "erro");

        botao.disabled = false;
        botao.textContent = textoOriginal;
    }
}

// ======================================================
// EXCLUIR
// ======================================================

async function excluirFuncionario(funcionario) {

    const confirmou = confirm(
        `Tem certeza que deseja excluir "${funcionario.nome}"?\n\nEssa operação não poderá ser desfeita.`
    );

    if (!confirmou) {
        return;
    }

    try {

        await requisicao(`/funcionario/${funcionario.id}`, { method: "DELETE" });

        fecharModal();

        await carregarFuncionarios();

        mostrarToast("Funcionário excluído com sucesso!", "sucesso");

    } catch (erro) {

        console.error("Erro ao excluir funcionário:", erro);

        mostrarToast(`Não foi possível excluir: ${erro.message}`, "erro");
    }
}

// ======================================================
// UTILITÁRIOS
// ======================================================

function escaparHTML(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function mostrarToast(mensagem, tipo = "sucesso") {

    document.querySelector(".func-toast")?.remove();

    const toast = document.createElement("div");

    toast.className = `func-toast ${tipo}`;
    toast.textContent = mensagem;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3500);
}