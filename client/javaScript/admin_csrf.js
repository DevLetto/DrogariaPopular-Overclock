const AdminCsrf = (() => {
    let token = null;
    let headerName = null;
    let preparacao = null;

    async function obterCsrf() {
        if (token && headerName) {
            return { token, headerName };
        }

        if (!preparacao) {
            preparacao = fetch(
                "http://localhost:8080/api/auth/csrf",
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

                token = dados.token;
                headerName = dados.headerName || "X-CSRF-TOKEN";

                return { token, headerName };
            }).catch((erro) => {
                token = null;
                headerName = null;
                throw erro;
            }).finally(() => {
                preparacao = null;
            });
        }

        return preparacao;
    }

    async function adminFetch(url, opcoes = {}) {
        const metodo = String(opcoes.method || "GET").toUpperCase();
        const escreve = ["POST", "PUT", "PATCH", "DELETE"].includes(metodo);
        const headers = { ...(opcoes.headers || {}) };

        if (escreve) {
            const csrf = await obterCsrf();
            headers[csrf.headerName] = csrf.token;
        }

        const resposta = await fetch(url, {
            ...opcoes,
            credentials: "include",
            headers
        });

        if (resposta.status === 403 && escreve) {
            token = null;
            headerName = null;
        }

        return resposta;
    }

    return { fetch: adminFetch };
})();

window.AdminCsrf = AdminCsrf;
