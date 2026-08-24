 function showTab(tab){
    const isLogin = tab === 'login';
    document.getElementById('loginForm').style.display = isLogin ? 'flex' : 'none';
    document.getElementById('cadastroForm').style.display = isLogin ? 'none' : 'flex';
    document.getElementById('tabLogin').classList.toggle('active', isLogin);
    document.getElementById('tabCadastro').classList.toggle('active', !isLogin);
  }
 
  document.querySelectorAll('.toggle-visibility').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
 
  document.getElementById('loginForm').addEventListener('submit', e => e.preventDefault());
  document.getElementById('cadastroForm').addEventListener('submit', e => e.preventDefault());