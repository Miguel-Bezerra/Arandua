// scripts.js

// URL base da API - ajuste conforme sua configuração
const API_URL = "https://seu-backend.railway.app";

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado - configurando eventos...');
    
    // Configurar funcionalidade do olho para mostrar/esconder senha
    setupPasswordVisibility();
    
    // Configurar o evento de login
    setupLoginFunctionality();
});

// Configurar mostrar/esconder senha
function setupPasswordVisibility() {
    const passwordInput = document.getElementById('senha');
    const toggleButton = document.getElementById('togglePassword');
    const eyeIcon = toggleButton.querySelector('i');

    console.log('Configurando visibilidade da senha...');

    if (toggleButton && passwordInput && eyeIcon) {
        toggleButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Botão do olho clicado');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            }
        });
    } else {
        console.error('Elementos não encontrados:', {
            toggleButton: !!toggleButton,
            passwordInput: !!passwordInput,
            eyeIcon: !!eyeIcon
        });
    }
}

// Configurar funcionalidade de login
function setupLoginFunctionality() {
    const loginButton = document.getElementById('loginButton');

    console.log('Configurando funcionalidade de login...');

    if (loginButton) {
        loginButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Botão de login clicado');
            handleLogin();
        });
    } else {
        console.error('Botão de login não encontrado');
    }

    // Permitir login pressionando Enter
    const passwordInput = document.getElementById('senha');
    const usuarioInput = document.getElementById('usuario');

    if (passwordInput && usuarioInput) {
        [usuarioInput, passwordInput].forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    console.log('Enter pressionado');
                    handleLogin();
                }
            });
        });
    }
}

// Função principal de login
async function handleLogin() {
    console.log('Iniciando processo de login...');
    
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value;

    console.log('Dados:', { usuario, senha });

    // Validação básica
    if (!validateInputs(usuario, senha)) {
        return;
    }

    // Mostrar loading
    showLoading(true);

    try {
        // Tentar fazer login
        const loginResult = await attemptLogin(usuario, senha);
        
        if (loginResult.success) {
            // Login bem-sucedido
            await handleSuccessfulLogin(loginResult.user);
        } else {
            // Login falhou
            handleFailedLogin(loginResult.message);
        }
    } catch (error) {
        console.error('Erro durante o login:', error);
        showError('Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
        // Esconder loading
        showLoading(false);
    }
}

// Validar inputs
function validateInputs(usuario, senha) {
    if (!usuario) {
        showError('Por favor, insira seu usuário ou email.');
        document.getElementById('usuario').focus();
        return false;
    }

    if (!senha) {
        showError('Por favor, insira sua senha.');
        document.getElementById('senha').focus();
        return false;
    }

    if (usuario.length < 3) {
        showError('Usuário deve ter pelo menos 3 caracteres.');
        document.getElementById('usuario').focus();
        return false;
    }

    if (senha.length < 6) {
        showError('Senha deve ter pelo menos 6 caracteres.');
        document.getElementById('senha').focus();
        return false;
    }

    return true;
}

// Tentar fazer login via API - CORRIGIDO para suas rotas
async function attemptLogin(usuario, senha) {
    try {
        console.log('Tentando fazer login via rota /login...');
        
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ usuario, senha }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            return {
                success: true,
                user: data.user
            };
        } else {
            return {
                success: false,
                message: data.message || 'Erro no login'
            };
        }

    } catch (error) {
        console.error('Erro na requisição de login:', error);
        throw new Error('Não foi possível conectar com o servidor');
    }
}

// Método alternativo de login
async function attemptLoginAlternative(usuario, senha) {
    try {
        console.log('Tentando método alternativo de login...');
        
        const usuariosResponse = await fetch(`${API_BASE_URL}/usuarios`);
        const usuarios = await usuariosResponse.json();
        
        // Tentar por nome
        const usuarioPorNome = usuarios.find(user => 
            user.nome === usuario && user.senha === senha
        );
        if (usuarioPorNome) {
            return {
                success: true,
                user: {
                    id: usuarioPorNome.id_usuario,
                    nome: usuarioPorNome.nome,
                    email: usuarioPorNome.email,
                    num_postagens: usuarioPorNome.num_postagens || 0
                }
            };
        }

        // Tentar por email
        const usuarioPorEmail = usuarios.find(user => 
            user.email === usuario && user.senha === senha
        );
        if (usuarioPorEmail) {
            return {
                success: true,
                user: {
                    id: usuarioPorEmail.id_usuario,
                    nome: usuarioPorEmail.nome,
                    email: usuarioPorEmail.email,
                    num_postagens: usuarioPorEmail.num_postagens || 0
                }
            };
        }

        return {
            success: false,
            message: 'Usuário ou senha incorretos'
        };
    } catch (error) {
        console.error('Erro no método alternativo de login:', error);
        throw new Error('Não foi possível conectar com o servidor');
    }
}

// Manipular login bem-sucedido
async function handleSuccessfulLogin(user) {
    console.log('Login bem-sucedido:', user);
    
    // Salvar informações do usuário no sessionStorage
    const userInfo = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        num_postagens: user.num_postagens,
        loginTime: new Date().toISOString(),
        isLoggedIn: true
    };
    
    sessionStorage.setItem('arandua_current_user', JSON.stringify(userInfo));
    
    // Mostrar mensagem de sucesso
    showSuccess(`Bem-vindo, ${user.nome}!`);
    
    // Redirecionar após breve delay
    setTimeout(() => {
        window.location.href = '../Tela_inicial/inicio.html';
    }, 1500);
}

// Manipular login falho
function handleFailedLogin(message = 'Usuário ou senha incorretos. Tente novamente.') {
    console.log('Login falhou:', message);
    showError(message);
    
    // Limpar campo de senha
    document.getElementById('senha').value = '';
    document.getElementById('senha').focus();
    
    // Adicionar animação de shake nos inputs
    shakeInputs();
}

// Mostrar/Esconder loading
function showLoading(show) {
    const loginButton = document.getElementById('loginButton');
    
    if (loginButton) {
        if (show) {
            loginButton.innerHTML = '<div class="loading-spinner"></div> Entrando...';
            loginButton.disabled = true;
        } else {
            loginButton.innerHTML = 'ENTRAR';
            loginButton.disabled = false;
        }
    }
}

// Mostrar mensagem de erro
function showError(message) {
    // Remover mensagens anteriores
    removeExistingMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message error-message';
    errorDiv.textContent = message;
    
    // Inserir antes do botão de login
    const loginButton = document.getElementById('loginButton');
    if (loginButton && loginButton.parentNode) {
        loginButton.parentNode.insertBefore(errorDiv, loginButton);
    }
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
    removeExistingMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'message success-message';
    successDiv.textContent = message;
    
    const loginButton = document.getElementById('loginButton');
    if (loginButton && loginButton.parentNode) {
        loginButton.parentNode.insertBefore(successDiv, loginButton);
    }
}

// Remover mensagens existentes
function removeExistingMessages() {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    });
}

// Animação de shake nos inputs
function shakeInputs() {
    const inputs = [
        document.getElementById('usuario'),
        document.getElementById('senha')
    ];
    
    inputs.forEach(input => {
        if (input) {
            input.classList.add('shake');
            setTimeout(() => {
                input.classList.remove('shake');
            }, 500);
        }
    });
}

// Adicionar estilos dinâmicos
const dynamicStyles = `
    .password-container {
        position: relative;
        display: flex;
        align-items: center;
    }
    
    .password-container input {
        flex: 1;
        padding-right: 40px;
    }
    
    .password-toggle {
        position: absolute;
        right: 10px;
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
        padding: 5px;
    }
    
    .password-toggle:hover {
        color: #333;
    }
    
    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .message {
        padding: 12px;
        margin: 10px 0;
        border-radius: 4px;
        text-align: center;
        font-weight: bold;
    }
    
    .error-message {
        background-color: #ffebee;
        color: #c62828;
        border: 1px solid #ffcdd2;
    }
    
    .success-message {
        background-color: #e8f5e8;
        color: #2e7d32;
        border: 1px solid #c8e6c9;
    }
    
    .shake {
        animation: shake 0.5s linear;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .form-group {
        margin-bottom: 15px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }
    
    .form-group input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
    }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);

// ===== FUNÇÕES AUXILIARES PARA OUTRAS PÁGINAS =====

// Verificar se usuário está logado
function checkUserLoggedIn() {
    const userInfo = sessionStorage.getItem('arandua_current_user');
    if (!userInfo) {
        return false;
    }
    
    try {
        const user = JSON.parse(userInfo);
        return user.isLoggedIn === true;
    } catch {
        return false;
    }
}

// Fazer logout
function logoutUser() {
    sessionStorage.removeItem('arandua_current_user');
    window.location.href = '../Tela_Login/tela_login.html';
}

// Obter usuário atual
function getCurrentUser() {
    const userInfo = sessionStorage.getItem('arandua_current_user');
    if (userInfo) {
        try {
            return JSON.parse(userInfo);
        } catch {
            return null;
        }
    }
    return null;
}

// Verificar autenticação e redirecionar se não estiver logado
function requireAuth() {
    if (!checkUserLoggedIn()) {
        window.location.href = '../Tela_Login/tela_login.html';
        return false;
    }
    return true;
}

// Fazer requisições autenticadas
async function makeAuthenticatedRequest(url, options = {}) {
    const user = getCurrentUser();
    if (!user) {
        throw new Error('Usuário não autenticado');
    }

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'User-Id': user.id
        },
        ...options
    };

    const response = await fetch(url, defaultOptions);
    return response;
}