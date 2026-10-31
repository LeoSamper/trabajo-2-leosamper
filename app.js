const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';
const USERS_URL = 'https://jsonplaceholder.typicode.com/users';

// Referencias al DOM principales
const postsContainer = document.getElementById('posts-container');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const searchInput = document.getElementById('search-input');

// Referencias al DOM del Modal y Formulario
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const postModal = document.getElementById('post-modal');
const newPostForm = document.getElementById('new-post-form');
const newTitleInput = document.getElementById('new-title');
const newBodyInput = document.getElementById('new-body');

let allPosts = [];
let allUsers = [];
const authorModal = document.getElementById('author-modal');
const authorDetails = document.getElementById('author-details');
const closeAuthorModalBtn = document.getElementById('close-author-modal');
let previousFocus = null;

// Evita interpretar contenido de la API como HTML.
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

function openAuthorProfile(userId) {
    const user = allUsers.find(item => item.id === userId);
    if (!user) return;
    const name = escapeHTML(user.name);
    const company = escapeHTML(user.company?.name || 'No disponible');
    const city = escapeHTML(user.address?.city || 'No disponible');
    const address = [user.address?.street, user.address?.suite, user.address?.city, user.address?.zipcode]
        .filter(Boolean).map(escapeHTML).join(', ');
    const website = String(user.website || '').replace(/^https?:\/\//i, '');
    const safeWebsite = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(website) ? `https://${website}` : null;
    authorDetails.innerHTML = `
        <div class="author-profile-header">
            <div class="author-avatar" aria-hidden="true">${name.trim().charAt(0).toUpperCase()}</div>
            <div><h2 id="author-modal-title">${name}</h2><p>@${escapeHTML(user.username)}</p></div>
        </div>
        <h3>Biografía</h3>
        <p class="author-bio">${name} es una persona registrada en la plataforma como
        <strong>@${escapeHTML(user.username)}</strong>. Según su perfil, está vinculada a
        <strong>${company}</strong> y su ciudad registrada es <strong>${city}</strong>.</p>
        <h3>Información de contacto</h3>
        <dl class="author-info">
            <div><dt>ID del usuario</dt><dd>${escapeHTML(user.id)}</dd></div>
            <div><dt>Correo electrónico</dt><dd>${escapeHTML(user.email)}</dd></div>
            <div><dt>Teléfono</dt><dd>${escapeHTML(user.phone)}</dd></div>
            <div><dt>Dirección</dt><dd>${address || 'No disponible'}</dd></div>
            <div><dt>Empresa</dt><dd>${company}</dd></div>
            <div><dt>Sitio web</dt><dd>${safeWebsite ? `<a href="${safeWebsite}" target="_blank" rel="noopener noreferrer">${escapeHTML(website)}</a>` : escapeHTML(user.website || 'No disponible')}</dd></div>
        </dl>
        <p class="author-disclaimer">Perfil generado a partir de los datos de prueba de JSONPlaceholder.</p>
    `;
    previousFocus = document.activeElement;
    authorModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    closeAuthorModalBtn.focus();
}

function closeAuthorProfile() {
    authorModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    previousFocus?.focus();
}

postsContainer.addEventListener('click', event => {
    const authorButton = event.target.closest('[data-author-id]');
    if (authorButton) openAuthorProfile(Number(authorButton.dataset.authorId));
});
closeAuthorModalBtn.addEventListener('click', closeAuthorProfile);
authorModal.addEventListener('click', event => {
    if (event.target === authorModal) closeAuthorProfile();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !authorModal.classList.contains('hidden')) closeAuthorProfile();
});

/**
 * Inicializar aplicación cargando datos GET
 */
async function initApp() {
    showLoading(true);
    showError(false); // Corregido: Oculta el error al iniciar correctamente

    try {
        // Realizamos peticiones en paralelo usando Promise.all
        const [postsResponse, usersResponse] = await Promise.all([
            fetch(POSTS_URL),
            fetch(USERS_URL)
        ]);

        if (!postsResponse.ok || !usersResponse.ok) {
            throw new Error('Error al conectar con el servidor.');
        }

        const posts = await postsResponse.json();
        const users = await usersResponse.json();
        allUsers = users;

        // Mapeamos los posts para adjuntar el nombre del autor
        allPosts = posts.map(post => {
            const author = users.find(user => user.id === post.userId);
            return {
                ...post,
                authorName: author ? author.name : 'Usuario Desconocido',
                authorId: author ? author.id : null
            };
        });

        // Renderizamos las tarjetas en el DOM
        renderPosts(allPosts);

    } catch (error) {
        console.error('Hubo un problema:', error);
        showError(true);
    } finally {
        showLoading(false);
    }
}

/**
 * Renderizar tarjetas en el DOM
 */
function renderPosts(postsToRender) {
    if (postsToRender.length === 0) {
        postsContainer.innerHTML = `<p class="no-results" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No se encontraron publicaciones.</p>`;
        return;
    }

    const postsHTML = postsToRender.map(post => `
        <article class="post-card">
            <div>
                <h2 class="post-title">${escapeHTML(post.title)}</h2>
                <p class="post-body">${escapeHTML(post.body)}</p>
            </div>
            ${post.authorId
                ? `<button type="button" class="post-author author-link" data-author-id="${post.authorId}" aria-label="Ver biografía de ${escapeHTML(post.authorName)}">✍️ ${escapeHTML(post.authorName)}</button>`
                : `<span class="post-author">✍️ ${escapeHTML(post.authorName)}</span>`}
        </article>
    `).join('');

    postsContainer.innerHTML = postsHTML;
}

/**
 * Manejo del Modal (Abrir y Cerrar)
 */
openModalBtn.addEventListener('click', () => {
    postModal.classList.remove('hidden');
    newTitleInput.focus();
});

closeModalBtn.addEventListener('click', () => {
    postModal.classList.add('hidden');
});

// Cerrar si se hace clic fuera del contenido del modal
window.addEventListener('click', (e) => {
    if (e.target === postModal) {
        postModal.classList.add('hidden');
    }
});

/**
 * Enviar Nueva Publicación mediante Petición POST
 */
newPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = newTitleInput.value.trim();
    const body = newBodyInput.value.trim();

    if (!title || !body) return;

    const newPostPayload = {
        title: title,
        body: body,
        userId: 1 // Simulamos que el usuario actual tiene ID 1
    };

    try {
        const response = await fetch(POSTS_URL, {
            method: 'POST',
            body: JSON.stringify(newPostPayload),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        });

        if (!response.ok) {
            throw new Error('Error al registrar la publicación en el servidor.');
        }

        const createdPost = await response.json();
        createdPost.authorName = 'Tú (Autor Actual)';

        // Insertamos el nuevo post al inicio del arreglo global
        allPosts.unshift(createdPost);

        // Volvemos a renderizar la interfaz
        renderPosts(allPosts);

        // Limpiamos formulario y cerramos modal
        newPostForm.reset();
        postModal.classList.add('hidden');

        alert('¡Publicación creada exitosamente!');

    } catch (error) {
        console.error('Error al enviar POST:', error);
        alert('No se pudo crear la publicación. Inténtalo de nuevo.');
    }
});

/**
 * Buscador en tiempo real
 */
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    const filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) || 
        post.body.toLowerCase().includes(searchTerm)
    );

    renderPosts(filteredPosts);
});

// Funciones auxiliares de UI (Control de estados)
function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

function showError(hasError) {
    if (hasError) {
        errorMessage.classList.remove('hidden');
    } else {
        errorMessage.classList.add('hidden');
    }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', initApp);