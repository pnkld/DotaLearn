let allItems = [];
let items = [];
let currentQuestion = 0;
let score = 0;
let answered = false;
let questionHadMistake = false;

let selectedAmount = 20;

const PROGRESS_KEY = "dotalearnProgress";

// Элементы настройки
const setupScreen = document.getElementById("setup-screen");
const amountButtons = document.querySelectorAll(".amount-button");
const customAmountInput = document.getElementById("custom-amount");
const customAmountButton = document.getElementById("custom-amount-button");
const amountInfo = document.getElementById("amount-info");
const startButton = document.getElementById("start-training-button");
const setupError = document.getElementById("setup-error");

// Элементы тренировки
const trainingHeading = document.getElementById("training-heading");
const progressSection = document.getElementById("progress-section");
const gameArea = document.getElementById("game-area");

const itemImage = document.getElementById("item-image");
const itemName = document.getElementById("item-name");
const answersList = document.getElementById("answers-list");
const dropZone = document.getElementById("drop-zone");
const feedback = document.getElementById("feedback");
const nextButton = document.getElementById("next-button");

// Прогресс
function saveAnswerProgress(item) {
    let progress;

    try {
        progress = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {
            studiedItemIds: [],
            correctFirstTry: 0,
            completedQuestions: 0
        };
    } catch (error) {
        progress = {
            studiedItemIds: [],
            correctFirstTry: 0,
            completedQuestions: 0
        };
    }

    const itemId = String(item.id ?? item.name);

    if (!progress.studiedItemIds.includes(itemId)) {
        progress.studiedItemIds.push(itemId);
    }

    progress.completedQuestions++;

    if (!questionHadMistake) {
        progress.correctFirstTry++;
    }

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// Перемешивание массива
function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

// Правильное окончание слова
function getItemWord(number) {
    const lastTwo = number % 100;
    const last = number % 10;

    if (lastTwo >= 11 && lastTwo <= 14) return "предметов";
    if (last === 1) return "предмет";
    if (last >= 2 && last <= 4) return "предмета";

    return "предметов";
}

// Обновление информации о количестве
function updateAmountInfo() {
    if (selectedAmount === "all") {
        amountInfo.textContent =
            `Выбраны все предметы: ${allItems.length}`;
    } else {
        amountInfo.textContent =
            `Выбрано: ${selectedAmount} ${getItemWord(selectedAmount)}`;
    }
}

// Выбор готового количества
amountButtons.forEach(button => {
    button.addEventListener("click", () => {
        const amount = button.dataset.amount;

        selectedAmount = amount === "all"
            ? "all"
            : Number(amount);

        amountButtons.forEach(btn => {
            btn.classList.remove("selected");
        });

        button.classList.add("selected");

        customAmountInput.value = "";
        setupError.textContent = "";

        updateAmountInfo();
    });
});

// Выбор собственного количества
customAmountButton.addEventListener("click", () => {
    const amount = Number(customAmountInput.value);

    if (
        !customAmountInput.value ||
        !Number.isInteger(amount) ||
        amount < 4
    ) {
        setupError.textContent =
            "Введи целое число не меньше 4.";
        return;
    }

    if (amount > allItems.length) {
        setupError.textContent =
            `В базе доступно только ${allItems.length} предметов.`;
        return;
    }

    selectedAmount = amount;

    amountButtons.forEach(button => {
        button.classList.remove("selected");
    });

    setupError.textContent = "";

    updateAmountInfo();
});

// Начало тренировки
startButton.addEventListener("click", () => {
    if (allItems.length < 4) {
        setupError.textContent =
            "Сначала дождись загрузки базы предметов.";
        return;
    }

    const amount = selectedAmount === "all"
        ? allItems.length
        : selectedAmount;

    if (amount > allItems.length || amount < 4) {
        setupError.textContent =
            "Выбери допустимое количество предметов.";
        return;
    }

    // Выбираем случайные предметы
    items = shuffle(allItems).slice(0, amount);

    currentQuestion = 0;
    score = 0;
    answered = false;

    document.getElementById("score").textContent = "0";

    // Скрываем настройку
    setupScreen.style.display = "none";

    // Показываем тренировку
    trainingHeading.style.display = "";
    progressSection.style.display = "";
    gameArea.style.display = "";

    loadQuestion();
});

// Загрузка базы предметов
async function loadDatabase() {
    try {
        startButton.disabled = true;

        const response = await fetch("data/items.json");

        if (!response.ok) {
            throw new Error("Не удалось загрузить базу предметов");
        }

        const database = await response.json();

        allItems = database.filter(item =>
            item.name &&
            item.image &&
            item.description &&
            item.description.length > 10
        );

        if (allItems.length < 4) {
            throw new Error("Недостаточно предметов для тренировки");
        }

        console.log("Загружено предметов:", allItems.length);

        startButton.disabled = false;

        updateAmountInfo();

    } catch (error) {
        console.error(error);

        setupError.textContent =
            "Ошибка загрузки базы. Проверь data/items.json и локальный сервер.";

        startButton.disabled = true;
    }
}

// Обновление прогресс-бара
function updateProgress() {
    const percent = (currentQuestion / items.length) * 100;

    document.getElementById("question-number").textContent =
        `Вопрос ${currentQuestion + 1} из ${items.length}`;

    document.getElementById("progress-percent").textContent =
        `${Math.round(percent)}%`;

    document.getElementById("progress-fill").style.width =
        `${percent}%`;
}

// Загрузка вопроса
function loadQuestion() {
    answered = false;
    questionHadMistake = false;

    const item = items[currentQuestion];

    itemImage.innerHTML = `
        <img
            src="${item.image}"
            alt="${item.name}"
            style="width: 110px; height: 110px; object-fit: contain;"
        >
    `;

    itemName.textContent = item.name;

    feedback.textContent = "";
    feedback.className = "feedback";

    dropZone.className = "drop-zone";
    dropZone.innerHTML = "<span>Перетащи описание сюда</span>";

    nextButton.disabled = true;
    nextButton.textContent = "Следующий предмет →";

    updateProgress();

    const otherItems = shuffle(
        items.filter(other => other.id !== item.id)
    ).slice(0, 3);

    const answers = shuffle([
        {
            text: item.description,
            correct: true
        },
        ...otherItems.map(other => ({
            text: other.description,
            correct: false
        }))
    ]);

    answersList.innerHTML = "";

    answers.forEach((answer, index) => {
        const card = document.createElement("div");

        card.className = "answer-card";
        card.textContent = answer.text;
        card.draggable = true;

        card.addEventListener("click", () => {
            checkAnswer(answer, card);
        });

        card.addEventListener("dragstart", event => {
            if (answered) {
                event.preventDefault();
                return;
            }

            event.dataTransfer.setData(
                "text/plain",
                String(index)
            );
        });

        answersList.appendChild(card);
    });

    window.currentAnswers = answers;
}

// Проверка ответа
function checkAnswer(answer, card) {
    if (answered) return;

    if (answer.correct) {
        answered = true;
        score++;

        saveAnswerProgress(items[currentQuestion]);

        document.getElementById("score").textContent = score;

        feedback.textContent = "Правильно! Отличная работа.";
        feedback.className = "feedback correct";

        dropZone.className = "drop-zone correct";
        dropZone.textContent = answer.text;

        document.querySelectorAll(".answer-card").forEach(element => {
            element.classList.add("disabled");
        });

        nextButton.disabled = false;

    } else {
        questionHadMistake = true;

        feedback.textContent = "Неправильно! Попробуй ещё раз.";
        feedback.className = "feedback wrong";

        dropZone.className = "drop-zone wrong";
        card.classList.add("wrong");
    }
}

// Перетаскивание
dropZone.addEventListener("dragover", event => {
    event.preventDefault();

    if (!answered) {
        dropZone.classList.add("drag-over");
    }
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", event => {
    event.preventDefault();

    if (answered) return;

    dropZone.classList.remove("drag-over");

    const index = Number(
        event.dataTransfer.getData("text/plain")
    );

    const answer = window.currentAnswers?.[index];
    const card = answersList.children[index];

    if (answer && card) {
        checkAnswer(answer, card);
    }
});

// Следующий вопрос
nextButton.addEventListener("click", () => {
    currentQuestion++;

    if (currentQuestion >= items.length) {
        showResults();
    } else {
        loadQuestion();
    }
});

// Завершение тренировки
function showResults() {
    gameArea.innerHTML = `
        <div class="item-panel"
             style="grid-column: 1 / -1; text-align: center;">

            <div class="item-image">🏆</div>

            <h2>Тренировка завершена!</h2>

            <p class="item-hint">
                Правильных ответов: ${score} из ${items.length}
            </p>

            <button class="next-button" id="restart-button">
                Пройти ещё раз
            </button>
        </div>
    `;

    document.getElementById("progress-fill").style.width = "100%";
    document.getElementById("progress-percent").textContent = "100%";
    document.getElementById("question-number").textContent = "Завершено";

    document.getElementById("restart-button").addEventListener("click", () => {
        window.location.reload();
    });
}

// При открытии страницы скрываем тренировку до нажатия кнопки
trainingHeading.style.display = "none";
progressSection.style.display = "none";
gameArea.style.display = "none";

loadDatabase();