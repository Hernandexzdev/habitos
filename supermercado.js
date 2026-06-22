// ========================================
// supermercado.js - Lista de Compras
// ========================================

// ===== ESTADO =====
let products = [];
let currentFilter = 'all';
let searchTerm = '';

// ===== DOM ELEMENTS =====
const productInput = document.getElementById('productInput');
const priceInput = document.getElementById('priceInput');
const quantityInput = document.getElementById('quantityInput');
const addBtn = document.getElementById('addProductBtn');
const productList = document.getElementById('productList');
const searchInput = document.getElementById('superSearchInput');
const totalItems = document.getElementById('totalItems');
const totalCost = document.getElementById('totalCost');
const summaryTotal = document.getElementById('summaryTotal');
const summaryCost = document.getElementById('summaryCost');
const summaryPending = document.getElementById('summaryPending');
const summaryBought = document.getElementById('summaryBought');
const footerStats = document.getElementById('footerStats');

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
    setupFilters();
    setupSearch();
    setupExportButtons();
    render();
    updateSummary();
});

// ===== CONFIGURACIÓN DE EVENTOS =====
function setupEventListeners() {
    addBtn.addEventListener('click', addProduct);
    productInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addProduct();
    });
    priceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addProduct();
    });
    quantityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addProduct();
    });
}

// ===== CRUD =====

function addProduct() {
    const name = productInput.value.trim();
    const price = parseFloat(priceInput.value);
    const quantity = parseInt(quantityInput.value) || 1;

    if (!name) {
        Toast.warning('📝 Escribe el nombre del producto');
        productInput.focus();
        return;
    }

    if (isNaN(price) || price <= 0) {
        Toast.warning('💰 Ingresa un precio válido');
        priceInput.focus();
        return;
    }

    const newProduct = {
        id: Date.now(),
        name: name,
        price: price,
        quantity: quantity,
        bought: false,
        created: new Date().toISOString()
    };

    products.push(newProduct);
    productInput.value = '';
    priceInput.value = '';
    quantityInput.value = '1';
    productInput.focus();
    saveAndRender();
    Toast.success(`✅ "${name}" agregado ($${(price * quantity).toFixed(2)})`);
}

function toggleProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        product.bought = !product.bought;
        saveAndRender();
        if (product.bought) {
            Toast.complete(`🛒 "${product.name}" comprado`);
        } else {
            Toast.info(`↩️ "${product.name}" pendiente`);
        }
        updateSummary();
    }
}

function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    showDeleteConfirmation(product, () => {
        products = products.filter(p => p.id !== id);
        saveAndRender();
        updateSummary();
        Toast.delete(`🗑️ "${product.name}" eliminado`);
    });
}

// ===== FILTRADO Y BÚSQUEDA =====

function getFilteredProducts() {
    let filtered = [...products];

    if (currentFilter === 'bought') {
        filtered = filtered.filter(p => p.bought);
    } else if (currentFilter === 'pending') {
        filtered = filtered.filter(p => !p.bought);
    }

    if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(term)
        );
    }

    filtered.sort((a, b) => {
        if (a.bought !== b.bought) {
            return a.bought ? 1 : -1;
        }
        return b.id - a.id;
    });

    return filtered;
}

// ===== RENDERIZADO =====

function render() {
    const filtered = getFilteredProducts();

    if (filtered.length === 0) {
        const message = searchTerm.trim() ? 
            '🔍 No se encontraron productos' : 
            '🛒 ¡Agrega tu primer producto!';
        productList.innerHTML = `
            <li class="empty-state">
                <span class="icon">${searchTerm.trim() ? '🔍' : '🛒'}</span>
                <div class="title">${message}</div>
                <div class="subtitle">${searchTerm.trim() ? 'Prueba con otra palabra' : 'Comienza tu lista de compras'}</div>
            </li>
        `;
        updateStats();
        return;
    }

    productList.innerHTML = filtered.map(product => {
        const total = product.price * product.quantity;
        return `
            <li class="habit-item ${product.bought ? 'completed' : ''}" data-id="${product.id}">
                <div class="habit-content">
                    <span class="habit-text">${product.name}</span>
                    <div class="habit-meta">
                        <span class="priority-badge" style="background:#dbeafe;color:#2563eb;">
                            $${product.price.toFixed(2)}
                        </span>
                        <span class="priority-badge" style="background:#fef3c7;color:#d97706;">
                            x${product.quantity}
                        </span>
                        <span class="priority-badge" style="background:#d1fae5;color:#059669;">
                            $${total.toFixed(2)}
                        </span>
                        ${product.bought ? '✅' : '⏳'}
                    </div>
                </div>
                <button class="delete-btn" aria-label="Eliminar">✕</button>
            </li>
        `;
    }).join('');

    document.querySelectorAll('.habit-text').forEach((span) => {
        const li = span.closest('.habit-item');
        if (li) {
            const id = Number(li.dataset.id);
            span.addEventListener('click', () => toggleProduct(id));
        }
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
        const li = btn.closest('.habit-item');
        if (li) {
            const id = Number(li.dataset.id);
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteProduct(id);
            });
        }
    });

    setupSwipeToDelete(filtered);
    updateStats();
    updateSummary();
}

// ===== SWIPE TO DELETE =====

function setupSwipeToDelete(productsList) {
    document.querySelectorAll('.habit-item').forEach((item, index) => {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        const onStart = (e) => {
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            isDragging = true;
            item.style.transition = 'none';
            item.style.touchAction = 'none';
        };

        const onMove = (e) => {
            if (!isDragging) return;
            const touch = e.touches ? e.touches[0] : e;
            currentX = touch.clientX;
            const diff = currentX - startX;

            if (diff < 0) {
                item.style.transform = `translateX(${diff}px)`;
                item.style.opacity = 1 - (Math.abs(diff) / 200);
            }
        };

        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            item.style.transition = 'transform 0.3s, opacity 0.3s';
            item.style.touchAction = 'auto';

            if (startX - currentX > 80) {
                const id = Number(item.dataset.id);
                deleteProduct(id);
            } else {
                item.style.transform = 'translateX(0)';
                item.style.opacity = '1';
            }
        };

        item.addEventListener('touchstart', onStart, { passive: true });
        item.addEventListener('touchmove', onMove, { passive: true });
        item.addEventListener('touchend', onEnd, { passive: true });

        item.addEventListener('mousedown', onStart);
        item.addEventListener('mousemove', onMove);
        item.addEventListener('mouseup', onEnd);
        item.addEventListener('mouseleave', onEnd);
    });
}

// ===== PERSISTENCIA =====

function saveAndRender() {
    localStorage.setItem('products', JSON.stringify(products));
    render();
}

function loadProducts() {
    const stored = localStorage.getItem('products');
    if (stored) {
        products = JSON.parse(stored);
    } else {
        products = [
            { id: 1, name: 'Leche', price: 3.50, quantity: 2, bought: false, created: new Date().toISOString() },
            { id: 2, name: 'Pan', price: 2.00, quantity: 3, bought: true, created: new Date().toISOString() },
            { id: 3, name: 'Huevos', price: 4.00, quantity: 1, bought: false, created: new Date().toISOString() }
        ];
    }
    render();
    updateSummary();
}

// ===== ESTADÍSTICAS =====

function updateStats() {
    const total = products.length;
    const bought = products.filter(p => p.bought).length;
    const pending = total - bought;
    const totalCostProducts = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    totalItems.textContent = `${total} items`;
    totalCost.textContent = `$${totalCostProducts.toFixed(2)}`;
    footerStats.textContent = `${total} items • $${totalCostProducts.toFixed(2)}`;
}

function updateSummary() {
    const total = products.length;
    const bought = products.filter(p => p.bought).length;
    const pending = total - bought;
    const totalCostProducts = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const pendingCost = products.filter(p => !p.bought)
        .reduce((sum, p) => sum + (p.price * p.quantity), 0);

    summaryTotal.textContent = total;
    summaryCost.textContent = `$${totalCostProducts.toFixed(2)}`;
    summaryPending.textContent = `${pending} ($${pendingCost.toFixed(2)})`;
    summaryBought.textContent = `${bought}`;
}

// ===== FILTROS Y BÚSQUEDA =====

function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            render();
        });
    });
}

function setupSearch() {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchTerm = searchInput.value;
            render();
        }, 300);
    });
}

// ===== EXPORTAR / IMPORTAR =====

function setupExportButtons() {
    // Exportar
    document.getElementById('exportSuperBtn').addEventListener('click', exportProducts);

    // Importar
    document.getElementById('importSuperInput').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importProducts(e.target.files[0]);
            e.target.value = '';
        }
    });

    // Reset
    document.getElementById('resetSuperBtn').addEventListener('click', () => {
        if (confirm('⚠️ ¿Estás seguro de resetear la lista de compras?')) {
            products = [];
            saveAndRender();
            updateSummary();
            Toast.warning('🔄 Lista reseteada');
        }
    });
}

function exportProducts() {
    const data = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        products: products,
        metadata: {
            total: products.length,
            bought: products.filter(p => p.bought).length,
            pending: products.filter(p => !p.bought).length,
            totalCost: products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
        }
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `compras-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Toast.export('📤 Lista de compras exportada');
}

function importProducts(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            if (!data.products || !Array.isArray(data.products)) {
                throw new Error('Formato de JSON inválido');
            }

            if (products.length > 0) {
                const confirmar = confirm(
                    `Esto sobrescribirá tus ${products.length} productos actuales.\n` +
                    `¿Estás seguro de continuar?`
                );
                if (!confirmar) return;
            }

            products = data.products;
            saveAndRender();
            updateSummary();
            Toast.import(`📥 Importados ${products.length} productos`);

        } catch (error) {
            Toast.error('❌ Error: Archivo JSON inválido');
            console.error('Error al importar:', error);
        }
    };

    reader.readAsText(file);
}

// ===== CONFIRMACIÓN BONITA (reutilizada) =====

function showDeleteConfirmation(item, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 24px;
        padding: 32px;
        max-width: 420px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        text-align: center;
    `;

    modal.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 12px;">🛒</div>
        <h2 style="color: #1f2937; font-size: 1.5rem; margin-bottom: 8px;">¿Eliminar producto?</h2>
        <p style="color: #6b7280; margin-bottom: 24px; font-size: 1rem;">
            ¿Estás seguro de que quieres eliminar<br>
            <strong style="color: #4F46E5;">"${item.name}"</strong>?
        </p>
        <div style="display: flex; gap: 12px;">
            <button id="cancelDelete" style="
                flex: 1;
                padding: 14px;
                border: 2px solid #e5e7eb;
                border-radius: 14px;
                background: white;
                color: #4b5563;
                font-weight: 600;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s;
            ">Cancelar</button>
            <button id="confirmDelete" style="
                flex: 1;
                padding: 14px;
                border: none;
                border-radius: 14px;
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                font-weight: 600;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            ">🗑️ Eliminar</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    if (!document.getElementById('modalStyles')) {
        const modalStyles = document.createElement('style');
        modalStyles.id = 'modalStyles';
        modalStyles.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(30px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
        `;
        document.head.appendChild(modalStyles);
    }

    const cancelBtn = document.getElementById('cancelDelete');
    const confirmBtn = document.getElementById('confirmDelete');

    const closeModal = () => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s';
        setTimeout(() => overlay.remove(), 300);
    };

    cancelBtn.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', () => {
        closeModal();
        setTimeout(onConfirm, 300);
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

// ===== TOAST =====

const Toast = {
    show(message, type = 'success', duration = 3000) {
        document.querySelectorAll('.toast-notification').forEach(el => el.remove());

        const config = {
            success: { icon: '✅', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
            error: { icon: '❌', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
            warning: { icon: '⚠️', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
            info: { icon: 'ℹ️', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
            delete: { icon: '🗑️', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
            complete: { icon: '🎉', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
            import: { icon: '📥', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
            export: { icon: '📤', gradient: 'linear-gradient(135deg, #4F46E5, #7c3aed)' }
        };

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: ${config[type]?.gradient || config.success.gradient};
            color: white;
            padding: 16px 24px;
            border-radius: 16px;
            font-weight: 600;
            font-size: 1rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 99999;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 90%;
            min-width: 280px;
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-family: system-ui, -apple-system, sans-serif;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            pointer-events: none;
        `;

        toast.innerHTML = `
            <span style="font-size:1.8rem;line-height:1;">${config[type]?.icon || 'ℹ️'}</span>
            <span style="flex:1;font-size:1rem;text-shadow:0 1px 2px rgba(0,0,0,0.1);">${message}</span>
            <div style="position:absolute;bottom:0;left:0;height:4px;border-radius:0 0 16px 16px;width:100%;animation:toastProgress ${duration}ms linear forwards;background:rgba(255,255,255,0.3);"></div>
        `;

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(30px)';
            setTimeout(() => toast.remove(), 500);
        }, duration);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); },
    delete(msg) { this.show(msg, 'delete'); },
    complete(msg) { this.show(msg, 'complete'); },
    import(msg) { this.show(msg, 'import'); },
    export(msg) { this.show(msg, 'export'); }
};

// Inyectar estilos de toast
(function injectToastStyles() {
    const styles = `
        @keyframes toastProgress {
            from { width: 100%; }
            to { width: 0%; }
        }
        .toast-notification {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            padding: 16px 24px;
            border-radius: 16px;
            font-weight: 600;
            font-size: 1rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 99999;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 90%;
            min-width: 280px;
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-family: system-ui, -apple-system, sans-serif;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            pointer-events: none;
        }
    `;
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
})();