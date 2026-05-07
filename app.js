// Simple SPA Router
const appContainer = document.getElementById('app');

const state = {
    email: '',
    paymentMethod: null
};

// View Generators
function loginView() {
    return `
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">Iniciar Sesión</h2>
                <p class="card-subtitle">Ingresa tu correo electrónico para comenzar.</p>
            </div>
            <form id="loginForm">
                <div class="form-group">
                    <label class="form-label" for="email">Correo Electrónico</label>
                    <input type="email" id="email" class="form-input" placeholder="tu@empresa.com" required>
                </div>
                <button type="submit" class="btn-primary">Continuar</button>
                <button type="button" id="goToRegisterBtn" class="btn-link">¿No tienes cuenta? Regístrate aquí</button>
            </form>
        </div>
    `;
}

function registerView() {
    return `
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">Registrarse</h2>
                <p class="card-subtitle">Crea una cuenta para realizar tus pagos.</p>
            </div>
            <form id="registerForm">
                <div class="form-group">
                    <label class="form-label" for="regName">Nombre Completo</label>
                    <input type="text" id="regName" class="form-input" placeholder="Ej. Juan Pérez" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="regEmail">Correo Electrónico</label>
                    <input type="email" id="regEmail" class="form-input" placeholder="tu@empresa.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="regPassword">Contraseña</label>
                    <input type="password" id="regPassword" class="form-input" placeholder="••••••••" required>
                </div>
                <button type="submit" class="btn-primary">Crear Cuenta</button>
                <button type="button" id="goToLoginBtn" class="btn-link">¿Ya tienes cuenta? Inicia sesión</button>
            </form>
        </div>
    `;
}

function verifyView() {
    return `
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">Verificación</h2>
                <p class="card-subtitle">Hemos enviado un código/token de seguridad a tu correo.</p>
                <p style="color: var(--accent-color); font-size: 0.75rem; margin-top: 8px;">(Nota: Como esto es una prueba visual, no te llegará un correo real. Puedes digitar cualquier código falso para continuar)</p>
            </div>
            <form id="verifyForm">
                <div class="form-group">
                    <label class="form-label" for="code">Código de Verificación</label>
                    <input type="text" id="code" class="form-input" placeholder="000000" required>
                </div>
                <button type="submit" class="btn-primary">Verificar</button>
                <button type="button" id="changeEmailBtn" class="btn-link">Cambiar cuenta de correo</button>
            </form>
        </div>
    `;
}

function authView() {
    return `
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">Autenticación</h2>
                <p class="card-subtitle">Token validado. Ahora ingresa tu contraseña para acceder.</p>
            </div>
            <form id="authForm">
                <div class="form-group">
                    <label class="form-label" for="password">Contraseña</label>
                    <input type="password" id="password" class="form-input" placeholder="••••••••" required>
                </div>
                <button type="submit" class="btn-primary">Acceder</button>
                <button type="button" id="backHomeBtn" class="btn-link">Volver al inicio</button>
            </form>
        </div>
    `;
}

function paymentMethodsView() {
    return `
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">Método de Pago</h2>
                <p class="card-subtitle">Selecciona cómo deseas realizar tu pago.</p>
            </div>
            <div class="methods-list">
                <button class="payment-method-btn" data-method="card">
                    <svg class="payment-icon" viewBox="0 0 24 24"><path d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="#000"/></svg>
                    Tarjeta de Crédito / Débito
                </button>
                <button class="payment-method-btn" data-method="pse">
                    <svg class="payment-icon" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 7.5l-4-2 4-2 4 2-4 2zM2 17l10 5 10-5M2 12l10 5 10-5" fill="#00f"/></svg>
                    Pago PSE
                </button>
                <button class="payment-method-btn" data-method="paypal">
                    <svg class="payment-icon" viewBox="0 0 24 24"><path d="M7.077 16.26l1.246-7.857h4.86c1.459 0 2.457.324 2.996.974.538.649.696 1.583.473 2.802-.276 1.745-1.285 2.836-2.28 3.447-.996.611-2.285.833-3.869.833h-2.18l-1.246 7.858h-2.73l2.73-17.16h5.36c2.096 0 3.518.52 4.266 1.562.748 1.042.923 2.502.525 4.382-.475 3.003-2.036 5.097-4.685 6.281-2.65 1.185-6.02 1.185-6.02 1.185l-1.397 8.816H3.344l2.487-15.683h1.246z" fill="#003087"/></svg>
                    PayPal
                </button>
            </div>
        </div>
    `;
}

function cardFormView() {
    return `
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">Detalles de Tarjeta</h2>
                <p class="card-subtitle">Ingresa los datos de tu tarjeta de forma segura.</p>
            </div>
            <form id="cardForm">
                <div class="form-group">
                    <label class="form-label" for="cardName">Nombre en la tarjeta</label>
                    <input type="text" id="cardName" class="form-input" placeholder="Ej. Juan Pérez" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="cardNumber">Número de tarjeta</label>
                    <input type="text" id="cardNumber" class="form-input" placeholder="0000 0000 0000 0000" maxlength="19" required>
                </div>
                <div class="row">
                    <div class="form-group col">
                        <label class="form-label" for="cardExp">Vencimiento</label>
                        <input type="text" id="cardExp" class="form-input" placeholder="MM/AA" maxlength="5" required>
                    </div>
                    <div class="form-group col">
                        <label class="form-label" for="cardCvv">CVV</label>
                        <input type="password" id="cardCvv" class="form-input" placeholder="123" maxlength="4" required>
                    </div>
                </div>
                <button type="submit" class="btn-primary">Pagar ahora</button>
                <button type="button" id="backMethodsBtn" class="btn-link">Volver a métodos de pago</button>
            </form>
        </div>
    `;
}

function successView() {
    return `
        <div class="glass-card" style="text-align: center;">
            <div class="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h2 class="card-title" style="margin-bottom: 12px;">¡Pago Exitoso!</h2>
            <p class="card-subtitle" style="margin-bottom: 24px;">Su pago fue procesado y aceptado. El registro ha sido guardado correctamente.</p>
            <button id="finishBtn" class="btn-primary">Volver al inicio</button>
        </div>
    `;
}

// Router and Event Attachments
function attachEvents(path) {
    if (path === '/') {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            state.email = document.getElementById('email').value;
            navigate('/verify');
        });
        document.getElementById('goToRegisterBtn').addEventListener('click', () => navigate('/register'));
    } else if (path === '/register') {
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            state.email = document.getElementById('regEmail').value;
            navigate('/verify');
        });
        document.getElementById('goToLoginBtn').addEventListener('click', () => navigate('/'));
    } else if (path === '/verify') {
        document.getElementById('verifyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            navigate('/auth');
        });
        document.getElementById('changeEmailBtn').addEventListener('click', () => navigate('/'));
    } else if (path === '/auth') {
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            // Simular login Cognito exitoso
            navigate('/payment-methods');
        });
        document.getElementById('backHomeBtn').addEventListener('click', () => navigate('/'));
    } else if (path === '/payment-methods') {
        const buttons = document.querySelectorAll('.payment-method-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const method = e.currentTarget.dataset.method;
                state.paymentMethod = method;
                if (method === 'card') {
                    navigate('/card-form');
                } else {
                    // Si es PSE o PayPal, simular pago directo o redirigir
                    navigate('/success');
                }
            });
        });
    } else if (path === '/card-form') {
        // Formato para tarjeta de crédito
        const cardNumberInput = document.getElementById('cardNumber');
        cardNumberInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            val = val.replace(/(.{4})/g, '$1 ').trim();
            e.target.value = val;
        });
        
        const cardExpInput = document.getElementById('cardExp');
        cardExpInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length >= 2) {
                val = val.substring(0,2) + '/' + val.substring(2,4);
            }
            e.target.value = val;
        });

        document.getElementById('cardForm').addEventListener('submit', (e) => {
            e.preventDefault();
            // Simular envío a Lambda Payment Service -> SQS -> DynamoDB
            navigate('/success');
        });
        document.getElementById('backMethodsBtn').addEventListener('click', () => navigate('/payment-methods'));
    } else if (path === '/success') {
        document.getElementById('finishBtn').addEventListener('click', () => {
            state.email = '';
            state.paymentMethod = null;
            navigate('/');
        });
    }
}

function navigate(path) {
    let viewHtml = '';
    switch(path) {
        case '/': viewHtml = loginView(); break;
        case '/register': viewHtml = registerView(); break;
        case '/verify': viewHtml = verifyView(); break;
        case '/auth': viewHtml = authView(); break;
        case '/payment-methods': viewHtml = paymentMethodsView(); break;
        case '/card-form': viewHtml = cardFormView(); break;
        case '/success': viewHtml = successView(); break;
        default: viewHtml = loginView();
    }
    
    appContainer.innerHTML = viewHtml;
    // Pequeño timeout para asegurar que el DOM se actualice antes de adjuntar eventos
    setTimeout(() => attachEvents(path), 0);
}

// Iniciar app
document.addEventListener('DOMContentLoaded', () => {
    navigate('/');
});
