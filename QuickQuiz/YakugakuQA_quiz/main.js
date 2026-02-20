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
let selectedIndices = new Set(); // Track selected answers

// --- Data Configuration ---
let availableYears = [];
let groupedQuestions = {};
let isDataLoaded = false;
// const years = []; // Dynamic now
// const suffixes = []; // Not used for Yakugaku

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

    // Taboo logic commented out
    /*
    const tabooDisplay = document.getElementById('taboo-count-display');
    const tabooContainer = document.getElementById('taboo-result-container');
    if (tabooDisplay) {
        tabooDisplay.textContent = tabooCount;
        if (tabooContainer) {
            tabooContainer.style.display = 'block';
        }
    }
    */

    // Keep BGM playing


    showScreen('result');

    // Explicitly hide Feedback Overlay (Bug Fix)
    const feedbackOverlay = document.getElementById('feedback-overlay');
    feedbackOverlay.classList.remove('active');
    feedbackOverlay.classList.add('hidden');
    document.getElementById('choices-container').classList.add('hidden');
    document.getElementById('submit-answer-btn').classList.add('hidden');
    document.getElementById('push-btn').classList.add('hidden');
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
    selectedIndices.clear(); // Reset selections

    // Reset UI
    // Reset UI
    const question = currentQuestions[currentQuestionIndex];
    // Preprocess LaTeX in question text
    const processedQuestionText = preprocessLatex(question.question);
    questionText.innerHTML = ''; // Start empty for typewriter
    // For typeWriter, we might need raw text or handle HTML carefully.
    // Simpler approach: Just set text and render math later? 
    // Typewriter with HTML/LaTeX is hard. 
    // Let's use innerHTML for static display or textContent for typewriter?
    // If we want LaTeX in question text, typewriter might break it if it splits tags.
    // Compromise: Typewriter outputs raw text, then we render MathJax at the end?
    // Or: Just output everything at once if LaTeX is detected?
    // Let's try: typewriter writes raw text. If it looks like LaTeX, we render at finish.

    pushBtn.classList.remove('hidden'); // Show Push button
    choicesContainer.classList.add('hidden'); // Hide Choices
    document.getElementById('submit-answer-btn').classList.add('hidden'); // Hide Submit
    feedbackOverlay.classList.remove('active'); // Remove active class (critical for pause check)
    feedbackOverlay.classList.add('hidden'); // Hide Feedback
    pauseOverlay.classList.add('hidden');
    timerBar.style.width = '100%';
    timerBar.classList.remove('danger-timer'); // Reset color

    questionCountDisplay.textContent = `問 ${currentQuestionIndex + 1}/${currentQuestions.length}`;
    scoreDisplay.textContent = `正答数: ${correctCount}`;

    // Prepare choices
    const choices = question.choices;
    const indices = choices.map((_, i) => i);
    shuffleArray(indices);

    // Render choice buttons (but hidden)
    choicesContainer.innerHTML = '';
    indices.forEach(originalIndex => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        // Preprocess LaTeX in choices
        btn.innerHTML = preprocessLatex(choices[originalIndex]);
        btn.dataset.originalIndex = originalIndex;
        // btn.onclick = () => handleAnswer(originalIndex, btn); // Old single click
        btn.onclick = () => toggleChoice(originalIndex, btn);
        choicesContainer.appendChild(btn);
    });

    // Start text animation
    startTypeWriter(processedQuestionText, 0);
    // Note: RenderMathJax will be called after typewriter finishes or immediately for choices?
    // We should render choices immediately.
    renderMathJax();
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

            questionText.innerHTML += text.charAt(i); // Use innerHTML to be safe? TextContent might be safer for char by char.
            // Actually, if we have LaTeX `\( ... \)`, splitting it char by char looks bad until finished.
            // But standard behavior is char by char.
            // We'll rely on renderMathJax() at the end.
            i++;
            typeWriterIndex = i; // Update global index

            // If was at bottom, keep at bottom
            if (isAtBottom) {
                container.scrollTop = container.scrollHeight;
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

async function initSelectionScreen() {
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

    // Check if data is loaded
    if (!isDataLoaded) {
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.textContent = "データを読み込んでいます...";
        try {
            await loadYakugakuData();
            isDataLoaded = true;
            loadingIndicator.classList.add('hidden');
        } catch (e) {
            console.error(e);
            loadingIndicator.textContent = "データの読み込みに失敗しました。";
            return;
        }
    } else {
        loadingIndicator.classList.add('hidden');
    }

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

    // Render Buttons based on availableYears
    availableYears.forEach(year => {
        const yearInt = parseInt(year, 10);
        const seireki = yearInt + 1915; // 97回 -> 2012 (97+1915=2012)
        // Check: 109回 -> 2024 (109+1915=2024). Correct.

        const card = document.createElement('div');
        card.className = 'dataset-card';
        card.innerHTML = `
                <h3>${seireki}年</h3>
                <p>第${year}回 薬剤師国家試験</p>
            `;
        card.addEventListener('click', () => {
            handleDatasetSelection(card, { year: year }, groupedQuestions[year] || []);
        });
        datasetList.appendChild(card);
    });

    // Add Random Button
    const randomCard = document.createElement('div');
    randomCard.className = 'dataset-card';
    randomCard.innerHTML = `
            <h3>全年度</h3>
            <p>ランダム出題</p>
        `;
    randomCard.addEventListener('click', () => {
        // Gather all questions
        const allQ = Object.values(groupedQuestions).flat();
        handleDatasetSelection(randomCard, { year: "All" }, allQ);
    });
    datasetList.appendChild(randomCard);

    function handleDatasetSelection(cardElement, item, questions) {
        // Deselect others
        document.querySelectorAll('.dataset-card').forEach(c => c.classList.remove('selected'));
        // Select this
        cardElement.classList.add('selected');
        selectedYearItem = item;
        loadedQuestions = questions;

        if (loadedQuestions.length === 0) {
            alert('No valid questions found.');
            return;
        }

        // Update Slider
        slider.max = loadedQuestions.length;
        slider.value = Math.min(10, loadedQuestions.length);
        sliderValue.textContent = slider.value;

        // Show Settings & Enable Start
        settingsContainer.classList.remove('hidden');
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
        startBtn.style.cursor = 'pointer';
    }
    showScreen('selection');
}

function startQuiz() {
    const slider = document.getElementById('question-count-slider');
    const count = parseInt(slider.value, 10);

    // Shuffle and pick count
    // We want to shuffle `loadedQuestions` and take `count`
    // But `loadedQuestions` shouldn't be mutated securely? 
    // `shuffleArray` mutates. It's fine to mutate the cached array for this session?
    // Actually, if user goes back and starts again, we might want reshuffle.
    // So let's copy it.

    // Shuffle
    const shuffled = [...loadedQuestions];
    shuffleArray(shuffled);
    currentQuestions = shuffled.slice(0, count);

    // Start game
    currentQuestionIndex = 0;
    score = 0;
    correctCount = 0;
    incorrectCount = 0;
    tabooCount = 0;

    playBgm(gameBgmBuffer);

    loadQuestion();
    showScreen('quiz');
}

async function loadYakugakuData() {
    const metadataMap = new Map();
    groupedQuestions = {};
    availableYears = [];

    try {
        const [qResponse, mResponse] = await Promise.all([
            fetch('data/data.jsonl'),
            fetch('data/metadata.jsonl')
        ]);

        if (!qResponse.ok || !mResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        // Process Metadata
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

        // Process Questions
        const qText = await qResponse.text();
        const lines = qText.trim().split('\n');

        lines.forEach(line => {
            try {
                if (!line.trim()) return;
                const data = JSON.parse(line);
                const meta = metadataMap.get(data.problem_id) || {};

                // Filter: text_only AND no note in metadata
                // Note check: ensure note is empty or undefined
                const hasNote = meta.note && meta.note.trim().length > 0;

                // Allow multiple answers (answer.length >= 1)
                if (data.text_only && !hasNote && data.answer && data.answer.length >= 1) {
                    const year = data.problem_id.substring(0, 3); // e.g. "097"

                    if (!groupedQuestions[year]) {
                        groupedQuestions[year] = [];
                    }

                    groupedQuestions[year].push(transformQuestion(data, meta));
                }
            } catch (e) {
                console.error('JSON parse error', e);
            }
        });

        // Extract and sort years
        availableYears = Object.keys(groupedQuestions).sort();
        console.log("Loaded Years:", availableYears);

    } catch (e) {
        console.error("Error loading Yakugaku data:", e);
        throw e;
    }
}

function transformQuestion(data, meta) {
    // Answer is ["1", "3"]... Convert to [0, 2]
    let answerIndices = [];
    if (data.answer && data.answer.length > 0) {
        data.answer.forEach(ans => {
            const ansInt = parseInt(ans, 10);
            if (!isNaN(ansInt)) {
                answerIndices.push(ansInt - 1); // 1-based to 0-based
            }
        });
    }

    // Sort indices
    answerIndices.sort((a, b) => a - b);

    // Taboo Choices (Disabled)
    const tabooChoices = [];
    const tabooReason = "";

    return {
        id: data.problem_id,
        question: data.problem_text,
        choices: data.choices,
        correctIndices: answerIndices, // Array of correct indices
        explanation: data.comment || `正解は「${data.choices.filter((_, i) => answerIndices.includes(i)).join('」「')}」です。`,
        accuracy: "-",
        tabooChoices: tabooChoices,
        tabooReason: tabooReason
    };
}



function finishReading() {
    isTypographyFinished = true;

    // Apply LaTeX preprocessing to the full text now that it's done
    const question = currentQuestions[currentQuestionIndex];
    questionText.innerHTML = preprocessLatex(question.question);
    renderMathJax();

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
    choicesContainer.classList.remove('hidden');
    document.getElementById('submit-answer-btn').classList.remove('hidden');
}



function handleTimeout() {
    // Time ran out -> Incorrect
    showFeedback(false, null);
}

function toggleChoice(index, btn) {
    if (selectedIndices.has(index)) {
        selectedIndices.delete(index);
        btn.classList.remove('selected');
    } else {
        selectedIndices.add(index);
        btn.classList.add('selected');
    }
}

function submitAnswer() {
    clearInterval(timerInterval);
    const question = currentQuestions[currentQuestionIndex];

    // Convert sets to sorted arrays for comparison
    const userSelection = Array.from(selectedIndices).sort((a, b) => a - b);
    const correctSelection = question.correctIndices.sort((a, b) => a - b);

    // Check equality
    const isCorrect = JSON.stringify(userSelection) === JSON.stringify(correctSelection);

    showFeedback(isCorrect);
}

function handleAnswer(selectedIndex, btnElement) {
    // Deprecated but kept if needed for backward compatibility or simple modes
    // Not used in Yakugaku mode
}

function showFeedback(isCorrect) {
    const question = currentQuestions[currentQuestionIndex];
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackExplanation = document.getElementById('feedback-explanation');
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const choicesContainer = document.getElementById('choices-container');
    const submitBtn = document.getElementById('submit-answer-btn');

    // Hide controls
    submitBtn.classList.add('hidden');

    if (isCorrect) {
        correctCount++;
        score++; // Assuming score tracks correct answers
        feedbackTitle.textContent = "正解！";
        feedbackTitle.className = "correct-text";
    } else {
        incorrectCount++;
        feedbackTitle.textContent = "不正解...";
        feedbackTitle.className = "wrong-text";
    }

    // Highlight Answers
    Array.from(choicesContainer.children).forEach(btn => {
        const idx = parseInt(btn.dataset.originalIndex);

        // Mark correct answers
        if (question.correctIndices.includes(idx)) {
            btn.classList.add('correct');
        }
        // Mark wrong selections (if user selected it but it wasn't correct)
        else if (selectedIndices.has(idx)) {
            btn.classList.add('wrong');
        }
    });

    // Build Explanation Content
    let explanationText = question.explanation || "";

    // Add Correct Answer Display
    const correctChoices = question.correctIndices.map(i => question.choices[i]);
    // Preprocess LaTeX for choices in correct answer string
    const processedCorrectChoices = correctChoices.map(c => preprocessLatex(c));
    const correctAnswerString = `<strong>正解は「${processedCorrectChoices.join('」と「')}」です。</strong><br><br>`;

    explanationText = correctAnswerString + explanationText;

    // 1. Protect spaces after "Num:Correct/Incorrect" (e.g. "1:正　")
    explanationText = explanationText.replace(/(\d+:[正誤])([ 　])/g, '$1{{SPACE}}');

    // 2. Replace full-width spaces with <br> (as per previous request)
    explanationText = explanationText.replace(/　/g, '<br>');

    // 3. Replace newlines with <br>
    explanationText = explanationText.replace(/\n/g, '<br>');

    // 4. Restore protected spaces
    explanationText = explanationText.replace(/{{SPACE}}/g, '　');

    // 5. Ensure newline before "Num:Correct/Incorrect"
    // Use a unique marker to avoid infinite loops if we were replacing inside
    explanationText = explanationText.replace(/(\d+:[正誤])/g, '<br>$1');

    // Clean up potential double start
    if (explanationText.startsWith('<br>')) {
        explanationText = explanationText.substring(4);
    }

    // 6. Replace Number with Choice Content
    // Replace "1:Correct" with "「ChoiceContent」:Correct"
    if (question.choices) {
        explanationText = explanationText.replace(/(\d+)(:[正誤][ぁ-ん]*)/g, (match, digits, suffix) => {
            const idx = parseInt(digits, 10) - 1; // 1-based index
            if (idx >= 0 && idx < question.choices.length) {
                return `<br><strong>「${question.choices[idx]}」${suffix}</strong>`;
            }
            return match;
        });
    }

    let explanationHTML = `<p>${preprocessLatex(explanationText)}</p>`;

    // Accuracy
    if (question.accuracy && question.accuracy !== "-") {
        explanationHTML += `<div class="accuracy-info" style="margin-top: 10px; font-size: 0.9em; color: #555;">正答率: ${question.accuracy}%</div>`;
    }

    // Taboo Warning
    /*
    if (isTaboo) {
        const choiceText = selectedBtn ? selectedBtn.textContent : "";
        explanationHTML += `<div class="taboo-warning" style="margin-top: 10px; padding: 10px; background-color: #ffe6e6; border: 1px solid #d9534f; color: #d9534f; border-radius: 4px;"><strong>⚠️ 禁忌肢選択： 「${choiceText}」</strong><br>${question.tabooReason}</div>`;
    }
    */

    feedbackExplanation.innerHTML = explanationHTML;
    feedbackOverlay.classList.remove('hidden');
    feedbackOverlay.classList.add('active');

    renderMathJax();

    // Show Next Button
    const nextBtn = document.getElementById('next-question-btn');
    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.textContent = "結果へ";
    } else {
        nextBtn.textContent = "次へ";
    }
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

// --- Event Listeners ---
document.getElementById('start-btn').addEventListener('click', initSelectionScreen);
document.getElementById('back-to-title-btn').addEventListener('click', initTitleScreen);
document.getElementById('home-btn').addEventListener('click', initTitleScreen);

pushBtn.addEventListener('click', pushButtonHandler);
document.getElementById('submit-answer-btn').addEventListener('click', submitAnswer);

document.getElementById('next-question-btn').addEventListener('click', () => {
    nextQuestion();
});

// Initialize
initTitleScreen();


// --- Helpers ---
function preprocessLatex(text) {
    if (!text) return "";
    // 1. Replace chemical formulas / simple patterns
    // e.g. H_{2}O -> \( H_{2}O \)
    // Regex for basic LaTeX-like patterns: 
    // - Subscripts: _{...} or \d
    // - Superscripts: ^{...}
    // - Greek: \alpha, \beta...
    // - Operators: \times, \pm...

    // Simple heuristic: If it contains _{, ^{, or \, wrap widely?
    // Caution: Don't break HTML tags if any.
    // Yakugaku data seems to have raw LaTeX like "Ag_{2}CrO_{4}" without delimiters.

    // Regex to match "something_{...}" or "something^{...}"
    // Or just any string containing typical LaTeX syntax characters?

    // Specific replacements for common chemistry/math not using backslash sometimes?
    // Actually, data sample showed: "Ag_{2}CrO_{4}", "25^{\\circ} C"
    // We can try to wrap these in \( ... \).

    // Strategy: Look for sequence of char/numbers followed by _{...} or ^{...}
    // And also Greek letters if backslashed.

    // Let's rely on MathJax's auto-rendering if we configure it? 
    // But we need delimiters.

    // Replace patterns like:  [A-Za-z0-9\+\-\(\)]+ (_{.+?}| \^ {.+?})+
    // This is hard to perfect.
    // Simpler: If text contains _{ or ^{ or \\, wrap the whole chunk? 
    // No, might break text.

    // Regex to capture typical chemical/math tokens:
    // ([A-Za-z0-9]+(?:_\{[^}]+\}|\^\{[^}]+\})+)
    // Matches Ag_{2}CrO_{4}

    // Replace non-standard \micro with unicode µ (\u00B5) for better typewriter display
    let processed = text.replace(/\\micro/g, "\u00B5");
    processed = processed.replace(/\\times/g, "\u00D7");
    processed = processed.replace(/\\circ/g, "\u00B0");
    processed = processed.replace(/\\le/g, "\u2264");
    processed = processed.replace(/\\ge/g, "\u2265");
    processed = processed.replace(/\\ne/g, "\u2260");

    // 1. Match Chemical/Math parts with brace syntax
    // e.g. Ag_{2}, O^{2-}
    // Pattern:  Block of (Word chars) followed by (_{...} or ^{...} or both) repeated
    // Also include simple numbers? 

    // Regex:
    // (([A-Za-z0-9\+\-\[\]\(\)\.\s\\]+)?(?:_\{[^}]+\}|\^\{[^}]+\}|\\[A-Za-z]+|[A-Za-z]+)(?:_\{[^}]+\}|\^\{[^}]+\}|[A-Za-z0-9\+\-\[\]\(\)\.\s\\]*)*)

    processed = processed.replace(/(([A-Za-z0-9\+\-\[\]\(\)\.\s\\]*)(?:_\{[^}]+\}|\^\{[^}]+\}|\\[A-Za-z]+|[A-Za-z]+)(?:_\{[^}]+\}|\^\{[^}]+\}|[A-Za-z0-9\+\-\[\]\(\)\.\s\\]*)*)/g, function (match) {
        // Filter out matches that act just like normal text? 
        // If it strictly has _{ or ^{ or \\, it's good candidate.
        if (match.includes("_{") || match.includes("^{") || match.includes("\\")) {
            return `$${match}$`;
        }
        return match;
    });

    return processed;
}

function renderMathJax() {
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch((err) => console.log('MathJax error:', err));
    }
}
