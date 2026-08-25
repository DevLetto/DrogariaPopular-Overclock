const API_BASE = "http://localhost:8080/api/auth";

function showTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("loginForm").style.display = isLogin
    ? "flex"
    : "none";
  document.getElementById("cadastroForm").style.display = isLogin
    ? "none"
    : "flex";
  document.getElementById("tabLogin").classList.toggle("active", isLogin);
  document.getElementById("tabCadastro").classList.toggle("active", !isLogin);
}

document.querySelectorAll(".toggle-visibility").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = btn.previousElementSibling;
    input.type = input.type === "password" ? "text" : "password";
  });
});

function mostrarErro(elId, mensagem) {
  const el = document.getElementById(elId);
  el.textContent = mensagem;
  el.style.display = "block";
}

function esconderErro(elId) {
  const el = document.getElementById(elId);
  el.style.display = "none";
  el.textContent = "";
}

function apenasDigitos(valor) {
  return (valor || "").replace(/\D/g, "");
}

async function chamarApi(caminho, corpo) {
  const resposta = await fetch(`${API_BASE}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.mensagem || "Ocorreu um erro. Tente novamente.");
  }

  return dados;
}

// ---------------- LOGIN ----------------

const formLogin = document.getElementById("formLogin");
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  esconderErro("loginError");

  const identificador = document
    .getElementById("loginIdentificador")
    .value.trim();
  const senha = document.getElementById("loginSenha").value;

  if (!identificador || !senha) {
    mostrarErro("loginError", "Preencha e-mail/CPF e senha.");
    return;
  }

  const submitBtn = document.getElementById("loginSubmit");
  submitBtn.disabled = true;

  try {
    const usuario = await chamarApi("/login", { identificador, senha });
    localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
    // ajuste o destino conforme a pagina real do seu sistema
    window.location.href = "index.html";
  } catch (err) {
    mostrarErro("loginError", err.message);
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------------- CADASTRO ----------------

const formCadastro = document.getElementById("formCadastro");
formCadastro.addEventListener("submit", async (e) => {
  e.preventDefault();
  esconderErro("cadastroError");

  const nome = document.getElementById("cadNome").value.trim();
  const cpf = apenasDigitos(document.getElementById("cadCpf").value);
  const telefone = document.getElementById("cadTelefone").value.trim();
  const email = document.getElementById("cadEmail").value.trim();
  const endereco = document.getElementById("cadEndereco").value.trim();
  const senha = document.getElementById("cadSenha").value;

  if (cpf.length !== 11) {
    mostrarErro("cadastroError", "CPF invalido, deve ter 11 digitos.");
    return;
  }
  if (senha.length < 8) {
    mostrarErro("cadastroError", "A senha deve ter no minimo 8 caracteres.");
    return;
  }

  const submitBtn = document.getElementById("cadastroSubmit");
  submitBtn.disabled = true;

  try {
    const usuario = await chamarApi("/cadastro", {
      nome,
      cpf,
      telefone,
      email,
      endereco,
      senha,
    });
    localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
    window.location.href = "index.html";
  } catch (err) {
    mostrarErro("cadastroError", err.message);
  } finally {
    submitBtn.disabled = false;
  }
});
