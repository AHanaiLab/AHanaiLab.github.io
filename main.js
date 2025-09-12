// ===============================
// 音声以外の部分
// ===============================

// スライダー操作
function enableFullDrag(slider) {
    let dragging = false;
    function updateValue(clientX) {
        const rect = slider.getBoundingClientRect();
        const percent = (clientX - rect.left) / rect.width;
        const newValue = slider.min * 1 + (slider.max - slider.min) * percent;
        slider.value = Math.min(slider.max, Math.max(slider.min, newValue));
        slider.dispatchEvent(new Event("input", { bubbles: true }));
    }
    slider.addEventListener("mousedown", (e) => {
        if (e.target === slider) {
            dragging = true;
            updateValue(e.clientX);
            e.preventDefault();
        }
    });
    window.addEventListener("mousemove", (e) => {
        if (dragging) updateValue(e.clientX);
    });
    window.addEventListener("mouseup", () => dragging = false);
    slider.addEventListener("touchstart", (e) => {
        if (e.target === slider) {
            dragging = true;
            updateValue(e.touches[0].clientX);
            e.preventDefault();
        }
    });
    slider.addEventListener("touchmove", (e) => {
        if (dragging) {
            updateValue(e.touches[0].clientX);
            e.preventDefault();
        }
    });
    slider.addEventListener("touchend", () => dragging = false);
}
["bgm-volume", "se-volume", "voice-volume"].forEach(id => {
    enableFullDrag(document.getElementById(id));
});

// モーダル操作
const toggleBtn = document.getElementById("toggle-panel-btn");
const modalOverlay = document.getElementById("modal-overlay");
const closeBtn = document.getElementById("close-modal-btn");
toggleBtn.addEventListener("click", () => modalOverlay.style.display = "block");
closeBtn.addEventListener("click", () => modalOverlay.style.display = "none");
modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.style.display = "none";
});

// 説明モーダル制御
const infoBtn = document.getElementById("info-btn");
const infoModal = document.getElementById("info-modal");
const closeInfoBtn = document.getElementById("close-info-btn");

infoBtn.addEventListener("click", () => {
    infoModal.style.display = "block";
});

closeInfoBtn.addEventListener("click", () => {
    infoModal.style.display = "none";
});

infoModal.addEventListener("click", (e) => {
    if (e.target === infoModal) infoModal.style.display = "none"; // 背景クリックで閉じる
});


// 設定値
const sets = 8;
const workTime = 20;
const restTime = 10;

// スクリーン常時点灯
let wakeLock = null;
async function requestWakeLock() {
    try { wakeLock = await navigator.wakeLock.request("screen"); }
    catch (err) { }
}
async function releaseWakeLock() {
    if (wakeLock) { await wakeLock.release(); wakeLock = null; }
}

// シーケンス生成
let sequence = [];
for (let i = 0; i < sets; i++) {
    sequence.push({ name: `ワーク ${i + 1}`, duration: workTime });
    if (i < sets - 1) sequence.push({ name: `休憩 ${i + 1}`, duration: restTime });
}

// タイマー制御用変数
let current = 0;
let remaining = sequence[0].duration;
let paused = false;
let elapsed = 0;
let countdownInterval = null;
let animationId = null;
let startTime = null;
let previousSecond = null;
let pausedElapsed = 0;

// DOM要素取得
const nameEl = document.getElementById("exercise-name");
const timerEl = document.getElementById("timer");
const pauseBtn = document.getElementById("pause-btn");
const totalTimerEl = document.getElementById("total-timer");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");

const bgmVolumeSlider = document.getElementById("bgm-volume");
const bgmVolumeDisplay = document.getElementById("bgm-volume-display");
const seVolumeSlider = document.getElementById("se-volume");
const seVolumeDisplay = document.getElementById("se-volume-display");
const voiceSlider = document.getElementById("voice-volume");
const voiceDisplay = document.getElementById("voice-volume-display");

// 音量スライダー連携
bgmVolumeSlider.addEventListener("input", () => {
    window.AudioModule.setBGMVolume(parseFloat(bgmVolumeSlider.value));
    bgmVolumeDisplay.textContent = parseFloat(bgmVolumeSlider.value).toFixed(2);
});
seVolumeSlider.addEventListener("input", () => {
    window.AudioModule.setSEVolume(parseFloat(seVolumeSlider.value));
    seVolumeDisplay.textContent = parseFloat(seVolumeSlider.value).toFixed(2);
});
voiceSlider.addEventListener("input", () => {
    window.AudioModule.setVoiceVolume(parseFloat(voiceSlider.value));
    voiceDisplay.textContent = parseFloat(voiceSlider.value).toFixed(2);
});

// BGM
window.AudioModule.loadBGM('assets/bgm/MOCHIKO_POISON.wav');

Object.entries(window.AudioModule.seFiles).forEach(([name, url]) => {
    window.AudioModule.loadSE(name, url);
});
Object.entries(window.AudioModule.voiceFiles).forEach(([name, url]) => {
    window.AudioModule.loadVoice(name, url);
});

// タイマー計算・円形進捗初期化
const totalDuration = sequence.reduce((acc, cur) => acc + cur.duration, 0);
const circle = document.querySelector(".progress-ring__circle");
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
circle.style.strokeDasharray = `${circumference}`;
circle.style.strokeDashoffset = `${circumference}`;
function setProgress(percent) {
    circle.style.strokeDashoffset = circumference - (percent / 100) * circumference;
}
function vibrate() {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}
function updateDisplay() {
    const displayRemaining = Math.ceil(remaining);
    timerEl.textContent = String(displayRemaining).padStart(2, '0');
    nameEl.textContent = sequence[current]?.name || "完了！";
    const totalRemaining = Math.ceil(totalDuration - elapsed);
    const min = Math.floor(totalRemaining / 60);
    const sec = String(totalRemaining % 60).padStart(2, '0');
    totalTimerEl.textContent = `${min}:${sec}`;
    const totalElapsed = Math.min(elapsed, totalDuration);
    const percent = (totalElapsed / totalDuration) * 100;
    progressBar.style.width = `${percent.toFixed(2)}%`;
}



const progressBar = document.getElementById("progress-bar");

// animateProgress
let workVoicePlayed = false, restVoicePlayed = false, endVoicePlayed = false;
function playWorkVoice(index) {
    const key = `v${index}`;
    window.AudioModule.playVoice(key);
}
function animateProgress(timestamp) {
    if (!startTime) startTime = timestamp;
    const curDuration = sequence[current]?.duration || 1;
    const elapsedSeconds = (timestamp - startTime) / 1000 + pausedElapsed;
    const timeLeft = Math.max(curDuration - elapsedSeconds, 0);
    remaining = timeLeft;
    const displayRemaining = Math.ceil(timeLeft);
    if (previousSecond !== displayRemaining) {
        previousSecond = displayRemaining;
        elapsed = sequence.slice(0, current).reduce((acc, step) => acc + step.duration, 0)
            + (curDuration - timeLeft);
        updateDisplay();
        if (sequence[current].name.startsWith("ワーク") && !workVoicePlayed) {
            const num = parseInt(sequence[current].name.replace("ワーク ", ""));
            workVoicePlayed = true;
            restVoicePlayed = false;
            setTimeout(() => playWorkVoice(num), 500);
        }
        if (sequence[current].name.includes("休憩") && !restVoicePlayed) {
            restVoicePlayed = true;
            workVoicePlayed = false;
            window.AudioModule.playSE("startOfRest");
        }
        if (displayRemaining === 3) {
            if (sequence[current].name.startsWith("ワーク")) window.AudioModule.playSE("countToRest");
            else if (sequence[current].name.includes("休憩")) window.AudioModule.playSE("countdown");
        }
        const color = sequence[current].name.includes("休憩") ? "#7cfc00" : "#ff4500";
        progressBar.style.background = color;
        circle.style.stroke = color;
    }
    setProgress((timeLeft / curDuration) * 100);
    const totalElapsed = sequence.slice(0, current).reduce((a, s) => a + s.duration, 0) + (curDuration - timeLeft);
    const overallPercent = (totalElapsed / totalDuration) * 100;
    progressBar.style.width = `${overallPercent}%`;
    if (timeLeft > 0 && !paused) {
        animationId = requestAnimationFrame(animateProgress);
    } else if (timeLeft <= 0) {
        workVoicePlayed = false;
        restVoicePlayed = false;
        animationId = null;
        startTime = null;
        pausedElapsed = 0;
        previousSecond = null;
        nextStep();
    }
}

// 次のワーク／休憩へ
function nextStep() {
    current++;
    if (current < sequence.length) {
        remaining = sequence[current].duration;
        circle.style.stroke = sequence[current].name.includes("休憩") ? "#7cfc00" : "#ff4500";
        vibrate();
        requestAnimationFrame(animateProgress);
    } else {
        pauseBtn.style.display = "none";
        nameEl.textContent = "すべてのストレッチが完了しました！";
        timerEl.textContent = "00";
        vibrate();
        setProgress(0);
        progressBar.style.background = "#7cfc00";
        window.AudioModule.fadeOutAudio(10000);
        if (!endVoicePlayed) {
            endVoicePlayed = true;
            setTimeout(() => {
                window.AudioModule.playVoice("end");
                const state = window.AudioModule.voiceState?.["end"];
                if (state && state.source) {
                    state.source.onended = () => window.AudioModule.playVoice("otsukare");
                }
            }, 200);
        }
    }
}

// タイマー開始
function startTimer() {
    if (animationId || current >= sequence.length) return;
    startBtn.style.display = "none";
    pauseBtn.style.display = "none";
    let countdown = 3;
    timerEl.textContent = countdown;
    nameEl.textContent = "まもなく開始...";
    window.AudioModule.playSE("countdown");
    countdownInterval = setInterval(() => {
        countdown--;
        timerEl.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            requestWakeLock();
            vibrate();
            updateDisplay();
            requestAnimationFrame(animateProgress);
            window.AudioModule.playBGM();
            elapsed--;
            pauseBtn.style.display = "inline-block";
            pauseBtn.textContent = "一時停止";
        }
    }, 1000);
}

// 一時停止／再開
function pauseTimer() {
    if (current >= sequence.length) return;
    paused = !paused;
    if (paused) {
        pausedElapsed += (performance.now() - startTime) / 1000;
        startTime = null;
        cancelAnimationFrame(animationId);
        animationId = null;
        window.AudioModule.stopBGM();
        window.AudioModule.stopSE("countdown");
        window.AudioModule.stopSE("countToRest");
    } else {
        startTime = performance.now();
        requestAnimationFrame(animateProgress);
        window.AudioModule.playBGM();
        if (remaining <= 3 && remaining > 0) {
            if (sequence[current].name.includes("休憩")) window.AudioModule.playSE("countdown");
            else window.AudioModule.playSE("countToRest");
        }
    }
    pauseBtn.style.display = "inline-block";
    pauseBtn.textContent = paused ? "再開" : "一時停止";
}

// リセット
let resetting = false;
function resetTimer() {
    resetting = true;
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    cancelAnimationFrame(animationId);
    animationId = null;
    startTime = null;
    current = 0;
    remaining = sequence[0].duration;
    elapsed = 0;
    paused = false;
    pausedElapsed = 0;
    previousSecond = null;
    workVoicePlayed = false;
    restVoicePlayed = false;
    endVoicePlayed = false;
    startBtn.style.display = "inline-block";
    pauseBtn.style.display = "none";
    pauseBtn.textContent = "一時停止";
    updateDisplay();
    setProgress(100);
    progressBar.style.width = "0%";
    circle.style.stroke = "#ff4500";
    window.AudioModule.resetBGM();
    window.AudioModule.resetAllSE();
    window.AudioModule.resetAllVoice();
    releaseWakeLock();
}

// ボタン操作イベント
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

// 初期表示
updateDisplay();
setProgress(100);
pausedElapsed = 0;

// ===============================
// タブの表示・非表示でタイマー制御
// ===============================
document.addEventListener("visibilitychange", () => {
    // スタートボタンが表示されている＝まだタイマー開始前なら処理をスキップ
    if (startBtn.style.display !== "none") return;

    if (document.hidden) {
        if (countdownInterval) {
            // カウントダウン中に別画面へ → カウントダウン強制終了してからリセット
            clearInterval(countdownInterval);
            countdownInterval = null;
            resetTimer();
        } else if (!paused && current < sequence.length) {
            // 通常の進行中なら一時停止
            pauseTimer();
        }
    }
});
