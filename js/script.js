
const toast = document.getElementById("toast");
const categoryCards = document.querySelectorAll(".category-card");

// Единое название хранилища прогресса
const PROGRESS_KEY = "dotalearnProgress";

// Получение сохранённого прогресса
function getProgress() {
    try {
        return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {
            studiedItemIds: [],
            correctFirstTry: 0,
            completedQuestions: 0
        };
    } catch (error) {
        return {
            studiedItemIds: [],
            correctFirstTry: 0,
            completedQuestions: 0
        };
    }
}

// Обновление статистики на главной странице
async function updateStatistics() {
    try {
        const response = await fetch("data/items.json");

        if (!response.ok) {
            throw new Error("Не удалось загрузить базу предметов");
        }

        const database = await response.json();

        // Используем те же условия, что и в тренировке
        const availableItems = database.filter(item =>
            item.name &&
            item.image &&
            item.description &&
            item.description.length > 10
        );

        const progress = getProgress();

        const studiedCount = progress.studiedItemIds.length;

        const accuracy = progress.completedQuestions > 0
            ? Math.round(
                progress.correctFirstTry /
                progress.completedQuestions * 100
            )
            : 0;

        document.getElementById("total-items").textContent =
            availableItems.length;

        document.getElementById("studied-items").textContent =
            studiedCount;

        document.getElementById("accuracy").textContent =
            accuracy + "%";

    } catch (error) {
        console.error("Ошибка обновления статистики:", error);
    }
}

// Уведомления
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// Обработка категорий
categoryCards.forEach(card => {
    card.addEventListener("click", () => {
        const category = card.dataset.category;

        showToast(
            "Выбрана категория: " +
            card.querySelector("h3").textContent
        );

        console.log("Выбранная категория:", category);
    });
});

// Загружаем статистику при открытии главной страницы
updateStatistics();
