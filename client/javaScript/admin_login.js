const API_AUTH = "http://localhost:8080/api/auth";

// Para onde cada cargo vai depois de entrar.
// Cargo que não estiver aqui NÃO entra no painel (ex.: cliente).
const DESTINOS = {
  ROLE_ADMINISTRADOR: "admin_produtos.html",
  ROLE_ATENDENTE: "admin_pedidos.html",
  ROLE_FARMACEUTICO: "admin_receitas.html",
  ROLE_FUNCIONARIO_ESTOQUE_LOGISTICA: "admin_produtos.html",
};

const formLogin = document.getElementById("formLogin");
const campoEmail = document.getElementById("loginEmail");
const campoSenha = document.getElementById("loginSenha");
const botaoEntrar = document.getElementById("loginSubmit");

// ---------------- AVISO DE TROCA DE CONTA ----------------

(function mostrarAvisoDeTroca() {
  let anterior = null;

  try {
    anterior = JSON.parse(sessionStorage.getItem("contaAnterior") || "null");
  } catch (_) {
    // ignora
  }

  sessionStorage.removeItem("contaAnterior");

  if (!anterior?.nome) {
    return;
  }

  const aviso = document.getElementById("trocaAviso");
  const texto = document.getElementById("trocaAvisoTexto");

  texto.textContent = "";

  const negrito = document.createElement("strong");
  negrito.textContent = anterior.nome;

  texto.append("Você saiu da conta de ", negrito);

  if (anterior.cargo) {
    texto.append(` (${anterior.cargo})`);
  }

  texto.append(". Entre com a próxima conta.");

  aviso.hidden = false;
})();

// ---------------- MOSTRAR / OCULTAR SENHA ----------------

document.querySelectorAll(".toggle-visibility").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = btn.parentElement.querySelector("input");
    const mostrar = input.type === "password";

    input.type = mostrar ? "text" : "password";

    btn.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
    btn.setAttribute("aria-pressed", String(mostrar));

    btn.querySelector(".material-symbols-outlined").textContent = mostrar
      ? "visibility_off"
      : "visibility";
  });
});

// ---------------- ERROS ----------------

function mostrarErro(mensagem) {
  const el = document.getElementById("loginError");

  el.textContent = mensagem;
  el.hidden = false;
}

function esconderErro() {
  const el = document.getElementById("loginError");

  el.textContent = "";
  el.hidden = true;
}

// ---------------- API ----------------

async function obterCsrf() {
  const resposta = await fetch(`${API_AUTH}/csrf`, { credentials: "include" });

  if (!resposta.ok) {
    throw new Error("Não foi possível falar com o servidor. Tente novamente.");
  }

  return resposta.json();
}

async function chamarLogin(identificador, senha) {
  const resposta = await fetch(`${API_AUTH}/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identificador, senha }),
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(
      dados.mensagem || dados.message || "E-mail ou senha incorretos.",
    );
  }

  return dados;
}

// Encerra a sessão no servidor (usado quando a conta não é de funcionário).
async function encerrarSessao() {
  try {
    const csrf = await obterCsrf();

    await fetch(`${API_AUTH}/logout`, {
      method: "POST",
      credentials: "include",
      headers: { [csrf.headerName || "X-CSRF-TOKEN"]: csrf.token },
    });
  } catch (erro) {
    console.warn("Não foi possível encerrar a sessão:", erro);
  }

  localStorage.removeItem("usuarioLogado");
}

// ---------------- LOGIN ----------------

formLogin.addEventListener("submit", async (event) => {
  event.preventDefault();
  esconderErro();

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  if (!email || !senha) {
    mostrarErro("Preencha o e-mail e a senha.");
    return;
  }

  botaoEntrar.disabled = true;
  botaoEntrar.textContent = "Entrando...";

  try {
    // Gera o cookie de CSRF antes do login (igual à tela de login da loja)
    await obterCsrf();

    const usuario = await chamarLogin(email, senha);

    const destino = DESTINOS[usuario.role];

    if (!destino) {
      await encerrarSessao();

      throw new Error(
        "Esta conta não tem acesso ao painel. Use uma conta de funcionário.",
      );
    }

    localStorage.setItem("usuarioLogado", JSON.stringify(usuario));

    window.location.href = destino;
  } catch (erro) {
    mostrarErro(erro.message);

    botaoEntrar.disabled = false;
    botaoEntrar.textContent = "Entrar no painel →";
  }
});
