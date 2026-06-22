const habitInput = document.getElementById("habitInput");
const addBtn = document.getElementById("addBtn");
const habitList = document.getElementById("habitList");
const stats = document.getElementById("stats");
const progressBar = document.getElementById("progressBar");

let habits = JSON.parse(localStorage.getItem("habits")) || [];

function saveHabits() {
    localStorage.setItem("habits", JSON.stringify(habits));
}

function updateStats() {
    stats.textContent = `${habits.length} hábitos`;

    const completed = habits.filter(h => h.completed).length;
    const percent = habits.length
        ? Math.round((completed / habits.length) * 100)
        : 0;

    progressBar.style.width = `${percent}%`;
    progressBar.textContent = `${percent}%`;
}

function renderHabits() {
    habitList.innerHTML = "";

    habits.forEach((habit, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <input type="checkbox" ${habit.completed ? "checked" : ""}>
            <span style="${habit.completed ? 'text-decoration:line-through' : ''}">
                ${habit.text}
            </span>
            <button>🗑️</button>
        `;

        const checkbox = li.querySelector("input");
        const deleteBtn = li.querySelector("button");

        checkbox.addEventListener("change", () => {
            habits[index].completed = checkbox.checked;
            saveHabits();
            renderHabits();
        });

        deleteBtn.addEventListener("click", () => {
            habits.splice(index, 1);
            saveHabits();
            renderHabits();
        });

        habitList.appendChild(li);
    });

    updateStats();
}

addBtn.addEventListener("click", () => {
    const text = habitInput.value.trim();

    if (!text) return;

    habits.push({
        text,
        completed: false
    });

    saveHabits();
    renderHabits();

    habitInput.value = "";
});

habitInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
        addBtn.click();
    }
});

renderHabits();