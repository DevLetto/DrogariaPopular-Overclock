const API_RECEITA = "http://localhost:8080/api/receita";
let receitas = [];
let filtroStatus = "TODOS";

const estadoReceitas = document.getElementById("estadoReceitas");
const tabelaReceitas = document.getElementById("tabelaReceitas");
const corpoReceitas = document.getElementById("corpoReceitas");
const btnAtualizar = document.getElementById("btnAtualizarReceitas");
const filtros = document.getElementById("receitasFiltros");

function escaparHTML(texto) {
    const elemento = document.createElement("div");
    elemento.textContent = texto == null ? "" : String(texto);
    return elemento.innerHTML;
}

function formatarData(valor) {
    if (!valor) return "-";

    const texto = Array.isArray(valor)
        ? `${valor[0]}-${String(valor[1]).padStart(2, "0")}-${String(valor[2]).padStart(2, "0")}`
        : String(valor);
    const partes = texto.slice(0, 10).split("-");
    if (partes.length !== 3) return "-";

    const data = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    if (Number.isNaN(data.getTime())) return "-";

    return data.toLocaleDateString("pt-BR");
}

function classeStatus(status) {
    if (status === "APROVADA") return "status-aprovado";
    if (status === "REJEITADA") return "status-esgotado";
    return "status-pendente";
}

function mostrarEstado(mensagem) {
    estadoReceitas.hidden = false;
    estadoReceitas.textContent = mensagem;
    tabelaReceitas.hidden = true;
}

async function carregarReceitas() {
    mostrarEstado("Carregando receitas...");

    try {
        const resposta = await AdminCsrf.fetch(API_RECEITA, {
            method: "GET",
        });

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar as receitas.");
        }

        const dados = await resposta.json();
        receitas = Array.isArray(dados) ? dados : [];
        renderizarReceitas();
    } catch (erro) {
        console.error(erro);
        mostrarEstado("Não foi possível carregar as receitas.");
    }
}

function renderizarReceitas() {
    const filtradas = filtroStatus === "TODOS"
        ? receitas
        : receitas.filter((receita) => receita.status === filtroStatus);

    corpoReceitas.innerHTML = "";

    if (filtradas.length === 0) {
        mostrarEstado("Nenhuma receita encontrada.");
        return;
    }

    estadoReceitas.hidden = true;
    tabelaReceitas.hidden = false;

    filtradas.forEach((receita) => {
        const status = receita.status || "PENDENTE";
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td><strong>#${Number(receita.id) || "-"}</strong></td>
            <td><span class="receita-cliente">${escaparHTML(receita.nomeCliente || "Cliente")} · #${Number(receita.idCliente) || "-"}</span></td>
            <td><span class="receita-arquivo">${escaparHTML(receita.arquivo || "-")}</span></td>
            <td>${formatarData(receita.dataEnvio)}</td>
            <td><span class="status-badge ${classeStatus(status)}">${escaparHTML(status)}</span></td>
            <td>
                <div class="receita-acoes action-cell">
                    <button type="button" class="pill btn-visualizar" data-id="${receita.id}" data-acao="visualizar">Visualizar</button>
                </div>
            </td>
        `;

        corpoReceitas.appendChild(linha);
    });
}

async function visualizarReceita(id) {
    const receita = receitas.find((item) => Number(item.id) === Number(id));
    if (!receita) {
        mostrarNotificacao("Receita não encontrada na listagem.", "erro");
        return;
    }

    try {
        const resposta = await AdminCsrf.fetch(`${API_RECEITA}/${id}/arquivo`, {
            method: "GET",
        });

        if (!resposta.ok) {
            throw new Error(await obterMensagemErro(resposta,
                "Não foi possível abrir o arquivo da receita."));
        }

        const blob = await resposta.blob();
        const url = URL.createObjectURL(blob);
        criarModalDocumento(receita, blob, url);
    } catch (erro) {
        console.error(erro);
        mostrarNotificacao(erro.message, "erro");
    }
}

function criarModalDocumento(receita, blob, url) {
    const modalExistente = document.querySelector("#modalReceita");
    if (modalExistente) modalExistente.remove();

    const contentType = blob.type || "";
    const nomeArquivo = receita.arquivo || `receita-${receita.id}`;
    const extensao = nomeArquivo.toLowerCase().split(".").pop() || "";
    const ehPdf = contentType.includes("pdf") || extensao === "pdf";
    const ehImagem = contentType.startsWith("image/") || ["jpg", "jpeg", "png"].includes(extensao);

    const overlay = document.createElement("div");
    overlay.id = "modalReceita";
    overlay.className = "modal-overlay receita-modal-overlay";
    overlay.innerHTML = `
        <div class="modal receita-modal" role="dialog" aria-modal="true" aria-labelledby="tituloModalReceita">
            <div class="modal-header">
                <div>
                    <h2 id="tituloModalReceita">Receita #${Number(receita.id) || "-"}</h2>
                    <span>${escaparHTML(nomeArquivo)} · Cliente: ${escaparHTML(receita.nomeCliente || "Cliente")} · Status: ${escaparHTML(receita.status || "PENDENTE")}</span>
                </div>
                <button type="button" class="modal-fechar" aria-label="Fechar">×</button>
            </div>
            <div class="receita-documento">
                ${ehPdf ? `<iframe class="receita-pdf" src="${escaparHTML(url)}" title="Documento da receita"></iframe>` : ""}
                ${ehImagem ? `<img class="receita-imagem" src="${escaparHTML(url)}" alt="Receita enviada pelo cliente">` : ""}
                ${!ehPdf && !ehImagem ? `<div class="receitas-estado">Formato de arquivo não suportado para visualização.</div>` : ""}
            </div>
            <div class="receita-modal-erro" hidden></div>
            ${receita.status === "PENDENTE" ? `
                <div class="receita-modal-acoes">
                    <button type="button" class="btn-primary" data-modal-acao="confirmar-aprovar">Aprovar</button>
                    <button type="button" class="btn-rejeitar" data-modal-acao="mostrar-rejeitar">Rejeitar</button>
                </div>
                <div class="receita-confirmacao" data-confirmacao="aprovar" hidden>
                    <p>Deseja aprovar esta receita? A ação não poderá ser desfeita.</p>
                    <div class="campo-formulario">
                        <div class="modal-acoes">
                            <button type="button" class="btn-cancelar" data-modal-acao="cancelar-confirmacao">Cancelar</button>
                            <button type="button" class="btn-primary" data-modal-acao="aprovar">Confirmar aprovação</button>
                        </div>
                    </div>
                </div>
                <div class="receita-rejeicao" data-confirmacao="rejeitar" hidden>
                    <div class="campo-formulario">
                        <label for="motivoRejeicao">Motivo da rejeição</label>
                        <textarea id="motivoRejeicao" maxlength="500" rows="4"></textarea>
                    </div>
                    <div class="modal-acoes">
                        <button type="button" class="btn-cancelar" data-modal-acao="cancelar-confirmacao">Cancelar</button>
                        <button type="button" class="btn-danger" data-modal-acao="rejeitar">Confirmar rejeição</button>
                    </div>
                </div>
            ` : ""}
        </div>
    `;

    document.body.appendChild(overlay);
    const fechar = () => {
        overlay.remove();
        URL.revokeObjectURL(url);
    };

    overlay.querySelector(".modal-fechar").addEventListener("click", fechar);
    overlay.addEventListener("click", (evento) => {
        if (evento.target === overlay) fechar();
    });

    const erroElemento = overlay.querySelector(".receita-modal-erro");
    const botoesAcao = overlay.querySelector(".receita-modal-acoes");

    overlay.addEventListener("click", async (evento) => {
        const botao = evento.target.closest("button[data-modal-acao]");
        if (!botao || botao.disabled) return;

        const acao = botao.dataset.modalAcao;
        if (acao === "confirmar-aprovar") {
            botoesAcao.hidden = true;
            overlay.querySelector('[data-confirmacao="aprovar"]').hidden = false;
        } else if (acao === "mostrar-rejeitar") {
            botoesAcao.hidden = true;
            const rejeicao = overlay.querySelector('[data-confirmacao="rejeitar"]');
            rejeicao.hidden = false;
            rejeicao.querySelector("textarea").focus();
        } else if (acao === "cancelar-confirmacao") {
            overlay.querySelector('[data-confirmacao="aprovar"]').hidden = true;
            overlay.querySelector('[data-confirmacao="rejeitar"]').hidden = true;
            botoesAcao.hidden = false;
        } else if (acao === "aprovar" || acao === "rejeitar") {
            let motivo = null;
            if (acao === "rejeitar") {
                motivo = overlay.querySelector("#motivoRejeicao").value.trim();
                if (!motivo) {
                    erroElemento.hidden = false;
                    erroElemento.textContent = "Informe o motivo da rejeição.";
                    return;
                }
            }

            erroElemento.hidden = true;
            overlay.querySelectorAll("[data-modal-acao]").forEach((item) => {
                item.disabled = true;
            });

            try {
                await executarAvaliacaoReceita(receita, acao, motivo);
                fechar();
            } catch (erro) {
                console.error(erro);
                erroElemento.hidden = false;
                erroElemento.textContent = erro.message;
                overlay.querySelectorAll("[data-modal-acao]").forEach((item) => {
                    item.disabled = false;
                });
            }
        }
    });
}

async function obterMensagemErro(resposta, fallback) {
    let mensagemBackend = "";
    try {
        const corpo = await resposta.clone().text();
        if (corpo) {
            try {
                const dados = JSON.parse(corpo);
                mensagemBackend = dados.message || dados.mensagem || "";
            } catch {
                mensagemBackend = corpo;
            }
        }
    } catch {
        mensagemBackend = "";
    }

    if (resposta.status === 401) {
        return "Sua sessão expirou ou é inválida. Entre novamente para continuar.";
    }
    if (resposta.status === 403) {
        if (mensagemBackend) return mensagemBackend;

        let usuario = null;
        try {
            usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
        } catch {
            usuario = null;
        }

        const autorizado =
            usuario?.role === "ROLE_ADMINISTRADOR" ||
            usuario?.role === "ROLE_FARMACEUTICO";

        if (autorizado) {
            return "O servidor recusou a operação. Atualize a página para renovar o CSRF ou entre novamente.";
        }
        return "Você não tem permissão para executar esta operação.";
    }
    return mensagemBackend || fallback;
}

function mostrarNotificacao(mensagem, tipo = "sucesso") {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        container.setAttribute("aria-live", "polite");
        container.setAttribute("aria-atomic", "false");
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    const icones = { sucesso: "✓", erro: "!", aviso: "!" };
    const icone = document.createElement("span");
    icone.className = "toast-icone";
    icone.textContent = icones[tipo] || "✓";
    const texto = document.createElement("span");
    texto.className = "toast-mensagem";
    texto.textContent = mensagem;
    const fechar = document.createElement("button");
    fechar.className = "toast-fechar";
    fechar.type = "button";
    fechar.textContent = "×";
    fechar.setAttribute("aria-label", "Fechar notificação");

    toast.append(icone, texto, fechar);
    container.appendChild(toast);

    const remover = () => {
        toast.classList.add("toast-saindo");
        setTimeout(() => {
            toast.remove();
            if (!container.children.length) container.remove();
        }, 250);
    };
    fechar.addEventListener("click", remover);
    setTimeout(remover, 4000);
}

async function executarAvaliacaoReceita(receita, acao, motivo) {
    const aprovando = acao === "aprovar";
    const url = `${API_RECEITA}/${receita.id}/${aprovando ? "aprovar" : "rejeitar"}` +
        (aprovando ? "" : `?motivo=${encodeURIComponent(motivo.trim())}`);
    const resposta = await AdminCsrf.fetch(url, {
        method: "PUT",
    });

    if (!resposta.ok) {
        throw new Error(await obterMensagemErro(
            resposta,
            aprovando ? "Não foi possível aprovar a receita." : "Não foi possível rejeitar a receita."
        ));
    }

    const atualizada = await resposta.json();
    const indice = receitas.findIndex((item) => Number(item.id) === Number(receita.id));
    if (indice >= 0) receitas[indice] = atualizada;
    renderizarReceitas();
    mostrarNotificacao(
        aprovando ? "Receita aprovada com sucesso." : "Receita rejeitada com sucesso.",
        "sucesso"
    );
}

corpoReceitas.addEventListener("click", async (evento) => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = Number(botao.dataset.id);
    if (!id) return;

    if (botao.dataset.acao === "visualizar") await visualizarReceita(id);
});

filtros.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-status]");
    if (!botao) return;

    filtroStatus = botao.dataset.status;
    filtros.querySelectorAll(".pill").forEach((item) => item.classList.remove("active"));
    botao.classList.add("active");
    renderizarReceitas();
});

btnAtualizar.addEventListener("click", carregarReceitas);

carregarReceitas();
