// scripts.js - VERSÃO CORRIGIDA PARA HISTÓRIAS
console.log('🔧 scripts.js está carregando...');

const API_URL = "https://seu-backend.railway.app";
let currentUser = null;
let allPosts = [];
let isInSearchMode = false;
let isCreatingPost = false;
let selectedCategories = [];
let allCategories = [];

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Carregado - Iniciando aplicação...');
    
    currentUser = getLoggedInUser();
    
    if (currentUser) {
        console.log('✅ Usuário logado:', currentUser);
        initializeApp();
    } else {
        console.log('❌ Usuário não logado - redirecionando...');
        window.location.href = '../Tela_Login/tela_login.html';
    }
});

function getLoggedInUser() {
    try {
        const userData = sessionStorage.getItem('arandua_current_user');
        if (userData) {
            const parsed = JSON.parse(userData);
            return parsed.user || parsed;
        }
    } catch (error) {
        console.error('❌ Erro ao obter usuário:', error);
    }
    return null;
}

async function initializeApp() {
    console.log('🚀 Inicializando aplicação...');
    
    // Verificar e criar elementos de pesquisa se necessário
    if (!document.getElementById('searchInput')) {
        console.log('🛠️ Criando elementos de pesquisa...');
        createSearchElements();
    }
    
    setupUserInterface();
    setupDropdown();
    setupSearch();

    // NEW: prevenir default de cliques problemáticos em capture phase (antes dos handlers)
    setupClickCapturePrevention();

    setupGlobalEventListeners();
    setupModal();
    setupCategoryFilter();
    updateActiveCategoriesDisplay();
    preventLinkReload()

    //setupWebSocket();   
    
    await loadPosts();
    
    console.log('✅ Aplicação inicializada com sucesso');
}

// ===== INTERFACE DO USUÁRIO =====
function setupUserInterface() {
    const userButton = document.getElementById('userButton');
    const userName = document.getElementById('userName');
    
    if (userButton && currentUser) {
        const userNameElement = userButton.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = currentUser.nome || 'Usuário';
        }
        
        if (userName) {
            userName.textContent = currentUser.nome || 'Usuário';
        }
        
        console.log('✅ Interface do usuário configurada:', currentUser.nome);
    }
}

// ===== WEBSOCKET PARA ATUALIZAÇÕES EM TEMPO REAL =====


function updateLikeCount(postId, likeCount) {
    const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
    if (likeBtn) {
        const likeCountElement = likeBtn.querySelector('.like-count');
        if (likeCountElement) {
            likeCountElement.textContent = likeCount;
        }
    }
}

function updateCommentCount(postId, increment = true) {
    const commentBtn = document.querySelector(`.comment-btn[data-post-id="${postId}"]`);
    if (commentBtn) {
        const commentText = commentBtn.querySelector('.comment-text');
        if (commentText) {
            // Implementar contador de comentários se necessário
        }
    }
}

// ===== DROPDOWN =====
function setupDropdown() {
    const userButton = document.getElementById('userButton');
    const dropdownMenu = document.getElementById('userDropdown');
    const userArea = document.querySelector('.user-area');

    if (userButton && dropdownMenu && userArea) {
        console.log('🔧 Configurando dropdown do usuário...');
        
        userButton.addEventListener('click', function(e) {
            e.preventDefault(); // ✅ ADICIONAR
            e.stopPropagation();
            console.log('🎯 Dropdown clicado, estado atual:', dropdownMenu.classList.contains('hidden'));
            
            const isHidden = dropdownMenu.classList.contains('hidden');
            
            if (isHidden) {
                dropdownMenu.classList.remove('hidden');
                userArea.classList.add('active');
                console.log('✅ Dropdown aberto');
            } else {
                dropdownMenu.classList.add('hidden');
                userArea.classList.remove('active');
                console.log('❌ Dropdown fechado');
            }
        });

        document.addEventListener('click', function(e) {
            if (!userArea.contains(e.target)) {
                dropdownMenu.classList.add('hidden');
                userArea.classList.remove('active');
            }
        });

        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });

    } else {
        console.error('❌ Elementos do dropdown não encontrados');
    }
}

function toggleDropdown() {
    const dropdown = document.getElementById('userDropdown');
    const userArea = document.querySelector('.user-area');
    
    if (dropdown && userArea) {
        const isHidden = dropdown.classList.contains('hidden');
        
        if (isHidden) {
            dropdown.classList.remove('hidden');
            userArea.classList.add('active');
        } else {
            dropdown.classList.add('hidden');
            userArea.classList.remove('active');
        }
    }
}

function handleLogout() {
    console.log('🚪 Fazendo logout...');
    sessionStorage.removeItem('arandua_current_user');
    window.location.href = '../Tela_Login/tela_login.html';
}

// ===== MODAL DE CRIAÇÃO DE HISTÓRIA =====
function setupModal() {
    const fabButton = document.getElementById('fabButton');
    const modal = document.getElementById('postCreationModal');
    const cancelButton = document.getElementById('cancelPostBtn');
    const postForm = document.getElementById('postForm');
    const contentInput = document.getElementById('postContent');

    if (fabButton) {
        fabButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal) modal.classList.remove('hidden');
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                e.preventDefault();
                closeModal();
            }
        });
    }

    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createStory();
        });
    }

    if (contentInput) {
        contentInput.addEventListener('input', updateCharacterCount);
    }

    setupImagePreview();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

function openModal() {
    console.log('📖 Abrindo modal de criação de história...');
    const modal = document.getElementById('postCreationModal');
    if (modal) {
        modal.classList.remove('hidden');
        const titleInput = document.getElementById('postTitle');
        if (titleInput) titleInput.focus();
    }
}

function closeModal() {
    console.log('📖 Fechando modal...');
    const modal = document.getElementById('postCreationModal');
    const form = document.getElementById('postForm');
    
    if (modal) modal.classList.add('hidden');
    if (form) {
        form.reset();
        updateCharacterCount();
    }
    
    removeImage();
}

function updateCharacterCount() {
    const contentInput = document.getElementById('postContent');
    const charCount = document.getElementById('charCount');
    
    if (contentInput && charCount) {
        const count = contentInput.value.length;
        charCount.textContent = count;
        
        if (count > 5000) {
            charCount.style.color = '#f44336';
        } else if (count > 3000) {
            charCount.style.color = '#ff9800';
        } else {
            charCount.style.color = '#666';
        }
    }
}

// ===== REVERTIDO: createStory para versão anterior (sem compressImage) =====
async function createStory() {
    if (isCreatingPost) return;
    isCreatingPost = true;

    const titleInput = document.getElementById('postTitle');
    const categoryInput = document.getElementById('postCategory');
    const contentInput = document.getElementById('postContent');
    const tagsInput = document.getElementById('postTags');
    const imageInput = document.getElementById('postImage');

    const title = titleInput ? titleInput.value.trim() : '';
    const category = categoryInput ? categoryInput.value : '';
    const content = contentInput ? contentInput.value.trim() : '';
    const tags = tagsInput ? tagsInput.value.trim() : '';

    if (!title) { showNotification('📝 Digite um título para a história', 'error'); titleInput && titleInput.focus(); isCreatingPost = false; return; }
    if (title.length < 5) { showNotification('📝 O título precisa ter pelo menos 5 caracteres', 'error'); titleInput && titleInput.focus(); isCreatingPost = false; return; }
    if (!category) { showNotification('📝 Selecione uma categoria', 'error'); categoryInput && categoryInput.focus(); isCreatingPost = false; return; }
    if (!content) { showNotification('📝 Escreva o conteúdo da história', 'error'); contentInput && contentInput.focus(); isCreatingPost = false; return; }
    if (content.length < 10) { showNotification('📝 A história precisa ter pelo menos 10 caracteres', 'error'); contentInput && contentInput.focus(); isCreatingPost = false; return; }

    let imageBase64 = null;

    if (imageInput && imageInput.files[0]) {
        try {
            // fallback simples: converter arquivo em base64 (sem compressão)
            imageBase64 = await fileToBase64(imageInput.files[0]);
        } catch (err) {
            console.error('❌ Erro ao processar imagem:', err);
            showNotification('❌ Erro ao processar imagem', 'error');
            isCreatingPost = false;
            return;
        }
    }

    try {
        const storyData = {
            id_usuario: currentUser.id,
            titulo: title,
            conteudo: content,
            categoria: category,
            imagem_capa: imageBase64,
            tags: tags
        };

        const response = await fetch(`${API_BASE_URL}/historias`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(storyData),
        });

        if (response.ok) {
            const newStory = await response.json();
            showNotification('✅ História publicada com sucesso!', 'success');
            // adicionar retorno direto ao feed (comportamento anterior)
            addNewStoryToFeed(newStory);
            closeModal();
        } else {
            const errorData = await safeParseResponse(response);
            const msg = errorData && (errorData.message || errorData.error || JSON.stringify(errorData));
            console.error('❌ Erro do servidor:', response.status, msg);
            showNotification('❌ Erro ao publicar história: ' + (msg || response.status), 'error');
        }
    } catch (error) {
        console.error('❌ Erro ao criar história:', error);
        showNotification('❌ Erro ao publicar história: ' + (error.message || error), 'error');
    } finally {
        isCreatingPost = false;
    }
}

// ===== REMOVIDO: setupSearch() que eu adicionei (desfazer minha alteração) =====

// ===== CARREGAMENTO DE POSTAGENS/HISTÓRIAS =====
async function loadPosts() {
    try {
        console.log('📚 Carregando histórias...');
        const response = await fetch(`${API_BASE_URL}/historias`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro detalhado:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const historias = await response.json();
        console.log(`✅ ${historias.length} histórias carregadas`, historias);
        
        allPosts = historias;
        renderPosts(historias);
        
    } catch (error) {
        console.error('❌ Erro ao carregar histórias:', error);
        showNotification('Erro ao carregar histórias: ' + error.message, 'error');
        showEmptyMessage();
    }
}

// ===== RENDERIZAÇÃO =====
function renderPosts(postagens) {
    const contentArea = document.querySelector('.content');
    if (!contentArea) {
        console.error('❌ Área de conteúdo não encontrada');
        return;
    }

    clearPostContent();

    if (!postagens || postagens.length === 0) {
        showEmptyMessage();
        return;
    }

    const hasStories = postagens.some(post => post.titulo);
    
    if (hasStories) {
        renderStories(postagens);
    } else {
        renderSimplePosts(postagens);
    }
}

function renderStories(historias) {
    const contentArea = document.querySelector('.content');
    if (!contentArea) return;

    // DEBUG: Verificar as histórias antes de renderizar
    debugStories(historias);

    historias.forEach(historia => {
        const storyElement = createStoryElement(historia);
        contentArea.appendChild(storyElement);
    });
}

function renderSimplePosts(postagens) {
    const contentArea = document.querySelector('.content');
    if (!contentArea) return;

    postagens.forEach(post => {
        const postElement = createPostElement(post);
        contentArea.appendChild(postElement);
    });
}

function createStoryElement(historia) {
    console.log('🛠️ Criando elemento para história:', historia.id_historia || historia.id);
    console.log('   📋 Tags recebidas:', historia.tags);
    
    const storyElement = document.createElement('div');
    storyElement.className = 'post chat-item message-bubble story-item';
    storyElement.dataset.postId = historia.id_historia || historia.id;

    const isAuthor = currentUser && currentUser.id == historia.id_usuario;
    const category = historia.categoria || 'outros';
    
    // ===== PROCESSAMENTO DAS TAGS - VERSÃO MAIS ROBUSTA =====
    let tags = [];
    
    if (historia.tags) {
        console.log('   🔍 Processando tags...');
        
        if (typeof historia.tags === 'string') {
            // Se for string, tentar diferentes métodos de parsing
            const rawTags = historia.tags.trim();
            
            if (rawTags.startsWith('[') && rawTags.endsWith(']')) {
                // Tentar parsear como JSON array
                try {
                    tags = JSON.parse(rawTags)
                        .map(t => String(t).trim())
                        .filter(t => t && t !== 'null' && t !== 'undefined' && t !== '');
                    console.log('   ✅ Tags parseadas como JSON:', tags);
                } catch (e) {
                    console.log('   ❌ Falha ao parsear JSON, usando split por vírgula');
                    tags = rawTags.replace(/[\[\]"]/g, '') // Remove colchetes e aspas
                                 .split(',')
                                 .map(t => t.trim())
                                 .filter(t => t && t !== 'null' && t !== 'undefined');
                }
            } else {
                // Split simples por vírgula
                tags = rawTags.split(',')
                             .map(t => t.trim())
                             .filter(t => t && t !== 'null' && t !== 'undefined');
                console.log('   ✅ Tags parseadas com split:', tags);
            }
        } else if (Array.isArray(historia.tags)) {
            // Se já for array
            tags = historia.tags.map(t => String(t).trim())
                               .filter(t => t && t !== 'null' && t !== 'undefined');
            console.log('   ✅ Tags como array processado:', tags);
        } else {
            console.log('   ❌ Tipo de tags não reconhecido:', typeof historia.tags);
        }
    } else {
        console.log('   📭 Nenhuma tag encontrada na história');
    }
    
    console.log('   🎯 Tags finais:', tags);

    const imagemData = historia.imagem_capa || historia.imagem;
    let imageUrl = null;

    if (imagemData) {
        imageUrl = getImageUrl(imagemData);
    }

    let imageHTML = '';
    if (imageUrl) {
        imageHTML = `
            <div class="story-image">
                <img src="${imageUrl}" alt="Capa da história: ${historia.titulo}" />
            </div>
        `;
    }

    // ===== GERAR HTML DAS TAGS =====
    let tagsHTML = '';
    if (tags && tags.length > 0) {
        const tagsContent = tags.map(tag => {
            // Limpar a tag - remover # duplicados e espaços
            const cleanTag = tag.replace(/^#+/, '').trim();
            if (!cleanTag) return '';
            
            return `<span class="story-tag" data-tag="${cleanTag}">#${cleanTag}</span>`;
        }).filter(tag => tag !== '').join('');
        
        if (tagsContent) {
            tagsHTML = `
                <div class="story-tags">
                    ${tagsContent}
                </div>
            `;
            console.log('   ✅ HTML das tags gerado');
        } else {
            console.log('   📭 Nenhuma tag válida após limpeza');
        }
    } else {
        console.log('   📭 Nenhuma tag para exibir');
    }

    // ===== HTML COMPLETO DA HISTÓRIA =====
    storyElement.innerHTML = `
        <div class="story-header">
            <div class="bubble-header">
                <div class="user-info-group">
                    <div class="avatar" data-user-id="${historia.id_usuario}">
                        <!-- Avatar será preenchido pelo JavaScript -->
                    </div>
                    <span class="username">${historia.autor || 'Usuário'}</span>
                </div>
                ${isAuthor ? '<button type="button" class="btn-deletar">🗑️ Deletar</button>' : ''}
            </div>
            
            <div class="story-meta">
                <span class="story-category ${category}">${getCategoryDisplayName(category)}</span>
                ${historia.tempo_leitura ? `<span class="reading-time">⏱️ ${historia.tempo_leitura} min</span>` : ''}
            </div>
        </div>
        
        <h3 class="story-title">${historia.titulo || 'História sem título'}</h3>

        ${imageHTML}
        
        <div class="story-content">
            <p>${historia.conteudo || ''}</p>
        </div>
        
        ${tagsHTML}
        
        <div class="post-actions">
            <button type="button" class="action-btn like-btn" data-post-id="${historia.id_historia || historia.id}">
                <span class="like-icon">🤍</span>
                <span class="like-count">${historia.num_curtidas || 0}</span>
            </button>
            
            <button type="button" class="action-btn comment-btn" data-post-id="${historia.id_historia || historia.id}">
                <span class="comment-icon">💬</span>
                <span class="comment-text">Comentar</span>
            </button>
        </div>
        
        <div class="comments-section" id="comments-${historia.id_historia || historia.id}" style="display: none;">
            <div class="comments-list"></div>
            <div class="add-comment">
                <textarea class="comment-input" placeholder="Escreva um comentário..." rows="2"></textarea>
                <button type="button" class="submit-comment" data-post-id="${historia.id_historia || historia.id}">
                    Comentar
                </button>
            </div>
        </div>
    `;

    // DEBUG: Verificar se o HTML foi inserido
    console.log('   📄 HTML gerado contém tags?', storyElement.innerHTML.includes('story-tags'));
    console.log('   📄 Conteúdo das tags no HTML:', storyElement.querySelector('.story-tags')?.innerHTML || 'NÃO ENCONTRADO');

    const avatarElement = storyElement.querySelector('.avatar');
    renderSimpleAvatar(avatarElement, { 
        id: historia.id_usuario, 
        nome: historia.autor,
        foto_perfil: historia.foto_perfil_autor 
    });

    return storyElement;
}

// Função de debug para verificar as histórias
function debugStories(historias) {
    console.log('🔍 DEBUG: Analisando estruturas das histórias:');
    historias.forEach((historia, index) => {
        console.log(`📖 História ${index + 1}:`, {
            id: historia.id_historia || historia.id,
            titulo: historia.titulo,
            tags: historia.tags,
            tipoTags: typeof historia.tags,
            temTags: !!historia.tags,
            tagsLength: historia.tags ? historia.tags.length : 0
        });
        
        // Verificar se há tags e como estão formatadas
        if (historia.tags) {
            console.log('   📋 Conteúdo das tags:', historia.tags);
            
            if (typeof historia.tags === 'string') {
                const parsedTags = historia.tags.split(',').map(t => t.trim()).filter(t => t);
                console.log('   🎯 Tags parseadas:', parsedTags);
            } else if (Array.isArray(historia.tags)) {
                console.log('   🎯 Tags como array:', historia.tags);
            }
        }
    });
}

function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post chat-item message-bubble';
    postElement.dataset.postId = post.id_historia;

    const isAuthor = currentUser && currentUser.id == post.id_usuario;

    postElement.innerHTML = `
        <div class="bubble-header">
            <div class="user-info-group">
                <div class="avatar" data-user-id="${post.id_usuario}">
                    <!-- Avatar será preenchido pelo JavaScript -->
                </div>
                <span class="username">${post.autor || 'Usuário'}</span>
            </div>
            ${isAuthor ? '<button type="button" class="btn-deletar">🗑️ Deletar</button>' : ''}
        </div>
        
        <p class="message-text">${post.conteudo || ''}</p>
        
        ${post.imagem_capa ? `
            <div class="post-image">
                <img src="data:image/jpeg;base64,${post.imagem_capa}" alt="Imagem da história" />
            </div>
        ` : ''}
        
        <div class="post-actions">
            <button type="button" class="action-btn like-btn" data-post-id="${post.id_historia}">
                <span class="like-icon">🤍</span>
                <span class="like-count">${post.num_curtidas || 0}</span>
            </button>
            
            <button type="button" class="action-btn comment-btn" data-post-id="${post.id_historia}">
                <span class="comment-icon">💬</span>
                <span class="comment-text">Comentar</span>
            </button>
        </div>
        
        <div class="comments-section" id="comments-${post.id_historia}" style="display: none;">
            <div class="comments-list"></div>
            <div class="add-comment">
                <textarea class="comment-input" placeholder="Escreva um comentário..." rows="2"></textarea>
                <button type="button" class="submit-comment" data-post-id="${post.id_historia}">
                    Comentar
                </button>
            </div>
        </div>
    `;

    const avatarElement = postElement.querySelector('.avatar');
    renderSimpleAvatar(avatarElement, { 
        id: post.id_usuario, 
        nome: post.autor,
        foto_perfil: post.foto_perfil_autor 
    });

    return postElement;
}

// ===== CORREÇÃO DOS AVATARES =====
function renderSimpleAvatar(element, user, size = 'normal') {
    if (!element) return;
    
    const imageUrl = getProfileImage(user);
    
    if (imageUrl) {
        element.innerHTML = `<img src="${imageUrl}" alt="${user.nome || user.autor || 'Usuário'}" 
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
    } else {
        const iconSize = size === 'small' ? '16' : '20';
        element.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="white" style="width: 100%; height: 100%;">
                <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
            </svg>
        `;
    }
}

function getProfileImage(user) {
    if (!user) return null;
    
    const foto = user.foto_perfil || user.foto_perfil_autor || user.ft_perfil;
    
    if (!foto) return null;
    
    if (foto.startsWith('http') || foto.startsWith('data:')) {
        return foto;
    }
    
    if (foto.length > 100) {
        return `data:image/jpeg;base64,${foto}`;
    }
    
    return null;
}

function getImageUrl(imageData) {
    if (!imageData) {
        return null;
    }

    if (imageData.startsWith('http')) {
        return imageData;
    }

    if (imageData.startsWith('data:')) {
        return imageData;
    }

    if (imageData.length > 100) {
        return `data:image/jpeg;base64,${imageData}`;
    }

    return null;
}

// ===== CORREÇÃO DO FILTRO POR CATEGORIA =====
function setupCategoryFilter() {
    const filterToggle = document.getElementById('categoryFilterToggle');
    const filterOptions = document.getElementById('categoryFilterOptions');
    const applyFilterBtn = document.getElementById('applyFilterBtn');

    if (filterToggle && filterOptions) {
        loadCategories();
        
        filterToggle.addEventListener('click', function(e) {
            e.preventDefault(); // ✅ ADICIONAR
            e.stopPropagation();
            filterOptions.classList.toggle('hidden');
        });

        // Event listener para aplicar filtro
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', function(e) {
                e.preventDefault(); // ✅ ADICIONAR
                e.stopPropagation();
                applyCategoryFilters();
            });
        }

        // Event listener para checkboxes
        setTimeout(() => {
            const categoryCheckboxes = document.getElementById('categoryCheckboxes');
            if (categoryCheckboxes) {
                categoryCheckboxes.addEventListener('change', function(e) {
                    if (e.target.type === 'checkbox') {
                        const category = e.target.value;
                        const isChecked = e.target.checked;
                        
                        if (isChecked) {
                            if (!selectedCategories.includes(category)) {
                                selectedCategories.push(category);
                            }
                        } else {
                            selectedCategories = selectedCategories.filter(cat => cat !== category);
                        }
                        
                        updateActiveCategoriesDisplay();
                    }
                });
            }
        }, 100);

    } else {
        console.error('❌ Elementos do filtro de categoria não encontrados');
    }
}

function loadCategories() {
    console.log('📂 Carregando categorias...');
    
    allCategories = [
        { id: 1, nome: 'criaturas', icone: '📖', cor: '#4CAF50' },
        { id: 2, nome: 'festas', icone: '🎉', cor: '#9C27B0' },
        { id: 3, nome: 'conhecimentos', icone: '🧠', cor: '#2196F3' },
        { id: 4, nome: 'costumes', icone: '👥', cor: '#FF9800' },
        { id: 5, nome: 'historia', icone: '🏛️', cor: '#795548' },
        { id: 6, nome: 'arte', icone: '🎨', cor: '#E91E63' },
        { id: 7, nome: 'culinaria', icone: '🍲', cor: '#FF5722' },
        { id: 8, nome: 'outros', icone: '📌', cor: '#607D8B' }
    ];
    
    renderCategoryCheckboxes();
    console.log(`✅ ${allCategories.length} categorias carregadas`);
}

function renderCategoryCheckboxes() {
    const container = document.getElementById('categoryCheckboxes');
    
    if (!container) {
        console.error('❌ Container de categorias não encontrado');
        return;
    }
    
    if (!allCategories || allCategories.length === 0) {
        container.innerHTML = '<div class="no-categories">Nenhuma categoria disponível</div>';
        return;
    }
    
    const checkboxesHTML = allCategories.map(categoria => {
        const nome = categoria.nome || 'unknown';
        const icone = categoria.icone || '📁';
        const displayName = getCategoryDisplayName(nome);
        
        return `
            <label class="category-checkbox">
                <input type="checkbox" value="${nome}" ${selectedCategories.includes(nome) ? 'checked' : ''}>
                <span class="category-icon">${icone}</span>
                <span class="category-name">${displayName}</span>
            </label>
        `;
    }).join('');
    
    container.innerHTML = checkboxesHTML;
    
    // Adicionar event listeners para as checkboxes
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const category = this.value;
            if (this.checked) {
                if (!selectedCategories.includes(category)) {
                    selectedCategories.push(category);
                }
            } else {
                selectedCategories = selectedCategories.filter(cat => cat !== category);
            }
        });
    });
}

function applyCategoryFilters() {
    const filterOptions = document.getElementById('categoryFilterOptions');
    if (filterOptions) {
        filterOptions.classList.add('hidden');
    }
    
    console.log('🔍 Aplicando filtros para categorias:', selectedCategories);
    
    // Atualizar display antes de aplicar filtros
    updateActiveCategoriesDisplay();
    
    if (selectedCategories.length === 0) {
        renderPosts(allPosts);
        showNotification('📚 Mostrando todas as categorias', 'success');
    } else {
        filterPostsLocally();
    }
}

function filterPostsLocally() {
    if (!allPosts || allPosts.length === 0) {
        showNotification('Nenhuma história para filtrar', 'info');
        return;
    }
    
    const filtered = allPosts.filter(post => 
        selectedCategories.includes(post.categoria)
    );
    
    console.log(`📊 Filtro local: ${filtered.length} de ${allPosts.length} histórias`);
    
    if (filtered.length === 0) {
        showNotification('Nenhuma história encontrada nas categorias selecionadas', 'info');
    } else {
        showNotification(`📚 ${filtered.length} história(s) encontrada(s) em ${selectedCategories.length} categoria(s)`, 'success');
    }
    
    renderPosts(filtered);
}

function removeCategory(category) {
    selectedCategories = selectedCategories.filter(cat => cat !== category);
    
    const checkbox = document.querySelector(`input[value="${category}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }
    
    applyCategoryFilters();
}

function getCategoryDisplayName(category) {
    const categoria = allCategories.find(c => c.nome === category);
    
    if (categoria && categoria.nome) {
        return categoria.nome.charAt(0).toUpperCase() + categoria.nome.slice(1);
    }
    
    const fallbackMap = {
        'criaturas': 'Criaturas',
        'festas': 'Festas', 
        'conhecimentos': 'Conhecimentos',
        'costumes': 'Costumes',
        'historia': 'História',
        'arte': 'Arte',
        'culinaria': 'Culinária',
        'outros': 'Outros'
    };
    
    return fallbackMap[category] || category;
}

// ===== FUNÇÕES PARA CATEGORIAS ATIVAS =====

function updateActiveCategoriesDisplay() {
    const activeCategoriesContainer = document.getElementById('activeCategories');
    const filterToggle = document.getElementById('categoryFilterToggle');
    
    if (!activeCategoriesContainer || !filterToggle) {
        console.log('❌ Elementos do display de categorias ativas não encontrados');
        return;
    }
    
    // Limpar container
    activeCategoriesContainer.innerHTML = '';
    
    if (selectedCategories.length === 0) {
        // Mostrar texto padrão quando não há categorias selecionadas
        activeCategoriesContainer.innerHTML = `
            <span class="filter-placeholder">Todas as categorias</span>
        `;
        
        // Atualizar texto do botão de filtro
        const filterText = filterToggle.querySelector('.filter-text');
        if (filterText) {
            filterText.textContent = 'Filtrar por Categoria';
        }
        
        return;
    }
    
    // Adicionar badge para cada categoria selecionada
    selectedCategories.forEach(category => {
        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'active-category-badge';
        categoryBadge.innerHTML = `
            ${getCategoryDisplayName(category)}
            <button type="button" class="remove-category-btn" onclick="removeCategory('${category}')">
                ✕
            </button>
        `;
        activeCategoriesContainer.appendChild(categoryBadge);
    });
    
    // Atualizar texto do botão de filtro
    const filterText = filterToggle.querySelector('.filter-text');
    if (filterText) {
        filterText.textContent = `Filtrando (${selectedCategories.length})`;
    }
    
    console.log('✅ Display de categorias atualizado:', selectedCategories);
}

// ===== FUNÇÃO PARA CRIAR ELEMENTOS DE PESQUISA =====

function createSearchElements() {
    const header = document.querySelector('header, .header, .top-bar');
    
    if (!header) {
        console.error('❌ Cabeçalho não encontrado para adicionar pesquisa');
        return;
    }
    
    const searchHTML = `
        <div class="search-container" style="margin: 10px 0;">
            <div class="search-box" style="display: flex; align-items: center; background: white; border-radius: 20px; padding: 5px 15px; border: 1px solid #ddd; max-width: 400px; margin: 0 auto;">
                <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="Buscar histórias, autores, categorias..."
                    style="flex: 1; border: none; outline: none; padding: 8px 0; font-size: 14px;"
                >
                <button type="button" id="searchClearBtn" class="hidden" style="background: none; border: none; cursor: pointer; padding: 5px; margin-right: 5px; color: #666;">
                    ✕
                </button>
                <button type="button" id="searchActionBtn" style="background: none; border: none; cursor: pointer; padding: 5px; color: var(--primary-brown);">
                    🔍
                </button>
            </div>
        </div>
    `;
    
    header.insertAdjacentHTML('beforeend', searchHTML);
    console.log('✅ Elementos de pesquisa criados dinamicamente');
}

// Removido bloco solto que causava ReferenceError (foi retirado)

// ===== NOVA FUNÇÃO: setupSearch =====
function setupSearch() {
	// aguarda elementos que podem ser inseridos dinamicamente
	setTimeout(() => {
		const searchInput = document.getElementById('searchInput');
		const searchClearBtn = document.getElementById('searchClearBtn');
		const searchActionBtn = document.getElementById('searchActionBtn');

		console.log('🔍 setupSearch elementos:', {
			searchInput: !!searchInput,
			searchClearBtn: !!searchClearBtn,
			searchActionBtn: !!searchActionBtn
		});

		if (!searchInput) {
			// fallback: tentar configurar via seletor alternativo depois
			console.warn('⚠️ Input de pesquisa não encontrado no DOM. SetupSearch abortado.');
			setupSearchFallback();
			return;
		}

		let searchTimeout = null;

		function updateClearVisibility() {
			if (!searchClearBtn) return;
			if (searchInput.value.trim().length > 0) searchClearBtn.classList.remove('hidden');
			else searchClearBtn.classList.add('hidden');
		}

		searchInput.addEventListener('input', function (e) {
			const term = e.target.value.trim();
			updateClearVisibility();

			clearTimeout(searchTimeout);
			if (term.length === 0) {
				restoreFullFeed();
				return;
			}
			if (term.length < 2) return;

			searchTimeout = setTimeout(() => performSearch(term), 450);
		});

		if (searchClearBtn) {
			searchClearBtn.addEventListener('click', function (e) {
				e.preventDefault(); e.stopPropagation();
				searchInput.value = '';
				updateClearVisibility();
				searchInput.focus();
				restoreFullFeed();
			});
		}

		if (searchActionBtn) {
			searchActionBtn.addEventListener('click', async function (e) {
				e.preventDefault(); e.stopPropagation();
				const term = searchInput.value.trim();
				if (term) await performSearch(term);
			});
		}

		searchInput.addEventListener('keypress', async function (e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				const term = searchInput.value.trim();
				if (term) await performSearch(term);
			}
		});
	}, 100);
}

// Fallback caso os elementos não sejam encontrados pelos IDs
function setupSearchFallback() {
    console.log('🔄 Tentando configuração alternativa de pesquisa...');
    
    // Tentar encontrar elementos por classe ou outros atributos
    const searchInput = document.querySelector('input[type="text"]');
    const searchClearBtn = document.querySelector('.search-clear-btn, .clear-btn');
    const searchActionBtn = document.querySelector('.search-action-btn, .search-btn');
    
    if (searchInput) {
        console.log('✅ Input de pesquisa encontrado via seletor alternativo');
        
        let searchTimeout;
        
        searchInput.addEventListener('input', function(e) {
            const term = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (term.length < 2) {
                if (term.length === 0) {
                    restoreFullFeed();
                }
                return;
            }
            
            searchTimeout = setTimeout(() => {
                performSearch(term);
            }, 500);
        });
        
        searchInput.addEventListener('keypress', async function(e) {
            if (e.key === 'Enter') {
                const term = searchInput.value.trim();
                if (term) {
                    await performSearch(term);
                }
            }
        });
        
        // Se encontrou o botão de ação, adicionar evento
        if (searchActionBtn) {
            searchActionBtn.addEventListener('click', async function() {
                const term = searchInput.value.trim();
                if (term) {
                    await performSearch(term);
                }
            });
        }
        
    } else {
        console.warn('⚠️ Sistema de pesquisa não pôde ser configurado');
        showNotification('⚠️ Funcionalidade de pesquisa não disponível', 'info');
    }
}

async function performSearch(searchTerm) {
    console.log('🔍 Executando pesquisa:', searchTerm);
    
    try {
        if (!allPosts || allPosts.length === 0) {
            console.log('📭 Nenhuma história disponível para pesquisa');
            showNotification('📭 Nenhuma história disponível para pesquisa', 'info');
            return;
        }
        
         const contentArea = document.querySelector('.content');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="search-loading" style="text-align: center; padding: 60px 20px;">
                    <p style="color: var(--text-muted); font-size: 16px;">Buscando por "<strong>${searchTerm}</strong>"...</p>
                </div>
            `;
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('📊 Total de posts para pesquisar:', allPosts.length);
        
        const resultados = allPosts.filter(post => {
            const searchLower = searchTerm.toLowerCase();
            const temTitulo = post.titulo && post.titulo.toLowerCase().includes(searchLower);
            const temConteudo = post.conteudo && post.conteudo.toLowerCase().includes(searchLower);
            const temAutor = post.autor && post.autor.toLowerCase().includes(searchLower);
            const temCategoria = post.categoria && post.categoria.toLowerCase().includes(searchLower);
            
            return temTitulo || temConteudo || temAutor || temCategoria;
        });
        
        console.log(`✅ ${resultados.length} resultado(s) encontrado(s)`);
        
        displaySearchResults(resultados, searchTerm);
        
    } catch (error) {
        console.error('❌ Erro na pesquisa:', error);
        showNotification('❌ Erro ao realizar pesquisa: ' + error.message, 'error');
        restoreFullFeed();
    }
}

function displaySearchResults(resultados, searchTerm) {
    const contentArea = document.querySelector('.content');
    if (!contentArea) {
        console.error('❌ Área de conteúdo não encontrada');
        return;
    }
    
    clearPostContent();
    
    if (resultados.length === 0) {
        contentArea.innerHTML = `
            <div class="no-results-message">
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">🔍</div>
                    <h3 style="color: var(--text-dark); margin-bottom: 10px; font-size: 24px;">
                        Nenhum resultado encontrado
                    </h3>
                    <p style="color: var(--text-muted); margin-bottom: 25px; font-size: 16px;">
                        Não encontramos nada para "<strong style="color: var(--primary-brown);">${searchTerm}</strong>"
                    </p>
                    <button type="button" onclick="restoreFullFeed()" class="clear-search-btn large">
                        <span style="margin-right: 8px;">↩️</span>
                        Voltar para todas as histórias
                    </button>
                </div>
            </div>
        `;
    } else {
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'search-results-header';
        resultsHeader.innerHTML = `
            <div class="results-info">
                <h3>🔍 ${resultados.length} resultado(s) para "${searchTerm}"</h3>
                <p class="results-subtitle">Encontramos essas histórias relacionadas à sua pesquisa</p>
            </div>
            <button type="button" onclick="restoreFullFeed()" class="clear-search-btn">
                <span>✕</span>
                Limpar pesquisa
            </button>
        `;
        contentArea.appendChild(resultsHeader);
        
        resultados.forEach(post => {
            try {
                const postElement = post.titulo ? createStoryElement(post) : createPostElement(post);
                highlightSearchTerms(postElement, searchTerm);
                contentArea.appendChild(postElement);
            } catch (error) {
                console.error('❌ Erro ao renderizar post:', error);
            }
        });
        
        showNotification(`✅ ${resultados.length} história(s) encontrada(s) para "${searchTerm}"`, 'success');
    }
    
    console.log('📊 Resultados exibidos com sucesso');
}

function highlightSearchTerms(element, searchTerm) {
    if (!element || !searchTerm) return;
    
    const searchLower = searchTerm.toLowerCase();
    const textElements = element.querySelectorAll('.story-title, .story-content, .message-text, .username');
    
    textElements.forEach(el => {
        const originalHTML = el.innerHTML;
        const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
        const highlighted = originalHTML.replace(regex, '<mark class="search-highlight">$1</mark>');
        el.innerHTML = highlighted;
    });
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===== SISTEMA DE RESPOSTAS =====

async function handleReplyToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const replyBtn = event.target.closest('.reply-btn');
    const commentId = replyBtn.dataset.commentId;
    const replySection = document.getElementById(`reply-${commentId}`);
    
    if (!replySection) {
        console.error('❌ Seção de resposta não encontrada para comentário:', commentId);
        return;
    }
    
    if (replySection.style.display === 'none') {
        replySection.style.display = 'block';
        const replyInput = replySection.querySelector('.reply-input');
        if (replyInput) replyInput.focus();
    } else {
        replySection.style.display = 'none';
    }
}

async function handleReplySubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!currentUser) {
        showNotification('🔒 Faça login para responder', 'error');
        return;
    }
    
    const submitBtn = event.target.closest('.submit-reply');
    const commentId = submitBtn.dataset.commentId;
    const commentElement = submitBtn.closest('.comment');
    const postId = commentElement.closest('.comments-section').id.replace('comments-', '');
    const replyInput = document.querySelector(`#reply-${commentId} .reply-input`);
    
    if (!replyInput || !replyInput.value.trim()) {
        showNotification('📝 Digite uma resposta', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/respostas`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                id_comentario_pai: parseInt(commentId),
                id_usuario: currentUser.id,
                conteudo: replyInput.value.trim(),
                id_historia: parseInt(postId)
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Resposta criada:', result);
        
        replyInput.value = '';
        
        // Fechar a seção de resposta
        const replySection = document.getElementById(`reply-${commentId}`);
        if (replySection) {
            replySection.style.display = 'none';
        }
        
        // Recarregar os comentários para mostrar a nova resposta
        await loadCommentsWithReplies(postId);
        
        showNotification('💬 Resposta adicionada!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao responder:', error);
        showNotification('❌ Erro ao responder: ' + error.message, 'error');
    }
}


// ===== FUNÇÕES UTILITÁRIAS =====

function preventLinkReload() {
    // Prevenir comportamento padrão em links que são botões
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href="#"], a[href="javascript:void(0)"]');
        if (link) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
}

function smoothUpdate(element, callback) {
    element.style.transition = 'all 0.3s ease';
    callback();
}

function updateElementWithAnimation(element, newContent) {
    smoothUpdate(element, () => {
        element.style.opacity = '0';
        setTimeout(() => {
            element.innerHTML = newContent;
            element.style.opacity = '1';
        }, 300);
    });
}

function clearPostContent() {
    const contentArea = document.querySelector('.content');
    if (!contentArea) return;
    
    const elementsToRemove = contentArea.querySelectorAll(
        '.post, .empty-feed-message, .search-results-header, .no-results-message, .empty-state, .search-loading'
    );
    elementsToRemove.forEach(el => el.remove());

    if (contentArea.children.length === 0 && contentArea.innerHTML.includes('search-loading')) {
        contentArea.innerHTML = '';
    }
}

function restoreFullFeed() {
    console.log('🔄 Restaurando feed completo...');
    
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    
    if (searchInput) {
        searchInput.value = '';
    }
    
    if (searchClearBtn) {
        searchClearBtn.classList.add('hidden');
    }
    
    selectedCategories = [];
    updateActiveCategoriesDisplay();
    
    loadPosts();
}

function showEmptyMessage() {
    const contentArea = document.querySelector('.content');
    if (!contentArea) return;

    contentArea.innerHTML = '';
    
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-feed-message';
    emptyMessage.innerHTML = `
        <div class="empty-state">
            <h3>📭 Nenhuma história ainda</h3>
            <p>Seja o primeiro a compartilhar algo!</p>
            <button type="button" onclick="openModal()" class="test-button">
                ✍️ Criar Primeira História
            </button>
        </div>
    `;
    
    contentArea.appendChild(emptyMessage);
    
    ensureFabButton();
}

function ensureFabButton() {
    const contentArea = document.querySelector('.content');
    const fabButton = document.getElementById('fabButton');
    
    if (fabButton && !contentArea.contains(fabButton)) {
        contentArea.appendChild(fabButton);
    }
}

// ===== SISTEMA DE IMAGENS =====
function setupImagePreview() {
    const imageInput = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    const imageLabel = document.querySelector('.image-upload-btn');

    if (imageLabel && imageInput) {
        imageLabel.addEventListener('click', (e) => {
            e.preventDefault();
            imageInput.click();
        });
    }

    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.innerHTML = `
                        <div class="preview-container">
                            <img src="${e.target.result}" alt="Preview da imagem">
                            <button type="button" class="remove-image-btn" onclick="removeImage()">
                                ✕
                            </button>
                        </div>
                    `;
                    imagePreview.style.display = 'block';
                    
                    const uploadText = document.querySelector('.upload-text');
                    if (uploadText) {
                        uploadText.textContent = 'Alterar Imagem';
                    }
                };
                reader.readAsDataURL(file);
            } else if (file) {
                showNotification(' Por favor, selecione uma imagem válida', 'error');
                removeImage();
            }
        });
    }
}

function removeImage() {
    const imageInput = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    const uploadText = document.querySelector('.upload-text');
    
    if (imageInput) imageInput.value = '';
    if (imagePreview) {
        imagePreview.innerHTML = '';
        imagePreview.style.display = 'none';
    }
    if (uploadText) {
        uploadText.textContent = 'Escolher Imagem';
    }
}

// ===== NOTIFICAÇÕES =====
function showNotification(message, type = 'success') {
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// ===== EVENT LISTENERS GLOBAIS =====
function setupGlobalEventListeners() {
    console.log('🔧 Configurando event listeners globais...');
    
    // Listener global para TODAS as interações - SEM PREVENÇÃO GLOBAL
    document.addEventListener('click', function(e) {
        const target = e.target;
        
        console.log('🎯 Click global capturado:', target);
        
        // Deleção de posts
        if (target.closest('.btn-deletar')) {
            e.preventDefault();
            e.stopPropagation();
            const postElement = target.closest('.post');
            const postId = postElement.dataset.postId;
            console.log('🗑️ Deletar post:', postId);
            handleDeletePost(e);
            return;
        }
        
        // Curtir posts
        if (target.closest('.like-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const likeBtn = target.closest('.like-btn');
            const postId = likeBtn.dataset.postId;
            console.log('❤️ Curtir post:', postId);
            handlePostLike(e);
            return;
        }
        
        // Comentários
        if (target.closest('.comment-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const commentBtn = target.closest('.comment-btn');
            const postId = commentBtn.dataset.postId;
            console.log('💬 Toggle comentários:', postId);
            handleCommentToggle(e);
            return;
        }
        
        // Enviar comentários
        if (target.closest('.submit-comment')) {
            e.preventDefault();
            e.stopPropagation();
            const submitBtn = target.closest('.submit-comment');
            const postId = submitBtn.dataset.postId;
            console.log('📝 Enviar comentário:', postId);
            handleCommentSubmit(e);
            return;
        }
        
        // Curtir comentários
        if (target.closest('.comment-like-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const likeBtn = target.closest('.comment-like-btn');
            const commentId = likeBtn.dataset.commentId;
            console.log('💖 Curtir comentário:', commentId);
            handleCommentLike(e);
            return;
        }
        
        // Deleção de comentários
        if (target.closest('.btn-deletar-comentario')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🗑️ Deletar comentário');
            handleDeleteComment(e);
            return;
        }
        
        // Respostas
        if (target.closest('.reply-btn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('↩️ Toggle resposta');
            handleReplyToggle(e);
            return;
        }
        
        if (target.closest('.submit-reply')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📝 Enviar resposta');
            handleReplySubmit(e);
            return;
        }
        
        if (target.closest('.cancel-reply')) {
            e.preventDefault();
            e.stopPropagation();
            const cancelBtn = target.closest('.cancel-reply');
            const commentId = cancelBtn.dataset.commentId;
            const replySection = document.getElementById(`reply-${commentId}`);
            if (replySection) {
                replySection.style.display = 'none';
                const replyInput = replySection.querySelector('.reply-input');
                if (replyInput) replyInput.value = '';
            }
            return;
        }
        
        // FAB Button
        if (target.closest('#fabButton')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📖 Abrir modal de criação');
            openModal();
            return;
        }
        
        // Filtro de categorias
        if (target.closest('#categoryFilterToggle')) {
            e.preventDefault();
            e.stopPropagation();
            const filterOptions = document.getElementById('categoryFilterOptions');
            if (filterOptions) {
                filterOptions.classList.toggle('hidden');
            }
            return;
        }
        
        if (target.closest('#applyFilterBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔍 Aplicar filtros');
            applyCategoryFilters();
            return;
        }
        
        // Logout
        if (target.closest('#logoutBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚪 Logout');
            handleLogout();
            return;
        }
        
        // Limpar pesquisa
        if (target.closest('#searchClearBtn')) {
            e.preventDefault();
            e.stopPropagation();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            restoreFullFeed();
            return;
        }
        
        // Botão de pesquisa
        if (target.closest('#searchActionBtn')) {
            e.preventDefault();
            e.stopPropagation();
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value.trim()) {
                performSearch(searchInput.value.trim());
            }
            return;
        }
        
        // Botão de cancelar no modal
        if (target.closest('#cancelPostBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Fechar modal');
            closeModal();
            return;
        }
        
        // Remover imagem
        if (target.closest('.remove-image-btn')) {
            e.preventDefault();
            e.stopPropagation();
            removeImage();
            return;
        }
        
        // Remover categoria
        if (target.closest('.remove-category-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const badge = target.closest('.active-category-badge');
            const categoryName = badge.textContent.trim().replace('✕', '').trim();
            const category = allCategories.find(cat => 
                getCategoryDisplayName(cat.nome) === categoryName
            );
            if (category) {
                removeCategory(category.nome);
            }
            return;
        }
    });

    // Prevenir submit apenas em formulários de comentário/resposta
    document.addEventListener('submit', function(e) {
        const form = e.target;
        
        // Permitir formulário de criação de post
        if (form.id === 'postForm') {
            return;
        }
        
        // Prevenir apenas em formulários de comentário/resposta
        if (form.closest('.add-comment') || form.closest('.add-reply')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚫 Submit de comentário/resposta prevenido');
        }
    });

    // Prevenir enter em inputs de comentário/resposta
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const target = e.target;
            if (target.classList.contains('comment-input') || 
                target.classList.contains('reply-input')) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    });
}

function setupClickCapturePrevention() {
    // Se já foi instalado, não reinstala
    if (setupClickCapturePrevention._installed) return;
    setupClickCapturePrevention._installed = true;

    document.addEventListener('click', function capturePrevent(e) {
        try {
            const target = e.target;
            const clickable = target.closest('button, a, input[type="submit"]');
            
            if (!clickable) return;

            // Apenas prevenir em links vazios que podem causar recarregamento
            if (clickable.tagName === 'A') {
                const href = clickable.getAttribute('href');
                if (!href || href === '#' || href === 'javascript:void(0)') {
                    e.preventDefault();
                }
            }
            
            // NÃO prevenir em botões normais - deixar os event handlers funcionarem
            // A prevenção será feita apenas nos handlers específicos quando necessário
            
        } catch (err) {
            console.error('setupClickCapturePrevention error:', err);
        }
    }, true); // capture phase
}

// ===== FUNÇÕES DE INTERAÇÃO (mantidas para compatibilidade) =====
async function handleDeletePost(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const postElement = event.target.closest('.post');
    const postId = postElement.dataset.postId;

    if (confirm('Tem certeza que deseja deletar esta história?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/historias/${postId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification(' História deletada com sucesso!', 'success');
                
                // Remover do array
                allPosts = allPosts.filter(post => 
                    (post.id_historia || post.id) != postId
                );
                
                // Animação de remoção
                postElement.style.opacity = '0';
                postElement.style.transform = 'translateX(-100%)';
                postElement.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    postElement.remove();
                    
                    // Mostrar mensagem de feed vazio se necessário
                    const remainingPosts = document.querySelectorAll('.post');
                    if (remainingPosts.length === 0) {
                        showEmptyMessage();
                    }
                }, 300);
                
            } else {
                throw new Error('Erro ao deletar história');
            }
        } catch (error) {
            console.error(' Erro ao deletar história:', error);
            showNotification('Erro ao deletar história', 'error');
        }
    }
}

async function handlePostLike(event) {
    console.log('❤️ DEBUG: Iniciando curtida...');
    
    event.preventDefault();
    event.stopPropagation();
    
    if (!currentUser) {
        showNotification('🔒 Faça login para curtir', 'error');
        return;
    }

    const likeBtn = event.target.closest('.like-btn');
    if (!likeBtn) {
        console.error('❌ Botão de like não encontrado');
        return;
    }
    
    const postId = likeBtn.dataset.postId;
    console.log('❤️ DEBUG: Post ID:', postId);
    
    if (likeBtn.classList.contains('loading')) return;
    likeBtn.classList.add('loading');

    try {
        // ✅ CORREÇÃO: Verificar estado atual baseado na classe/aparência
        const alreadyLiked = likeBtn.classList.contains('liked') || likeBtn.querySelector('.like-icon').textContent === '❤️';
        console.log('❤️ DEBUG: Estado atual - já curtido?', alreadyLiked);
        
        const response = await fetch(`${API_BASE_URL}/curtidas`, {
            method: alreadyLiked ? 'DELETE' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                id_historia: parseInt(postId), 
                id_usuario: currentUser.id 
            })
        });
        
        console.log('❤️ DEBUG: Resposta do servidor:', response.status);
        
        if (response.ok) {
            // ✅ ATUALIZAÇÃO EM TEMPO REAL - Muda o visual instantaneamente
            const likeIcon = likeBtn.querySelector('.like-icon');
            const likeCount = likeBtn.querySelector('.like-count');
            let currentCount = parseInt(likeCount.textContent) || 0;
            
            if (alreadyLiked) {
                // Remove curtida
                likeIcon.textContent = '🤍';
                likeCount.textContent = Math.max(0, currentCount - 1);
                likeBtn.classList.remove('liked');
                likeBtn.dataset.liked = 'false';
                console.log('❤️ DEBUG: Curtida removida');
                showNotification('💔 Curtida removida', 'success');
            } else {
                // Adiciona curtida
                likeIcon.textContent = '❤️';
                likeCount.textContent = currentCount + 1;
                likeBtn.classList.add('liked');
                likeBtn.dataset.liked = 'true';
                console.log('❤️ DEBUG: Curtida adicionada');
                showNotification('❤️ História curtida!', 'success');
            }
            
        } else if (response.status === 400) {
            // ✅ CORREÇÃO: Se der erro 400 (já curtiu/não curtiu), sincroniza o estado
            const errorData = await response.json();
            console.log('⚠️ DEBUG: Erro 400 - sincronizando estado:', errorData);
            
            // Sincroniza o estado visual com o servidor
            if (errorData.message.includes('já curtiu')) {
                // Usuário já curtiu - força estado "curtido"
                const likeIcon = likeBtn.querySelector('.like-icon');
                const likeCount = likeBtn.querySelector('.like-count');
                likeIcon.textContent = '❤️';
                likeBtn.classList.add('liked');
                likeBtn.dataset.liked = 'true';
                showNotification('✅ Você já curtiu esta história', 'success');
            } else {
                // Outro erro 400 - força estado "não curtido"
                const likeIcon = likeBtn.querySelector('.like-icon');
                const likeCount = likeBtn.querySelector('.like-count');
                likeIcon.textContent = '🤍';
                likeBtn.classList.remove('liked');
                likeBtn.dataset.liked = 'false';
            }
        } else {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', errorText);
            throw new Error(`Erro ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Erro completo ao curtir:', error);
        showNotification('❌ Erro ao curtir', 'error');
    } finally {
        likeBtn.classList.remove('loading');
        console.log('❤️ DEBUG: Curtida processada');
    }
}

function updatePostInArray(postId, liked) {
    const postIndex = allPosts.findIndex(post => 
        (post.id_historia || post.id) == postId
    );
    
    if (postIndex !== -1) {
        const currentLikes = allPosts[postIndex].num_curtidas || 0;
        allPosts[postIndex].num_curtidas = liked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
        console.log('📊 DEBUG: Array atualizado - novos likes:', allPosts[postIndex].num_curtidas);
    }
}


function updateLikeButton(likeBtn, liked) {
    const likeIcon = likeBtn.querySelector('.like-icon');
    const likeCount = likeBtn.querySelector('.like-count');
    let currentCount = parseInt(likeCount.textContent) || 0;
    
    if (liked) {
        likeIcon.textContent = '❤️';
        likeCount.textContent = currentCount + 1;
        likeBtn.classList.add('liked');
        likeBtn.dataset.liked = 'true';
    } else {
        likeIcon.textContent = '🤍';
        likeCount.textContent = Math.max(0, currentCount - 1);
        likeBtn.classList.remove('liked');
        likeBtn.dataset.liked = 'false';
    }
}

async function safeParseResponse(response) {
    try {
        const text = await response.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch (err) {
            return { message: text };
        }
    } catch (err) {
        return {};
    }
}

async function handleCommentToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const commentBtn = event.target.closest('.comment-btn');
    const postId = commentBtn.dataset.postId;
    const commentsSection = document.getElementById(`comments-${postId}`);
    
    if (!commentsSection) {
        console.error('❌ Seção de comentários não encontrada para post:', postId);
        return;
    }
    
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        await loadCommentsWithReplies(postId);
    } else {
        commentsSection.style.display = 'none';
    }
}

async function handleCommentSubmit(event) {
    console.log('💬 DEBUG: Iniciando comentário...');
    
    event.preventDefault();
    event.stopPropagation();
    
    if (!currentUser) {
        showNotification('🔒 Faça login para comentar', 'error');
        return;
    }
    
    const submitBtn = event.target.closest('.submit-comment');
    const postId = submitBtn.dataset.postId;
    const commentsSection = document.getElementById(`comments-${postId}`);
    const commentInput = commentsSection.querySelector('.comment-input');
    
    console.log('💬 DEBUG: Post ID:', postId);
    console.log('💬 DEBUG: Comentário:', commentInput.value);
    
    if (!commentInput || !commentInput.value.trim()) {
        showNotification('📝 Digite um comentário', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/comentarios`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                id_historia: parseInt(postId),
                id_usuario: currentUser.id,
                conteudo: commentInput.value.trim()
            })
        });
        
        console.log('💬 DEBUG: Resposta do servidor:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const newComment = await response.json();
        console.log('💬 DEBUG: Novo comentário:', newComment);
        
        // Adicionar comentário à UI sem recarregar
        addNewCommentToUI(postId, newComment);
        
        // Limpar input
        commentInput.value = '';
        
        showNotification('💬 Comentário adicionado!', 'success');
        
    } catch (error) {
        console.error('❌ Erro completo ao comentar:', error);
        showNotification('❌ Erro ao comentar: ' + error.message, 'error');
    }
}

async function loadComments(postId) {
    try {
        console.log('💬 DEBUG FRONTEND: Carregando comentários para post:', postId);
        
        const response = await fetch(`${API_BASE_URL}/historias/${postId}/comentarios`);
        
        console.log('💬 DEBUG FRONTEND: Status da resposta:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('💬 DEBUG FRONTEND: Erro completo:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`HTTP ${response.status}`);
        }
        
        const comentarios = await response.json();
        console.log(`💬 DEBUG FRONTEND: ${comentarios.length} comentários recebidos:`, comentarios);
        
        const commentsList = document.querySelector(`#comments-${postId} .comments-list`);
        if (commentsList) {
            commentsList.innerHTML = '';
            
            if (comentarios.length === 0) {
                commentsList.innerHTML = '<p class="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
                return;
            }
            
            comentarios.forEach(comentario => {
                const commentElement = createCommentElement(comentario);
                commentsList.appendChild(commentElement);
            });
        }
     } catch (error) {
        console.error('💬 DEBUG FRONTEND: Erro completo ao carregar comentários:', error);
        const commentsList = document.querySelector(`#comments-${postId} .comments-list`);
        if (commentsList) {
            commentsList.innerHTML = '<p class="error-comments">Erro ao carregar comentários: ' + error.message + '</p>';
        }
    }
}

async function loadCommentsWithReplies(postId) {
    try {
        console.log('💬 DEBUG: Carregando comentários com respostas para post:', postId);
        
        const response = await fetch(`${API_BASE_URL}/historias/${postId}/comentarios-com-respostas`);
        
        console.log('💬 DEBUG: Status da resposta:', response.status);
        
        if (!response.ok) {
            // Se a rota com respostas não existir, usar a rota normal
            console.log('🔄 Rota com respostas não disponível, usando rota normal...');
            await loadComments(postId);
            return;
        }
        
        const comentariosComRespostas = await response.json();
        console.log(`💬 DEBUG: ${comentariosComRespostas.length} comentários com respostas recebidos:`, comentariosComRespostas);
        
        const commentsList = document.querySelector(`#comments-${postId} .comments-list`);
        if (commentsList) {
            commentsList.innerHTML = '';
            
            if (!comentariosComRespostas || comentariosComRespostas.length === 0) {
                commentsList.innerHTML = '<p class="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
                return;
            }
            
            comentariosComRespostas.forEach(comentario => {
                try {
                    const commentElement = createCommentElementWithReplies(comentario);
                    commentsList.appendChild(commentElement);
                } catch (error) {
                    console.error('❌ Erro ao criar elemento de comentário:', error);
                }
            });
        }
     } catch (error) {
        console.error('💬 DEBUG: Erro completo ao carregar comentários com respostas:', error);
        // Fallback para a versão antiga sem respostas
        await loadComments(postId);
    }
}

function createCommentElement(comentario) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.dataset.commentId = comentario.id_comentario;
    
    const isAuthor = currentUser && currentUser.id == comentario.id_usuario;
    
    commentDiv.innerHTML = `
        <div class="comment-header">
            <div class="comment-author">
                <div class="avatar small" data-user-id="${comentario.id_usuario}"></div>
                <span class="username">${comentario.autor || 'Usuário'}</span>
            </div>
            ${isAuthor ? '<button type="button" class="btn-deletar-comentario">🗑️</button>' : ''}
        </div>
        <div class="comment-content">
            <p>${comentario.conteudo || ''}</p>
        </div>
        <div class="comment-actions">
            <button type="button" class="comment-like-btn" data-comment-id="${comentario.id_comentario}">
                <span class="like-icon">🤍</span>
                <span class="like-count">${comentario.num_curtidas || 0}</span>
            </button>
        </div>
    `;
    
    const avatarElement = commentDiv.querySelector('.avatar');
    renderSimpleAvatar(avatarElement, { 
        id: comentario.id_usuario, 
        nome: comentario.autor,
        foto_perfil: comentario.foto_perfil_autor 
    }, 'small');
    
    return commentDiv;
}

function createCommentElementWithReplies(comentario) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.dataset.commentId = comentario.id_comentario;
    
    const isAuthor = currentUser && currentUser.id == comentario.id_usuario;
    
    // Gerar HTML das respostas se existirem
    let repliesHTML = '';
    if (comentario.respostas && comentario.respostas.length > 0) {
        const repliesElements = comentario.respostas.map(resposta => {
            try {
                return createReplyElement(resposta);
            } catch (error) {
                console.error('❌ Erro ao criar elemento de resposta:', error);
                return '';
            }
        }).join('');
        
        repliesHTML = `
            <div class="comment-replies">
                ${repliesElements}
            </div>
        `;
    }
    
    commentDiv.innerHTML = `
        <div class="comment-header">
            <div class="comment-author">
                <div class="avatar small" data-user-id="${comentario.id_usuario}"></div>
                <span class="username">${comentario.autor || 'Usuário'}</span>
            </div>
            ${isAuthor ? '<button type="button" class="btn-deletar-comentario" title="Deletar comentário">🗑️</button>' : ''}
        </div>
        <div class="comment-content">
            <p>${comentario.conteudo || ''}</p>
        </div>
        <div class="comment-actions">
            <button type="button" class="comment-like-btn" data-comment-id="${comentario.id_comentario}">
                <span class="like-icon">🤍</span>
                <span class="like-count">${comentario.num_curtidas || 0}</span>
            </button>
            <button type="button" class="reply-btn" data-comment-id="${comentario.id_comentario}">
                <span class="reply-icon">↩️</span>
                <span class="reply-text">Responder</span>
            </button>
        </div>
        
        <!-- Seção de resposta -->
        <div class="reply-section" id="reply-${comentario.id_comentario}" style="display: none;">
            <div class="add-reply">
                <textarea class="reply-input" placeholder="Escreva uma resposta..." rows="2"></textarea>
                <div class="reply-buttons">
                    <button type="button" id="submit-reply-btn" class="submit-reply" data-comment-id="${comentario.id_comentario}">
                        Responder
                    </button>
                    <button type="button" id="cancel-reply-btn" class="cancel-reply" data-comment-id="${comentario.id_comentario}">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
        
        ${repliesHTML}
    `;
    
    // Renderizar avatar do comentário principal
    const avatarElement = commentDiv.querySelector('.avatar');
    renderSimpleAvatar(avatarElement, { 
        id: comentario.id_usuario, 
        nome: comentario.autor,
        foto_perfil: comentario.foto_perfil_autor 
    }, 'small');
    
    // Renderizar avatares das respostas
    setTimeout(() => {
        const replyAvatars = commentDiv.querySelectorAll('.comment-replies .avatar');
        replyAvatars.forEach(avatar => {
            const userId = avatar.dataset.userId;
            const reply = comentario.respostas.find(r => r.id_usuario == userId);
            if (reply) {
                renderSimpleAvatar(avatar, {
                    id: reply.id_usuario,
                    nome: reply.autor,
                    foto_perfil: reply.foto_perfil_autor
                }, 'x-small');
            }
        });
    }, 0);
    
    return commentDiv;
}


function createReplyElement(resposta) {
    if (!resposta || typeof resposta !== 'object') {
        console.error('❌ Dados de resposta inválidos:', resposta);
        return '';
    }
    
    const isAuthor = currentUser && currentUser.id == resposta.id_usuario;
    
    // Verificar se é uma resposta a outro usuário
    const mention = resposta.parent_autor_nome ? `@${resposta.parent_autor_nome} ` : '';
    
    return `
        <div class="comment-reply" data-comment-id="${resposta.id_comentario}">
            <div class="reply-header">
                <div class="reply-author">
                    <div class="avatar x-small" data-user-id="${resposta.id_usuario}"></div>
                    <span class="username">${resposta.autor || 'Usuário'}</span>
                </div>
                ${isAuthor ? '<button type="button" class="btn-deletar-comentario" title="Deletar resposta">🗑️</button>' : ''}
            </div>
            <div class="reply-content">
                <p>${mention}${resposta.conteudo || ''}</p>
            </div>
            <div class="reply-actions">
                <button type="button" class="comment-like-btn" data-comment-id="${resposta.id_comentario}">
                    <span class="like-icon">🤍</span>
                    <span class="like-count">${resposta.num_curtidas || 0}</span>
                </button>
            </div>
        </div>
    `;
}

async function handleDeleteComment(event) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🗑️ Clique detectado no botão de deletar comentário');

    
    const deleteBtn = event.target.closest('.btn-deletar-comentario');
    if (!deleteBtn) {
        console.log('❌ Botão de deletar não encontrado');
        return;
    }
    
    const commentElement = deleteBtn.closest('.comment, .comment-reply');
    if (!commentElement) {
        console.log('❌ Elemento do comentário não encontrado');
        return;
    }
    
    const commentId = commentElement.dataset.commentId;
    console.log('🔍 ID do comentário/resposta:', commentId);
    
    if (!commentId) {

        console.error('❌ ID do comentário não encontrado no dataset');
        showNotification('❌ Erro: ID do comentário não encontrado', 'error');
        return;
    }

    // Determinar se é um comentário principal ou resposta
    const isReply = commentElement.classList.contains('comment-reply');
    const message = isReply ? 'Tem certeza que deseja deletar esta resposta?' : 'Tem certeza que deseja deletar este comentário?';

    if (confirm(message)) {
        console.log(`🔄 Enviando requisição para deletar ${isReply ? 'resposta' : 'comentário'}...`);
        
        try {
            const response = await fetch(`${API_BASE_URL}/comentarios/${commentId}`, {
                method: 'DELETE'
            });

            console.log('📡 Resposta do servidor:', response.status, response.statusText);

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ ${isReply ? 'Resposta' : 'Comentário'} deletado com sucesso:`, result);
                showNotification(`✅ ${isReply ? 'Resposta' : 'Comentário'} deletado com sucesso!`, 'success');
                
                // Animação de remoção
                commentElement.style.opacity = '0';
                commentElement.style.transform = 'translateX(-100%)';
                commentElement.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    commentElement.remove();
                    
                    // Verificar se ainda há comentários/respostas
                    const commentsList = document.querySelector('.comments-list');
                    if (commentsList) {
                        const remainingComments = commentsList.querySelectorAll('.comment:not(.comment-reply)');
                        const remainingReplies = commentsList.querySelectorAll('.comment-reply');
                        
                        if (remainingComments.length === 0 && remainingReplies.length === 0) {
                            commentsList.innerHTML = '<p class="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
                        }
                    }
                    
                    // Se era uma resposta, verificar se o comentário pai ficou sem respostas
                    if (isReply) {
                        const parentComment = commentElement.closest('.comment');
                        if (parentComment) {
                            const repliesContainer = parentComment.querySelector('.comment-replies');
                            if (repliesContainer && repliesContainer.children.length === 0) {
                                repliesContainer.remove();
                            }
                        }
                    }
                    
                }, 300);
                
            } else {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', errorText);
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error(`❌ Erro ao deletar ${isReply ? 'resposta' : 'comentário'}:`, error);
            showNotification(`❌ Erro ao deletar ${isReply ? 'resposta' : 'comentário'}: ` + error.message, 'error');
        }
    }
}

async function handleDeleteReply(event) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🗑️ Clique detectado no botão de deletar resposta');
    
    const deleteBtn = event.target.closest('.btn-deletar-resposta');
    if (!deleteBtn) {
        console.log('❌ Botão de deletar resposta não encontrado');
        return;
    }
    
    const replyElement = deleteBtn.closest('.comment-reply');
    if (!replyElement) {
        console.log('❌ Elemento da resposta não encontrado');
        return;
    }
    
    const replyId = replyElement.dataset.commentId;
    console.log('🔍 ID da resposta:', replyId);
    
    if (!replyId) {
        console.error('❌ ID da resposta não encontrado no dataset');
        showNotification('❌ Erro: ID da resposta não encontrado', 'error');
        return;
    }

    if (confirm('Tem certeza que deseja deletar esta resposta?')) {
        console.log('🔄 Enviando requisição para deletar resposta...');
        
        try {
            const response = await fetch(`${API_BASE_URL}/comentarios/${replyId}`, {
                method: 'DELETE'
            });

            console.log('📡 Resposta do servidor:', response.status, response.statusText);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Resposta deletada com sucesso:', result);
                showNotification('✅ Resposta deletada com sucesso!', 'success');
                
                // Animação de remoção
                replyElement.style.opacity = '0';
                replyElement.style.transform = 'translateX(-100%)';
                replyElement.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    replyElement.remove();
                    
                    // Verificar se o comentário pai ficou sem respostas
                    const parentComment = replyElement.closest('.comment');
                    if (parentComment) {
                        const repliesContainer = parentComment.querySelector('.comment-replies');
                        if (repliesContainer && repliesContainer.children.length === 0) {
                            repliesContainer.remove();
                        }
                    }
                    
                }, 300);
                
            } else {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', errorText);
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Erro ao deletar resposta:', error);
            showNotification('❌ Erro ao deletar resposta: ' + error.message, 'error');
        }
    }
}

async function handleCommentLike(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!currentUser) {
        showNotification('🔒 Faça login para curtir comentários', 'error');
        return;
    }

    const likeBtn = event.target.closest('.comment-like-btn');
    const commentId = likeBtn.dataset.commentId;
    
    console.log('💖 Curtindo comentário ID:', commentId);
    
    const likeIcon = likeBtn.querySelector('.like-icon');
    const likeCount = likeBtn.querySelector('.like-count');
    let currentCount = parseInt(likeCount.textContent) || 0;
    
    if (likeIcon.textContent === '🤍') {
        likeIcon.textContent = '❤️';
        likeCount.textContent = currentCount + 1;
        showNotification('💖 Comentário curtido!', 'success');
    } else {
        likeIcon.textContent = '🤍';
        likeCount.textContent = Math.max(0, currentCount - 1);
        showNotification('💔 Curtida removida do comentário', 'success');
    }
}

// ===== FUNÇÕES DE ATUALIZAÇÃO EM TEMPO REAL =====

function addNewStoryToFeed(newStory) {
    console.log('🔄 Adicionando nova história em tempo real:', newStory);
    
    const contentArea = document.querySelector('.content');
    if (!contentArea) return;
    
    // Remove mensagem de feed vazio
    const emptyMessage = contentArea.querySelector('.empty-feed-message');
    if (emptyMessage) emptyMessage.remove();
    
    // Adiciona ao array
    allPosts.unshift(newStory);
    
    // Cria elemento
    const storyElement = createStoryElement(newStory);
    
    // Adiciona no topo com animação
    storyElement.style.opacity = '0';
    storyElement.style.transform = 'translateY(-20px)';
    
    const firstPost = contentArea.querySelector('.post');
    if (firstPost) {
        contentArea.insertBefore(storyElement, firstPost);
    } else {
        contentArea.appendChild(storyElement);
    }
    
    // Animação
    setTimeout(() => {
        storyElement.style.transition = 'all 0.5s ease';
        storyElement.style.opacity = '1';
        storyElement.style.transform = 'translateY(0)';
    }, 10);
}

function updateLikeUI(likeBtn, liked) {
    const likeIcon = likeBtn.querySelector('.like-icon');
    const likeCount = likeBtn.querySelector('.like-count');
    let currentCount = parseInt(likeCount.textContent) || 0;
    
    if (liked) {
        likeIcon.textContent = '❤️';
        likeCount.textContent = currentCount + 1;
        likeBtn.classList.add('liked');
        likeBtn.dataset.liked = 'true';
    } else {
        likeIcon.textContent = '🤍';
        likeCount.textContent = Math.max(0, currentCount - 1);
        likeBtn.classList.remove('liked');
        likeBtn.dataset.liked = 'false';
    }
}

function addNewCommentToUI(postId, comment) {
    const commentsList = document.querySelector(`#comments-${postId} .comments-list`);
    if (!commentsList) return;
    
    // Remove mensagem de "nenhum comentário"
    const noCommentsMsg = commentsList.querySelector('.no-comments');
    if (noCommentsMsg) noCommentsMsg.remove();
    
    // Cria comentário
    const commentElement = createCommentElement(comment);
    
    // Adiciona com animação
    commentElement.style.opacity = '0';
    commentsList.appendChild(commentElement);
    
    setTimeout(() => {
        commentElement.style.transition = 'opacity 0.3s ease';
        commentElement.style.opacity = '1';
    }, 10);
}

console.log('🎉 scripts.js carregado com sucesso!');