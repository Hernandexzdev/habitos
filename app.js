// ===============================
// HABITOS - VERSION PRO (STYLE SUPERMERCADO)
// ===============================

let habits = JSON.parse(localStorage.getItem("habits")) || [];

const habitInput = document.getElementById("habitInput");
const addBtn = document.getElementById("addBtn");
const habitList = document.getElementById("habitList");
const stats = document.getElementById("stats");
const progressBar = document.getElementById("progressBar");

// ===============================
// PERSISTENCIA
// ===============================
function save() {
    localStorage.setItem("habits", JSON.stringify(habits));
}

// ===============================
// TOAST (IGUAL SUPERMERCADO)
// ===============================
// ===== TOAST COMPLETO (IGUAL QUE SUPERMERCADO) =====

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

        // 🔥 BARRA DE PROGRESO (IGUAL QUE SUPERMERCADO)
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

// ===============================
// STATS
// ===============================
function updateStats() {
    const done = habits.filter(h => h.completed).length;
    const percent = habits.length ? Math.round((done / habits.length) * 100) : 0;

    stats.textContent = `${habits.length} hábitos`;
    progressBar.style.width = percent + "%";
    progressBar.textContent = percent + "%";
}

// ===============================
// RENDER (ESTILO SUPERMERCADO)
// ===============================
function render() {
    habitList.innerHTML = "";

    if (habits.length === 0) {
        habitList.innerHTML = `
            <li style="text-align:center;color:#9ca3af;padding:20px;">
                💤 Sin hábitos
            </li>
        `;
        updateStats();
        return;
    }

    habits.forEach((h, index) => {
        const li = document.createElement("li");
        li.className = "habit-item" + (h.completed ? " completed" : "");
        li.dataset.id = index;

        li.innerHTML = `
            <div class="habit-content">
                <span class="habit-text">${h.text}</span>
                <div class="habit-meta">
                    ${h.completed ? "✅ Completado" : "⏳ Pendiente"}
                </div>
            </div>
            <button class="delete-btn">✕</button>
        `;

        // TOGGLE
        li.querySelector(".habit-text").addEventListener("click", () => {
            h.completed = !h.completed;
            save();
            render();
        });

        // DELETE
        li.querySelector(".delete-btn").addEventListener("click", () => {
            habits.splice(index, 1);
            save();
            render();
            Toast.show("🗑️ eliminado", "info");
        });

        habitList.appendChild(li);
    });

    updateStats();
}

// ===============================
// ADD (CON ANIMACIÓN TIPO SUPERMERCADO)
// ===============================
function addHabit() {
    const text = habitInput.value.trim();

    if (!text) {
        Toast.show("Escribe un hábito", "error");
        return;
    }

    habits.push({
        text,
        completed: false
    });

    save();
    render();

    habitInput.value = "";
    habitInput.focus();

    // 🔥 MISMA ANIMACIÓN QUE SUPERMERCADO
    Toast.show(`🎉 "${text}" agregado`, "success");
}

// ===============================
addBtn.addEventListener("click", addHabit);
habitInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addHabit();
});

render();