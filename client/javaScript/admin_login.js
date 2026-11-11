/**
 * Tela de acesso ao painel (funcionários).
 *
 * API: POST /api/auth/login  { identificador, senha }
 * Mesmo endpoint do login da loja; aqui só deixamos entrar quem tem cargo
 * de funcionário e mandamos cada cargo para a sua tela inicial.
 */

const API_AUTH = "http://localhost:8080/api/auth";

// Cargo (trecho do role) -> primeira tela depois de entrar
const DESTINOS = [
    ["ADMINISTRADOR", "admin_dashboard.html"],
    ["FARMACEUTICO", "admin_receitas.html"],
    ["ATENDENTE", "admin_pedidos.html"],
    ["ESTOQUE", "admin_produtos.html"],
    ["LOGISTICA", "admin_produtos.html"]
];

const formLogin = document.getElementById("formLogin");
const botaoEntrar = document.getElementById("loginSubmit");

// ======================================================
// AVISOS NA TELA
// ======================================================

function mostrarErro(mensagem) {
    const el = document.getElementById("loginErro");

    el.textContent = mensagem;
    el.hidden = false;
}

function esconderErro() {
    const el = document.getElementById("loginErro");

    el.hidden = true;
    el.textContent = "";
}

// Quem chegou aqui pelo botão "trocar de conta" vê quem acabou de sair.
function mostrarContaAnterior() {

    let conta = null;

    try {
        conta = JSON.parse(sessionStorage.getItem("contaAnterior"));
        sessionStorage.removeItem("contaAnterior");
    } catch (_) {
        return;
    }

    if (!conta?.nome) {
        return;
    }

    const aviso = document.getElementById("avisoContaAnterior");

    const quem = conta.cargo ? `${conta.nome} (${conta.cargo})` : conta.nome;

    aviso.textContent = `A sessão de ${quem} foi encerrada. Entre com outra conta para continuar.`;
    aviso.hidden = false;
}

// ======================================================
// MOSTRAR / OCULTAR SENHA
// ======================================================

document.getElementById("btnVerSenha").addEventListener("click", (event) => {

    const botao = event.currentTarget;
    const campo = document.getElementById("loginSenha");

    const mostrar = campo.type === "password";

    campo.type = mostrar ? "text" : "password";

    botao.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
    botao.setAttribute("aria-pressed", String(mostrar));

    botao.querySelector(".material-symbols-outlined").textContent =
        mostrar ? "visibility_off" : "visibility";
});

// ======================================================
// API
// ======================================================

async function obterCsrf() {

    const resposta = await fetch(`${API_AUTH}/csrf`, { credentials: "include" });

    if (!resposta.ok) {
        throw new Error("Não foi possível iniciar a sessão. Atualize a página e tente de novo.");
    }

    return resposta.json();
}

async function chamarLogin(identificador, senha) {

    const resposta = await fetch(`${API_AUTH}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador, senha })
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {

        const mensagem = dados.mensagem || dados.message;

        if (mensagem) {
            throw new Error(mensagem);
        }

        if (resposta.status === 401 || resposta.status === 403) {
            throw new Error("E-mail ou senha incorretos.");
        }

        throw new Error("Ocorreu um erro. Tente novamente.");
    }

    return dados;
}

// Se alguém sem cargo de funcionário conseguir autenticar aqui
// (um cliente, por exemplo), a sessão criada é encerrada na hora.
async function encerrarSessao() {

    try {

        const csrf = await obterCsrf();

        await fetch(`${API_AUTH}/logout`, {
            method: "POST",
            credentials: "include",
            headers: { [csrf.headerName || "X-CSRF-TOKEN"]: csrf.token }
        });

    } catch (erro) {
        console.warn("Não foi possível encerrar a sessão:", erro);
    }
}

// ======================================================
// CARGO -> DESTINO
// ======================================================

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
    ].find(Boolean) ?? "";
}

function descobrirDestino(usuario) {

    const chave = String(obterRole(usuario))
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const encontrado = DESTINOS.find(([trecho]) => chave.includes(trecho));

    return encontrado ? encontrado[1] : null;
}

// ======================================================
// LOGIN
// ======================================================

formLogin.addEventListener("submit", async (event) => {

    event.preventDefault();
    esconderErro();

    const identificador = document.getElementById("loginIdentificador").value.trim();
    const senha = document.getElementById("loginSenha").value;

    if (!identificador || !senha) {
        mostrarErro("Preencha o e-mail e a senha.");
        return;
    }

    botaoEntrar.disabled = true;

    try {

        await obterCsrf();

        const usuario = await chamarLogin(identificador, senha);

        const destino = descobrirDestino(usuario);

        if (!destino) {
            await encerrarSessao();

            throw new Error(
                "Esta área é restrita a funcionários. Para entrar como cliente, use o login da loja."
            );
        }

        localStorage.setItem("usuarioLogado", JSON.stringify(usuario));

        window.location.href = destino;

    } catch (erro) {

        mostrarErro(erro.message);

        botaoEntrar.disabled = false;
    }
});

// ======================================================
// INICIALIZAÇÃO
// ======================================================

mostrarContaAnterior();

document.getElementById("loginIdentificador").focus();