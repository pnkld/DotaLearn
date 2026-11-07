
let allItems = [];
let selectedCategory = "all";
let searchQuery = "";
// История просмотренных предметов
let itemHistory = [];
let currentItem = null;

const studyGrid = document.getElementById("study-grid");
const searchInput = document.getElementById("search-input");
const categoryFilters = document.getElementById("category-filters");
const sidebarCategoryFilters = document.getElementById("sidebar-category-filters");
const itemsCount = document.getElementById("items-count");
const resultsCount = document.getElementById("results-count");
const emptyMessage = document.getElementById("study-empty");

const modal = document.getElementById("study-modal");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");
// Связь карточек с предметами
const cardItems = new WeakMap();

// Названия категорий
const categoryNames = {
    consumable: "Расходуемые",
    attributes: "Атрибуты",
    equipment: "Снаряжение",
    misc: "Разное",
    secret_shop: "Тайная лавка",
    other: "Прочее",
    neutral: "Нейтральные"
};

// Защита текста при выводе HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// Форматирование стоимости
function formatCost(cost) {
    if (cost === null || cost === undefined || cost === "") {
        return "Не указана";
    }

    return Number(cost).toLocaleString("ru-RU") + " золота";
}

// Создание фильтров категорий
function createCategoryFilters() {
    const categories = [
        ...new Set(
            allItems
                .map(item => item.category)
                .filter(Boolean)
        )
    ];

    // Создаём кнопки категорий
    const createButton = (category, name, active = false) => {
        const button = document.createElement("button");

        button.className = `filter-button${active ? " active" : ""}`;
        button.dataset.category = category;
        button.textContent = name;

        return button;
    };

    // Старые фильтры в каталоге
    categoryFilters.innerHTML = "";

    categoryFilters.appendChild(
        createButton("all", "Все предметы", true)
    );

    // Категории в основном каталоге и боковом меню
    categories.forEach(category => {
        const name = categoryNames[category] || category;

        categoryFilters.appendChild(
            createButton(category, name)
        );
    });

    // Категории в боковой панели
    sidebarCategoryFilters.innerHTML = "";

    sidebarCategoryFilters.appendChild(
        createButton("all", "Все предметы", true)
    );

    categories.forEach(category => {
        const name = categoryNames[category] || category;

        sidebarCategoryFilters.appendChild(
            createButton(category, name)
        );
    });
}
// Обработка нажатий на карточки предметов
studyGrid.addEventListener("click", event => {
    const card = event.target.closest(".study-card");

    if (!card || !studyGrid.contains(card)) return;

    const item = cardItems.get(card);

    if (item) {
        openItem(item);
    }
});
// Обработка нажатий на категории
function handleCategoryClick(event) {
    const button = event.target.closest(".filter-button");

    if (!button) return;

    selectedCategory = button.dataset.category;

    // Синхронизируем активные кнопки в обоих меню
    document.querySelectorAll(".filter-button").forEach(element => {
        element.classList.toggle(
            "active",
            element.dataset.category === selectedCategory
        );
    });

    renderItems();
}

// Категории в основном каталоге
categoryFilters.addEventListener("click", handleCategoryClick);

// Категории в боковом меню
sidebarCategoryFilters.addEventListener("click", handleCategoryClick);

// Поиск
searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value.toLowerCase().trim();

    renderItems();
});

// Получение отфильтрованных предметов
function getFilteredItems() {
    return allItems.filter(item => {

        const matchesCategory =
            selectedCategory === "all" ||
            item.category === selectedCategory;

        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery) ||
            (item.nameEn || "").toLowerCase().includes(searchQuery) ||
            (item.description || "").toLowerCase().includes(searchQuery);

        return matchesCategory && matchesSearch;
    });
}

// Отображение каталога
function renderItems() {
    const filteredItems = getFilteredItems();

    studyGrid.innerHTML = "";

    itemsCount.textContent = allItems.length;
    resultsCount.textContent =
        `Найдено предметов: ${filteredItems.length}`;

    emptyMessage.hidden = filteredItems.length !== 0;

    filteredItems.forEach(item => {
        const card = document.createElement("button");

        card.className = "study-card";
        card.type = "button";

        card.innerHTML = `
            <div class="study-card-image">
                <img
                    src="${escapeHTML(item.image)}"
                    alt="${escapeHTML(item.name)}"
                    loading="lazy"
                >
            </div>

            <div class="study-card-info">
                <h3>${escapeHTML(item.name)}</h3>

                <span class="study-card-category">
                    ${escapeHTML(categoryNames[item.category] || item.category || "Без категории")}
                </span>

                <span class="study-card-cost">
                    ${escapeHTML(formatCost(item.cost))}
                </span>
            </div>
        `;

        cardItems.set(card, item);

        studyGrid.appendChild(card);
    });
}

// Открытие подробной информации
function openItem(item) {
        // Запоминаем предыдущий предмет
    if (currentItem && currentItem.id !== item.id) {
        itemHistory.push(currentItem);
    }

    currentItem = item;
    const statsHTML = (item.stats || []).length
        ? item.stats.map(stat => `
            <div class="modal-stat">
                <span>${escapeHTML(stat.name)}</span>
                <strong>${escapeHTML(stat.value)}</strong>
            </div>
        `).join("")
        : `<p class="modal-muted">Характеристики отсутствуют.</p>`;

    const notesHTML = (item.notes || []).length
        ? `
            <div class="modal-section">
                <h3>Дополнительная информация</h3>
                <ul>
                    ${item.notes.map(note => `
                        <li>${escapeHTML(note)}</li>
                    `).join("")}
                </ul>
            </div>
        `
        : "";

    const componentsHTML = (item.components || []).length
    ? `
        <div class="modal-section">
            <h3>Компоненты</h3>

            <div class="modal-components">
                ${item.components.map(componentId => {
                    const component = allItems.find(
                        element => element.id === componentId
                    );

                    if (!component) {
                        return `
                            <span class="modal-component-unavailable">
                                ${escapeHTML(componentId)}
                            </span>
                        `;
                    }

                    return `
                        <button
                            type="button"
                            class="modal-component-button"
                            data-component-id="${escapeHTML(component.id)}"
                        >
                            <img
                                src="${escapeHTML(component.image)}"
                                alt="${escapeHTML(component.name)}"
                            >

                            <span>${escapeHTML(component.name)}</span>
                        </button>
                    `;
                }).join("")}
            </div>
        </div>
    `
    : "";

    const loreHTML = item.lore
        ? `
            <div class="modal-section">
                <h3>История предмета</h3>
                <p>${escapeHTML(item.lore)}</p>
            </div>
        `
        : "";

    const manaHTML = item.manaCost !== null &&
                     item.manaCost !== undefined
        ? `<div class="modal-extra">
                <span>Расход маны</span>
                <strong>${escapeHTML(item.manaCost)}</strong>
           </div>`
        : "";

    const cooldownHTML = item.cooldown !== null &&
                         item.cooldown !== undefined
        ? `<div class="modal-extra">
                <span>Перезарядка</span>
                <strong>${escapeHTML(item.cooldown)} сек.</strong>
           </div>`
        : "";

    modalBody.innerHTML = `
            ${itemHistory.length > 0 ? `
            <button type="button" class="modal-back-button" id="modal-back">
                ← Назад
            </button>
        ` : ""}
        <div class="modal-item-header">

            <img
                src="${escapeHTML(item.image)}"
                alt="${escapeHTML(item.name)}"
            >

            <div>
                <p class="eyebrow">ПРЕДМЕТ DOTA 2</p>

                <h2>${escapeHTML(item.name)}</h2>

                <span class="study-card-category">
                    ${escapeHTML(categoryNames[item.category] || item.category || "Без категории")}
                </span>

                <p class="modal-price">
                    ${escapeHTML(formatCost(item.cost))}
                </p>
            </div>

        </div>

        <div class="modal-section">
            <h3>Описание</h3>
            <p class="modal-description">${escapeHTML(item.description || "Описание отсутствует.").replace(/\n/g, "<br>")}</p>
        </div>

        <div class="modal-section">
            <h3>Характеристики</h3>
            <div class="modal-stats">
                ${statsHTML}
            </div>
        </div>

        <div class="modal-extras">
            ${manaHTML}
            ${cooldownHTML}
        </div>

        ${loreHTML}
        ${componentsHTML}
        ${notesHTML}
    `;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}
// Обработка кнопок внутри окна предмета
modalBody.addEventListener("click", event => {

    // Нажатие на кнопку возврата
    const backButton = event.target.closest("#modal-back");

    if (backButton) {
        const previousItem = itemHistory.pop();

        if (previousItem) {
            currentItem = null;
            openItem(previousItem);
        }

        return;
    }

    // Нажатие на компонент
    const button = event.target.closest(".modal-component-button");

    if (!button) return;

    const componentId = button.dataset.componentId;

    const component = allItems.find(
        item => item.id === componentId
    );

    if (component) {
        openItem(component);
    }
});
// Закрытие окна
function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);

modal.addEventListener("click", event => {
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeModal();
    }
});

// Загрузка базы
async function loadStudyDatabase() {
    try {
        const response = await fetch("data/items.json");

        if (!response.ok) {
            throw new Error("Не удалось загрузить базу предметов");
        }

        const database = await response.json();

        allItems = database.filter(item =>
            item.name && item.image
        );

        createCategoryFilters();
        renderItems();

        console.log("Каталог загружен:", allItems.length);

    } catch (error) {
        console.error(error);

        resultsCount.textContent =
            "Не удалось загрузить предметы. Проверь базу данных.";
    }
}

loadStudyDatabase();
