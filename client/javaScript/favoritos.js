/*
 * Núcleo de favoritos, compartilhado por todas as páginas.
 * Carregue ANTES do JS da página:
 *   <script src="../javaScript/favoritos.js"></script>
 *
 * Uso:
 *   await Favoritos.carregar();          // busca os favoritos do cliente logado
 *   Favoritos.eh(idProduto);             // true/false
 *   await Favoritos.alternar(idProduto); // adiciona/remove; devolve true se ficou favoritado
 */
(function () {
  const API_BASE_URL = "http://localhost:8080/api";
  const STORAGE_USUARIO = "usuarioLogado";

  let ids = new Set();
  let ordem = []; // ids dos produtos, do favorito mais recente para o mais antigo

  function idCliente() {
    try {
      const usuario = JSON.parse(localStorage.getItem(STORAGE_USUARIO));
      return usuario?.idCliente ?? usuario?.idUsuario ?? null;
    } catch (erro) {
      console.error("Erro ao ler usuarioLogado:", erro);
      return null;
    }
  }

  async function obterCsrf() {
    const res = await fetch(`${API_BASE_URL}/auth/csrf`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Não foi possível obter o token de segurança.");
    }

    const dados = await res.json();

    if (!dados?.token || !dados?.headerName) {
      throw new Error("O servidor não retornou os dados CSRF válidos.");
    }

    return dados;
  }

  async function carregar() {
    ids = new Set();
    ordem = [];

    const cliente = idCliente();

    if (!cliente) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/favorito/cliente/${cliente}`, {
        credentials: "include",
      });

      if (!res.ok) {
        console.warn("Não foi possível carregar favoritos:", res.status);
        return;
      }

      const lista = await res.json();

      if (!Array.isArray(lista)) {
        return;
      }

      // id do favorito maior = adicionado depois
      lista.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

      ordem = lista.map((f) => Number(f.idProduto));
      ids = new Set(ordem);
    } catch (erro) {
      console.error("Erro ao carregar favoritos:", erro);
    }
  }

  function eh(idProduto) {
    return ids.has(Number(idProduto));
  }

  async function alternar(idProduto) {
    const cliente = idCliente();

    if (!cliente) {
      const erro = new Error("Faça login para favoritar produtos.");
      erro.naoLogado = true;
      throw erro;
    }

    const id = Number(idProduto);
    const csrf = await obterCsrf();

    if (ids.has(id)) {
      const res = await fetch(`${API_BASE_URL}/favorito/${cliente}/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { [csrf.headerName]: csrf.token },
      });

      // 404 = já não estava nos favoritos, o resultado é o mesmo
      if (!res.ok && res.status !== 404) {
        throw new Error("Não foi possível remover dos favoritos.");
      }

      ids.delete(id);
      ordem = ordem.filter((x) => x !== id);

      return false;
    }

    const res = await fetch(`${API_BASE_URL}/favorito`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [csrf.headerName]: csrf.token,
      },
      body: JSON.stringify({
        idCliente: Number(cliente),
        idProduto: id,
      }),
    });

    // 409 = já estava favoritado, o resultado é o mesmo
    if (!res.ok && res.status !== 409) {
      throw new Error("Não foi possível adicionar aos favoritos.");
    }

    ids.add(id);
    ordem.unshift(id);

    return true;
  }

  window.Favoritos = {
    carregar,
    eh,
    alternar,
    obterCsrf,
    idCliente,
    ids: () => [...ordem],
  };
})();