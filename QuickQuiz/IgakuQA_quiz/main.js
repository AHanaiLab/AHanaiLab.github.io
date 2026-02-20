// --- State ---
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let correctCount = 0;
let incorrectCount = 0;
let tabooCount = 0;

// Timer & Animation State
let typeWriterInterval = null;
let timerInterval = null;
let timeLeft = 0;
const TOTAL_TIME = 60000; // 60 seconds
let isTypographyFinished = false; // Is the question fully displayed?
let isAnswering = false; // Has the user pushed or time ran out?
let isPaused = false;
let typeWriterIndex = 0; // Track typewriter progress
let selectedIndices = []; // Track selected indices for multiple answers

// --- Data Configuration ---
const years = [
    { year: 2018, prefix: '112' },
    { year: 2019, prefix: '113' },
    { year: 2020, prefix: '114' },
    { year: 2021, prefix: '115' },
    { year: 2022, prefix: '116' }
];
const suffixes = ['A', 'B', 'C', 'D', 'E', 'F'];

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
const pauseOverlay = document.getElementById('pause-overlay');
const timerBar = document.getElementById('timer-bar');
const questionCountDisplay = document.getElementById('question-count');
const scoreDisplay = document.getElementById('score-display');
const feedbackTitle = document.getElementById('feedback-title');
const feedbackExplanation = document.getElementById('feedback-explanation');
const submitAnswerBtn = document.getElementById('submit-answer-btn');
const freeAnswerContainer = document.getElementById('free-answer-container');
const freeAnswerInput = document.getElementById('free-answer-input');
const contextContainer = document.getElementById('context-container');

const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const retireBtn = document.getElementById('retire-btn');

// --- Web Audio API Setup ---
let audioContext = null;
let titleBgmBuffer = null;
let gameBgmBuffer = null;
let currentSource = null;
let currentBuffer = null;
let isGameBgmPlaying = false; // Track logical state

async function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
}

async function loadAudio(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
}

// Preload buffers
(async () => {
    try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        [titleBgmBuffer, gameBgmBuffer] = await Promise.all([
            loadAudio('Audio/maou_bgm_cyber13.mp3'),
            loadAudio('Audio/maou_bgm_cyber41.mp3')
        ]);
        // If loaded while on title screen, try playing
        if (titleBgmBuffer && document.getElementById('title-screen').classList.contains('active')) {
            playBgm(titleBgmBuffer);
        }
    } catch (e) {
        console.error("Audio Load Failed:", e);
    }
})();

function playBgm(buffer) {
    if (!audioContext || !buffer) return;

    // If same buffer is already playing, do nothing
    if (currentBuffer === buffer) return;

    // Stop current
    if (currentSource) {
        currentSource.stop();
        currentSource = null;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(audioContext.destination);
    source.start(0);
    currentSource = source;
    currentBuffer = buffer;
}

function stopBgm() {
    if (currentSource) {
        currentSource.stop();
        currentSource = null;
    }
    currentBuffer = null;
}

// --- Navigation Functions ---
function showScreen(screenId) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenId].classList.add('active');
}

function initTitleScreen() {
    showScreen('title');
    // Bind global buttons if not already bound
    pauseBtn.onclick = handlePause;
    resumeBtn.onclick = handleResume;
    retireBtn.onclick = handleRetire;

    // Handle Audio Context Resume on Interaction
    const interactionHandler = () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                if (!currentSource && titleBgmBuffer) {
                    playBgm(titleBgmBuffer);
                }
            });
        } else if (!currentSource && titleBgmBuffer) {
            playBgm(titleBgmBuffer);
        }
    };
    document.body.addEventListener('click', interactionHandler, { once: true });
    document.body.addEventListener('keydown', interactionHandler, { once: true });

    // Play Title BGM
    if (titleBgmBuffer) {
        playBgm(titleBgmBuffer);
    }
}

// ... (initSelectionScreen and startQuizForYear remain mostly same, just updating startQuizForYear to use modified functions) ...

// ...

// --- Pause/Resume/Retire ---

function handlePause() {
    if (isPaused || feedbackOverlay.classList.contains('active') || !screens.quiz.classList.contains('active')) return;

    isPaused = true;
    if (audioContext) audioContext.suspend();

    // Clear intervals
    clearInterval(typeWriterInterval);
    clearInterval(timerInterval);

    // Show overlay
    pauseOverlay.classList.remove('hidden');
}

function handleResume() {
    if (!isPaused) return;
    isPaused = false;
    pauseOverlay.classList.add('hidden');
    if (audioContext) audioContext.resume();

    // Resume Timer
    startTimer(timeLeft);

    // Resume Typewriter if needed
    if (!isTypographyFinished) {
        // We need the current question text again.
        const question = currentQuestions[currentQuestionIndex];
        startTypeWriter(question.question, typeWriterIndex);
    }
}

function handleRetire() {
    if (!confirm("本当にリタイアしますか？")) return;

    // End game
    isPaused = false;
    pauseOverlay.classList.add('hidden');
    clearInterval(typeWriterInterval);
    clearInterval(timerInterval);

    // Keep BGM playing (no action needed for Web Audio)

    showResultScreen();
}

function showResultScreen() {
    const totalAnswered = correctCount + incorrectCount;
    const finalScoreText = totalAnswered > 0
        ? `${Math.round((correctCount / totalAnswered) * 100)}%`
        : '--%';
    document.getElementById('final-score-percent').textContent = finalScoreText;
    document.getElementById('correct-count').textContent = correctCount;
    document.getElementById('incorrect-count').textContent = incorrectCount;
    const tabooDisplay = document.getElementById('taboo-count-display');
    const tabooContainer = document.getElementById('taboo-result-container');
    if (tabooDisplay) {
        tabooDisplay.textContent = tabooCount;
        if (tabooContainer) {
            tabooContainer.style.display = 'block';
        }
    }

    // Keep BGM playing


    showScreen('result');
}

// --- Core Game Functions ---

// ...

function loadQuestion() {
    // Reset state
    clearInterval(typeWriterInterval);
    clearInterval(timerInterval);
    isTypographyFinished = false;
    isAnswering = false;
    isPaused = false;
    typeWriterIndex = 0; // Reset index
    timeLeft = TOTAL_TIME;

    // Reset UI
    const question = currentQuestions[currentQuestionIndex];
    questionText.textContent = ''; // Clear text
    pushBtn.classList.remove('hidden'); // Show Push button
    choicesContainer.classList.add('hidden'); // Hide Choices
    freeAnswerContainer.classList.add('hidden'); // Hide Free Answer
    contextContainer.classList.add('hidden'); // Hide Context
    feedbackOverlay.classList.remove('active'); // Remove active class (critical for pause check)
    feedbackOverlay.classList.add('hidden'); // Hide Feedback
    pauseOverlay.classList.add('hidden');
    timerBar.style.width = '100%';
    timerBar.classList.remove('danger-timer'); // Reset color
    submitAnswerBtn.classList.add('hidden');
    selectedIndices = [];

    // Clear MathJax typeset for the container to avoid residual rendering
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([questionText]);
    }

    questionCountDisplay.textContent = `問 ${currentQuestionIndex + 1}/${currentQuestions.length}`;
    scoreDisplay.textContent = `正答数: ${correctCount}`;

    // Clear input
    freeAnswerInput.value = '';

    // Prepare choices (Clear if free answer)
    choicesContainer.innerHTML = '';
    if (!question.isFreeAnswer) {
        const choices = question.choices;
        const indices = choices.map((_, i) => i);
        shuffleArray(indices);

        // Render choice buttons (but hidden)
        indices.forEach(originalIndex => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerHTML = preprocessLatex(choices[originalIndex]); // Support LaTeX in choices
            btn.dataset.originalIndex = originalIndex;
            btn.onclick = () => toggleChoice(originalIndex, btn);
            choicesContainer.appendChild(btn);
        });
    }

    // Display Question
    questionText.textContent = '';

    // Set Context if available
    if (question.commonContext) {
        contextContainer.innerHTML = preprocessLatex(question.commonContext);
        contextContainer.classList.remove('hidden');
    } else {
        contextContainer.classList.add('hidden');
    }

    // Start text animation
    startTypeWriter(question.question, 0);
}

function startTypeWriter(text, startIndex = 0) {
    let i = startIndex;
    const speed = 50; // ms per char
    const container = document.querySelector('.question-container');

    // If there's a previous interval, clear it
    if (typeWriterInterval) clearInterval(typeWriterInterval);

    typeWriterInterval = setInterval(() => {
        if (i < text.length) {
            // Check if user is near bottom
            const isAtBottom = (container.scrollHeight - container.scrollTop <= container.clientHeight + 20);

            questionText.textContent += text.charAt(i);
            i++;
            typeWriterIndex = i; // Update global index

            // If was at bottom, keep at bottom
            if (isAtBottom) {
                container.scrollTop = container.scrollHeight;
            }

            // Apply MathJax if it's finished
            if (i === text.length) {
                if (window.MathJax && window.MathJax.typesetPromise) {
                    window.MathJax.typesetPromise([questionText]);
                }
            }
        } else {
            clearInterval(typeWriterInterval);
            finishReading();
        }
    }, speed);
}

// ...

function startTimer(duration = TOTAL_TIME) {
    if (timerInterval) clearInterval(timerInterval);

    timeLeft = duration;
    const startTime = Date.now();
    const endTime = startTime + timeLeft;

    timerInterval = setInterval(() => {
        const now = Date.now();
        timeLeft = endTime - now;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerBar.style.width = '0%';
            timerBar.classList.remove('danger-timer');
            handleTimeout();
        } else {
            const percent = (timeLeft / TOTAL_TIME) * 100;
            timerBar.style.width = `${percent}%`;

            // Turn red if 10 seconds or less
            if (timeLeft <= 10000) {
                timerBar.classList.add('danger-timer');
            } else {
                timerBar.classList.remove('danger-timer');
            }
        }
    }, 16); // ~60fps
}

// --- Selection & Game Logic ---

let selectedYearItem = null;
let loadedQuestions = []; // Store fetched questions

function initSelectionScreen() {
    datasetList.innerHTML = '';
    selectedYearItem = null;
    loadedQuestions = [];

    const startBtn = document.getElementById('description-start-btn');
    const settingsContainer = document.getElementById('question-settings');
    const slider = document.getElementById('question-count-slider');
    const sliderValue = document.getElementById('question-count-value');
    const loadingIndicator = document.getElementById('loading-indicator');

    // Reset UI
    startBtn.disabled = true;
    startBtn.textContent = "開始";
    startBtn.style.opacity = '0.5';
    startBtn.style.cursor = 'not-allowed';
    settingsContainer.classList.add('hidden');
    loadingIndicator.classList.add('hidden');

    // Bind Start Button
    startBtn.onclick = () => {
        if (selectedYearItem && loadedQuestions.length > 0) {
            startQuiz();
        }
    };

    // Bind Slider
    slider.oninput = () => {
        sliderValue.textContent = slider.value;
    };

    years.forEach(item => {
        const card = document.createElement('div');
        card.className = 'dataset-card';
        card.innerHTML = `
                <h3>${item.year}年</h3>
                <p>第${item.prefix}回 医師国家試験</p>
            `;
        card.addEventListener('click', async () => {
            // Deselect others
            document.querySelectorAll('.dataset-card').forEach(c => c.classList.remove('selected'));
            // Select this
            card.classList.add('selected');
            selectedYearItem = item;

            // UI Feedback
            startBtn.disabled = true;
            settingsContainer.classList.add('hidden');
            loadingIndicator.classList.remove('hidden');
            loadingIndicator.textContent = `${item.year}年の問題を読み込んでいます...`;

            // Fetch Data
            try {
                loadedQuestions = await fetchQuestionsForYear(item.prefix);

                if (loadedQuestions.length === 0) {
                    alert('No valid questions found for this year.');
                    loadingIndicator.classList.add('hidden');
                    return;
                }

                // Update Slider
                slider.max = loadedQuestions.length;
                slider.value = Math.min(10, loadedQuestions.length); // Default to 10 or max
                sliderValue.textContent = slider.value;

                // Show Settings & Enable Start
                loadingIndicator.classList.add('hidden');
                settingsContainer.classList.remove('hidden');
                startBtn.disabled = false;
                startBtn.style.opacity = '1';
                startBtn.style.cursor = 'pointer';

            } catch (e) {
                console.error(e);
                loadingIndicator.textContent = "読み込みに失敗しました。";
            }
        });
        datasetList.appendChild(card);
    });

    // Add Random All Years Button
    const randomCard = document.createElement('div');
    randomCard.className = 'dataset-card';
    randomCard.innerHTML = `
            <h3>全年度</h3>
            <p>ランダム出題</p>
        `;
    randomCard.addEventListener('click', async () => {
        // Deselect others
        document.querySelectorAll('.dataset-card').forEach(c => c.classList.remove('selected'));
        // Select this
        randomCard.classList.add('selected');
        selectedYearItem = { year: "All", prefix: "All" };

        // UI Feedback
        startBtn.disabled = true;
        settingsContainer.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.textContent = `全年度の問題を読み込んでいます...`;

        // Fetch Data for all years
        try {
            const allPromises = years.map(item => fetchQuestionsForYear(item.prefix));
            const allYearQuestions = await Promise.all(allPromises);
            loadedQuestions = allYearQuestions.flat();

            if (loadedQuestions.length === 0) {
                alert('No valid questions found.');
                loadingIndicator.classList.add('hidden');
                return;
            }

            // Update Slider
            slider.max = loadedQuestions.length;
            slider.value = Math.min(10, loadedQuestions.length);
            sliderValue.textContent = slider.value;

            // Show Settings & Enable Start
            loadingIndicator.classList.add('hidden');
            settingsContainer.classList.remove('hidden');
            startBtn.disabled = false;
            startBtn.style.opacity = '1';
            startBtn.style.cursor = 'pointer';

        } catch (e) {
            console.error(e);
            loadingIndicator.textContent = "読み込みに失敗しました。";
        }
    });
    datasetList.appendChild(randomCard);

    showScreen('selection');
}

function startQuiz() {
    const slider = document.getElementById('question-count-slider');
    const count = parseInt(slider.value, 10);
    const prefix = selectedYearItem.prefix; // Get prefix from selectedYearItem

    // Filter by prefix
    let selectedPool = [];
    if (prefix === 'All') { // Changed from 'all' to 'All' to match selectedYearItem.prefix
        selectedPool = loadedQuestions;
    } else {
        selectedPool = loadedQuestions.filter(q => q.id.startsWith(prefix));
    }

    if (selectedPool.length === 0) {
        alert('該当する問題がありません。');
        return;
    }

    // --- Linked Question Grouping ---
    // 1. Group questions into units
    const units = [];
    let i = 0;
    while (i < selectedPool.length) {
        const q = selectedPool[i];
        if (q.groupContext) {
            // Find all members of this group
            const group = [q];
            let j = i + 1;
            while (j < selectedPool.length && selectedPool[j].groupContext === q.groupContext) {
                group.push(selectedPool[j]);
                j++;
            }
            units.push(group);
            i = j;
        } else {
            units.push([q]);
            i++;
        }
    }

    // 2. Shuffle Units
    shuffleArray(units);

    // 3. Take units until we reach the target count
    const pickedQuestions = [];
    let currentCount = 0;
    for (const unit of units) {
        pickedQuestions.push(...unit);
        currentCount += unit.length;
        if (currentCount >= count) break;
    }

    currentQuestions = pickedQuestions;
    currentQuestionIndex = 0;
    score = 0;
    correctCount = 0;
    incorrectCount = 0;
    tabooCount = 0;

    playBgm(gameBgmBuffer);
    loadQuestion();
    showScreen('quiz');
}

function processLoadedQuestions(questions) {
    // 1. Sort by ID numerically
    questions.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

    // 2. Detect and assign group context
    let i = 0;
    while (i < questions.length) {
        const q = questions[i];
        // Match: "次の文を読み、[数字][区切り][数字]の問いに答えよ。"
        // Supports ～, 、 , ・ , etc. as separators
        const match = q.originalText.match(/^次の文を読み、(\d+)[^0-9]+(\d+)の問いに答えよ。([\s\S]*)/);

        if (match) {
            const startNum = parseInt(match[1]);
            const endNum = parseInt(match[2]);
            const fullBlock = match[3];

            // Heuristic: split background and specific question
            let lastPeriodIndex = fullBlock.lastIndexOf('。', fullBlock.length - 2);
            if (lastPeriodIndex === -1) lastPeriodIndex = fullBlock.lastIndexOf('?', fullBlock.length - 2);

            let background = fullBlock;
            let specificQuestion = fullBlock;

            if (lastPeriodIndex !== -1) {
                background = fullBlock.substring(0, lastPeriodIndex + 1);
                specificQuestion = fullBlock.substring(lastPeriodIndex + 1).trim();
            }

            // Assign to first member
            q.commonContext = background;
            q.question = preprocessLatex(specificQuestion); // Override with specific question
            q.groupContext = q.id; // Unique group ID

            let j = i + 1;
            while (j < questions.length) {
                const nextQ = questions[j];
                const nextNumMatch = nextQ.id.match(/\d+$/);
                const nextNum = nextNumMatch ? parseInt(nextNumMatch[0]) : 0;

                if (nextNum > startNum && nextNum <= endNum) {
                    nextQ.commonContext = background;
                    nextQ.groupContext = q.id;
                    j++;
                } else {
                    break;
                }
            }
            i = j;
        } else {
            i++;
        }
    }
}

async function fetchQuestionsForYear(prefix) {
    const allQuestions = [];
    const metadataMap = new Map();

    const promises = suffixes.map(async suffix => {
        try {
            // Fetch Question Data & Metadata in parallel
            const [qResponse, mResponse] = await Promise.all([
                fetch(`data/${prefix}-${suffix}.jsonl`),
                fetch(`data/${prefix}-${suffix}_metadata.jsonl`)
            ]);

            // Process Metadata first (if available)
            if (mResponse.ok) {
                const mText = await mResponse.text();
                mText.trim().split('\n').forEach(line => {
                    try {
                        if (!line.trim()) return;
                        const data = JSON.parse(line);
                        metadataMap.set(data.problem_id, data);
                    } catch (e) {
                        console.error('Metadata parse error', e);
                    }
                });
            }

            // Process Questions
            if (qResponse.ok) {
                const qText = await qResponse.text();
                const lines = qText.trim().split('\n');
                lines.forEach(line => {
                    try {
                        if (!line.trim()) return;
                        const data = JSON.parse(line);
                        // Filter: Must have at least 1 answer AND be text_only
                        if (data.answer && data.answer.length >= 1 && data.text_only) {
                            allQuestions.push(transformQuestion(data, metadataMap));
                        }
                    } catch (e) {
                        console.error('JSON parse error', e);
                    }
                });
            }
        } catch (e) {
            console.error(`Failed to fetch ${prefix}-${suffix}`, e);
        }
    });

    await Promise.all(promises);
    processLoadedQuestions(allQuestions);
    return allQuestions;
}

function transformQuestion(data, metadataMap) {
    const answerMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7, 'i': 8, 'j': 9 };
    const meta = metadataMap.get(data.problem_id) || {};
    const accuracy = meta.human_accuracy || "-";
    const tabooReason = meta.reason || "";

    const isFreeAnswer = !data.choices || data.choices.length === 0;

    // Taboo Choices
    const tabooChoices = (meta.kinki || []).map(k => {
        return k.split('').map(char => answerMap[char]);
    }).flat().filter(i => i !== undefined);

    // LaTeX Preprocessing
    const questionTextProcessed = preprocessLatex(data.problem_text);

    let answerIndices = [];
    let correctAnswers = [];

    if (isFreeAnswer) {
        correctAnswers = data.answer.map(ans => ans.trim());
    } else {
        // Answer Indices
        answerIndices = data.answer.map(ans => answerMap[ans] !== undefined ? answerMap[ans] : -1).filter(idx => idx !== -1);
        answerIndices.sort((a, b) => a - b);
    }

    return {
        id: data.problem_id,
        question: questionTextProcessed,
        choices: data.choices || [],
        correctIndices: answerIndices,
        correctAnswers: correctAnswers,
        isFreeAnswer: isFreeAnswer,
        originalText: data.problem_text, // Keep for grouping detection
        explanation: isFreeAnswer ?
            `正解は「${correctAnswers.join('」「')}」です。` :
            `正解は「${answerIndices.map(idx => data.choices[idx]).join('」「')}」です。`,
        accuracy: accuracy,
        tabooChoices: tabooChoices,
        tabooReason: tabooReason,
        commonContext: null // Will be populated during quiz start if part of a group
    };
}

function normalizeText(str) {
    if (!str) return "";
    return str.replace(/[！-～]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    }).replace(/　/g, ' ').trim().toLowerCase();
}



function finishReading() {
    isTypographyFinished = true;
    if (!isAnswering) {
        startTimer();
        transitionToAnswering();
    }
}

function pushButtonHandler() {
    if (isAnswering) return;

    // Stop text
    clearInterval(typeWriterInterval);

    // Transition to answering
    transitionToAnswering();
    startTimer(); // Start timer immediately on push
}

function transitionToAnswering() {
    isAnswering = true;
    pushBtn.classList.add('hidden');
    const question = currentQuestions[currentQuestionIndex];
    if (question.isFreeAnswer) {
        freeAnswerContainer.classList.remove('hidden');
        freeAnswerInput.focus();
    } else {
        choicesContainer.classList.remove('hidden');
    }
    submitAnswerBtn.classList.remove('hidden');
}



function handleTimeout() {
    // Time ran out -> Incorrect
    showFeedback(false, null);
}

function toggleChoice(index, btn) {
    if (!isAnswering) return;

    const idx = selectedIndices.indexOf(index);
    if (idx > -1) {
        selectedIndices.splice(idx, 1);
        btn.classList.remove('selected');
    } else {
        selectedIndices.push(index);
        btn.classList.add('selected');
    }
}

function submitAnswer() {
    clearInterval(timerInterval);
    const question = currentQuestions[currentQuestionIndex];

    let isCorrect = false;
    let isTaboo = false;

    if (question.isFreeAnswer) {
        const userInput = normalizeText(freeAnswerInput.value);
        isCorrect = question.correctAnswers.some(ans => normalizeText(ans) === userInput);
    } else {
        if (selectedIndices.length === 0) {
            alert("回答を選択してください。");
            return;
        }

        // Check if any selected is Taboo
        const selectedTaboos = selectedIndices.filter(idx => question.tabooChoices.includes(idx));
        isTaboo = selectedTaboos.length > 0;

        // Check if exactly matches correctIndices
        isCorrect = selectedIndices.length === question.correctIndices.length &&
            selectedIndices.every(idx => question.correctIndices.includes(idx));
    }

    showFeedback(isCorrect, isTaboo, null); // selectedBtn param no longer used for single highlight
}

function handleAnswer(selectedIndex, btnElement) {
    // This function is replaced by toggleChoice + submitAnswer
    // Kept to avoid errors if referenced elsewhere, but updated logic
    selectedIndices = [selectedIndex];
    submitAnswer();
}

function showFeedback(isCorrect, isTaboo, selectedBtn) {
    const question = currentQuestions[currentQuestionIndex];
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackExplanation = document.getElementById('feedback-explanation');
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const choicesContainer = document.getElementById('choices-container');

    if (isCorrect) {
        correctCount++;
        score++; // Assuming score tracks correct answers
        feedbackTitle.textContent = "正解！";
        feedbackTitle.className = "correct-text";
        // Highlight selected buttons as correct
        Array.from(choicesContainer.children).forEach(btn => {
            const idx = parseInt(btn.dataset.originalIndex);
            if (selectedIndices.includes(idx)) {
                btn.classList.add('correct');
            }
        });
    } else {
        incorrectCount++;
        if (isTaboo) {
            tabooCount++;
            feedbackTitle.textContent = "不正解 (禁忌肢)";
        } else {
            feedbackTitle.textContent = "不正解...";
        }
        feedbackTitle.className = "wrong-text";

        // Highlight selected buttons: if in correctIndices -> correct, else incorrect
        Array.from(choicesContainer.children).forEach(btn => {
            const idx = parseInt(btn.dataset.originalIndex);
            if (selectedIndices.includes(idx)) {
                if (question.correctIndices.includes(idx)) {
                    btn.classList.add('correct');
                } else {
                    btn.classList.add('incorrect');
                }
            } else if (question.correctIndices.includes(idx)) {
                // Also highlight correct ones that weren't selected
                btn.classList.add('correct');
                btn.classList.add('faded');
            }
        });
    }

    // Build Explanation Content
    let explanationHTML = `<p>${question.explanation}</p>`;

    // Accuracy
    if (question.accuracy && question.accuracy !== "-") {
        explanationHTML += `<div class="accuracy-info" style="margin-top: 10px; font-size: 0.9em; color: #555;">正答率: ${question.accuracy}%</div>`;
    }

    // Taboo Warning
    if (isTaboo) {
        explanationHTML += `<div class="taboo-warning" style="margin-top: 10px; padding: 10px; background-color: #ffe6e6; border: 1px solid #d9534f; color: #d9534f; border-radius: 4px;"><strong>⚠️ 禁忌肢選択</strong><br>${question.tabooReason}</div>`;
    }

    feedbackExplanation.innerHTML = explanationHTML;

    // Apply MathJax to explanation
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([feedbackExplanation]);
    }

    feedbackOverlay.classList.remove('hidden');
    feedbackOverlay.classList.add('active');

    // Show Next Button
    const nextBtn = document.getElementById('next-question-btn');
    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.textContent = "結果へ";
    } else {
        nextBtn.textContent = "次へ";
    }
    nextBtn.onclick = nextQuestion;
    nextBtn.focus();
}

// --- Next Question Logic ---
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        showResultScreen();
    }
}

// --- Utils ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- Helpers ---
function preprocessLatex(text) {
    if (!text) return "";
    let processed = text;
    // Standard MathJax $...$ or \(...\) is already handled if the text contains them.
    // However, the data often uses <sup> and <sub> or specific chars.
    // If the data uses \( \) specifically, we ensure it's preserved.
    // Some Yakugaku data uses <br> but Igaku data seems to have \n.

    // Handle common superscript/subscript if needed (though MathJax is preferred)
    // If we want to force everything into LaTeX:
    // processed = processed.replace(/(\d+)(st|nd|rd|th)/g, "$1^{$2}"); 

    return processed;
}

// --- Event Listeners ---
document.getElementById('start-btn').addEventListener('click', initSelectionScreen);
document.getElementById('back-to-title-btn').addEventListener('click', initTitleScreen);
document.getElementById('home-btn').addEventListener('click', initTitleScreen);

pushBtn.addEventListener('click', pushButtonHandler);
submitAnswerBtn.addEventListener('click', submitAnswer);

freeAnswerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !isPaused && isAnswering) {
        submitAnswer();
    }
});

// Redundant listener removed: next-question-btn.onclick is set in showFeedback

// Initialize
initTitleScreen();
