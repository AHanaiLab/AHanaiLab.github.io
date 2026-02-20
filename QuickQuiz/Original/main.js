document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentDataset = null;
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    // Timer & Animation State
    let typeWriterInterval = null;
    let timerInterval = null;
    let timeLeft = 0;
    const TOTAL_TIME = 7000; // 7 seconds
    let isTypographyFinished = false; // Is the question fully displayed?
    let isAnswering = false; // Has the user pushed or time ran out?

    // --- DOM Elements ---
    const screens = {
        title: document.getElementById('title-screen'),
        selection: document.getElementById('selection-screen'),
        quiz: document.getElementById('quiz-screen'),
        result: document.getElementById('result-screen')
    };

    const datasetList = document.getElementById('dataset-list');
    const questionText = document.getElementById('question-text');
    const pushBtn = document.getElementById('push-btn');
    const choicesContainer = document.getElementById('choices-container');
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const timerBar = document.getElementById('timer-bar');
    const questionCountDisplay = document.getElementById('question-count');
    const scoreDisplay = document.getElementById('score-display');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackExplanation = document.getElementById('feedback-explanation');

    // --- Navigation Functions ---
    function showScreen(screenId) {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });
        screens[screenId].classList.add('active');
    }

    function initTitleScreen() {
        showScreen('title');
    }

    function initSelectionScreen() {
        datasetList.innerHTML = '';
        datasets.forEach(dataset => {
            const card = document.createElement('div');
            card.className = 'dataset-card';
            card.innerHTML = `
                <h3>${dataset.title}</h3>
                <p>${dataset.description}</p>
                <p>全${dataset.questions.length}問</p>
            `;
            card.addEventListener('click', () => startQuiz(dataset));
            datasetList.appendChild(card);
        });
        showScreen('selection');
    }

    // --- Core Game Functions ---

    function startQuiz(dataset) {
        currentDataset = dataset;
        currentQuestions = [...dataset.questions];
        // Shuffle questions
        shuffleArray(currentQuestions);

        currentQuestionIndex = 0;
        score = 0;
        correctCount = 0;
        incorrectCount = 0;

        loadQuestion();
        showScreen('quiz');
    }

    function loadQuestion() {
        // Reset state
        clearInterval(typeWriterInterval);
        clearInterval(timerInterval);
        isTypographyFinished = false;
        isAnswering = false;

        // Reset UI
        const question = currentQuestions[currentQuestionIndex];
        questionText.textContent = ''; // Clear text
        pushBtn.classList.remove('hidden'); // Show Push button
        choicesContainer.classList.add('hidden'); // Hide Choices
        feedbackOverlay.classList.add('hidden'); // Hide Feedback
        timerBar.style.width = '100%';

        questionCountDisplay.textContent = `Q. ${currentQuestionIndex + 1}/${currentQuestions.length}`;
        scoreDisplay.textContent = `Score: ${correctCount}`; // Points logic could be added

        // Prepare choices (don't show yet)
        const choices = [...question.choices];
        // Note: choices are already strings.
        // We need to store original indices to know which one is correct?
        // Actually, the dataset has 'correctIndex' which refers to the original order.
        // If we shuffle choices, we need to map the correct answer.
        // Let's create an object array for choices to track indices.
        const choiceObjects = choices.map((text, index) => ({ text, originalIndex: index }));

        // Render choice buttons (but hidden)
        choicesContainer.innerHTML = '';
        choiceObjects.forEach((choiceObj, index) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choiceObj.text;
            btn.onclick = () => handleAnswer(choiceObj.originalIndex, btn);
            choicesContainer.appendChild(btn);
        });

        // Start text animation
        startTypeWriter(question.question);
    }

    function startTypeWriter(text) {
        let i = 0;
        const speed = 100; // ms per char

        // If there's a previous interval, clear it
        if (typeWriterInterval) clearInterval(typeWriterInterval);

        typeWriterInterval = setInterval(() => {
            if (i < text.length) {
                questionText.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeWriterInterval);
                finishReading();
            }
        }, speed);
    }

    function finishReading() {
        isTypographyFinished = true;
        // Text finished. If user hasn't pushed, start timer automatically?
        // Prompt: "問題文がすべて表示されてから7秒間のカウントダウンが始まります"
        if (!isAnswering) {
            startTimer();
            // Should we show choices now?
            // "ユーザーが早押しボタンを押すと... 答えを4つの選択肢から一つ選びます"
            // If they DON'T push, and text finishes, do choices appear?
            // Implicitly yes, otherwise they can't answer.
            // Also, usually "Push" means "I know it!". waiting means "I'm listening".
            // Once listening is done, everyone enters "answering" phase.
            transitionToAnswering();
        }
    }

    function pushButtonHandler() {
        if (isAnswering) return; // Already pushed or answering

        // Stop text
        clearInterval(typeWriterInterval);

        // Transition to answering
        transitionToAnswering();
        startTimer(); // Start timer immediately on push
    }

    function transitionToAnswering() {
        isAnswering = true;
        pushBtn.classList.add('hidden');
        choicesContainer.classList.remove('hidden');
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);

        const startTime = Date.now();
        const endTime = startTime + TOTAL_TIME;

        timerInterval = setInterval(() => {
            const now = Date.now();
            const remaining = endTime - now;

            if (remaining <= 0) {
                clearInterval(timerInterval);
                timerBar.style.width = '0%';
                handleTimeout();
            } else {
                const percent = (remaining / TOTAL_TIME) * 100;
                timerBar.style.width = `${percent}%`;
            }
        }, 16); // ~60fps
    }

    function handleTimeout() {
        // Time ran out -> Incorrect
        showFeedback(false, null);
    }

    function handleAnswer(selectedIndex, btnElement) {
        clearInterval(timerInterval);

        const question = currentQuestions[currentQuestionIndex];
        const isCorrect = (selectedIndex === question.correctIndex);

        showFeedback(isCorrect, btnElement);
    }

    function showFeedback(isCorrect, selectedBtn) {
        const question = currentQuestions[currentQuestionIndex];

        // Highlight logic
        const choiceBtns = document.querySelectorAll('.choice-btn');
        choiceBtns.forEach(btn => {
            // Reconstruct the index check.
            // Actually, we bound the click handler with originalIndex.
            // We need to find the button that corresponds to the Correct Index to highlight it.
            // Wait, we can iterate and check text? Or better, store originalIndex on dataset.
            // But we didn't store it on DOM.
            // Let's rely on the text content matching (assuming unique answers) OR simpler:
            // The handler passed `selectedIndex` and `btnElement`.

            // To highlight the correct one, we need to know which button corresponds to question.correctIndex.
            // Since we didn't shuffle the choices in the DOM (we displayed them 0..3), 
            // wait, in loadQuestion I did: `const choices = [...question.choices];` NO SHUFFLE THERE.
            // "choices" in the dataset are in order 0, 1, 2, 3.
            // So default order is preserved.
            // Thus, btn index `n` corresponds to choice `n`.
            // So `selectedIndex` IS the DOM index.

            // Wait, let's verify `loadQuestion`.
            // `const choices = [...question.choices];` -> Copied array.
            // `const choiceObjects = choices.map(...)` -> Mapped.
            // `choiceObjects.forEach` -> Appended to DOM in order.
            // So DOM order === dataset order.
            // `handleAnswer` passed `originalIndex`.

            // So:
            const domIndex = Array.from(choiceBtns).indexOf(btn);
            if (domIndex === question.correctIndex) {
                btn.classList.add('correct');
            } else if (btn === selectedBtn && !isCorrect) {
                btn.classList.add('incorrect');
            } else {
                btn.classList.add('faded');
            }
        });

        if (isCorrect) {
            correctCount++;
            feedbackTitle.textContent = "正解！";
            feedbackTitle.style.color = "#4CAF50";
        } else {
            incorrectCount++;
            feedbackTitle.textContent = "不正解...";
            feedbackTitle.style.color = "#F44336";
        }

        feedbackExplanation.textContent = question.explanation;
        feedbackOverlay.classList.remove('hidden');
    }

    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuestions.length) {
            loadQuestion();
        } else {
            showResult();
        }
    }

    function showResult() {
        showScreen('result');
        const total = currentQuestions.length;
        const percent = Math.round((correctCount / total) * 100);

        document.getElementById('final-score-percent').textContent = `${percent}%`;
        document.getElementById('correct-count').textContent = correctCount;
        document.getElementById('incorrect-count').textContent = incorrectCount;
    }

    // --- Utils ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- Event Listeners ---
    document.getElementById('start-btn').addEventListener('click', initSelectionScreen);
    document.getElementById('back-to-title-btn').addEventListener('click', initTitleScreen);
    document.getElementById('home-btn').addEventListener('click', initTitleScreen);

    pushBtn.addEventListener('click', pushButtonHandler);

    document.getElementById('next-question-btn').addEventListener('click', () => {
        nextQuestion();
    });

    // Initialize
    initTitleScreen();
});
