// main.js — Squat Battle (Exgame12 のゲームモードのみを切り出した単体版)
// ・事後評価（アンケート / 推定値 / グラフ）と保存（クラウド / CSV）は行わない
// ・終了時はスクワット回数だけを「がんばったね」と表示する

// --------- 設定 ----------
const KNEE_IN_THRESHOLD = 0.04;
const BAD_POSTURE_ANGLE = 75;
const RESET_ANGLE = 160;
const DEPTH_THRESHOLD = 130;
const SPEECH_COOLDOWN = 3000;
const MONSTERS = [["👾", 300], ["🦇", 500], ["👻", 800], ["👹", 1200], ["🐲", 2000]];

const SQUAT_MIN_ANGLE = 70;
const SQUAT_MAX_ANGLE = 180;
const SQUAT_START_THRESHOLD = 165;
const CLEAN_FORM_THRESHOLD = 160;
const CRITICAL_DEPTH_ANGLE = 100;
const DAMAGE_BASE = 100;
const DAMAGE_CRIT_BASE = 150;
const DAMAGE_COMBO_BONUS = 5;
const DAMAGE_CRIT_BONUS = 10;
const DAMAGE_MISS = 10;
const MAX_MONSTER_LEVEL = 5;

const BGM_FILES = ['audio/battle1.mp3', 'audio/battle2.mp3', 'audio/battle3.mp3']; // 3曲からランダム
const BGM_VOLUME = 0.4;

// --------- MediaPipe ----------
let poseLandmarker = null;
let drawingUtils = null;
let lastVideoTime = -1;

async function initPoseLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"
        },
        runningMode: "VIDEO",
        numPoses: 1
    });

    drawingUtils = new DrawingUtils(canvasCtx);
}

// --------- 状態 ----------
let appState = { isRunning: false, isFinished: false, isCameraReady: false, startTime: null, repStart: 0 };

let metrics = {
    count: 0, minAngle: 180, isDeep: false, isMoving: false, isClean: true,
    score: 0, combo: 0, maxCombo: 0, monsterLevel: 0, monsterHP: 0, defeated: 0
};

let audioCtx = null;
let lastSpeechTime = 0;
let cameraStream = null;

// --------- BGM (Web Audio API) ----------
let currentBgmSource = null;
let currentGainNode = null;
const bgmBufferCache = {};

async function loadAudioBuffer(url) {
    if (bgmBufferCache[url]) return bgmBufferCache[url];
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        bgmBufferCache[url] = decodedBuffer;
        return decodedBuffer;
    } catch (e) {
        console.error("Audio buffer load failed:", e);
        return null;
    }
}

async function playBGM() {
    initAudio();
    stopBGM();

    const filePath = BGM_FILES[Math.floor(Math.random() * BGM_FILES.length)];
    const buffer = await loadAudioBuffer(filePath);
    if (!buffer) return;
    // ロード中に終了していたら鳴らさない
    if (appState.isFinished) return;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = audioCtx.createGain();
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const sw = getElSafe('bgm-switch');
    const isEnabled = sw ? sw.checked : true;
    gainNode.gain.value = isEnabled ? BGM_VOLUME : 0;

    source.start(0);
    currentBgmSource = source;
    currentGainNode = gainNode;
}

function stopBGM() {
    if (currentBgmSource) {
        try { currentBgmSource.stop(); } catch (e) { /* already stopped */ }
        currentBgmSource.disconnect();
        currentBgmSource = null;
    }
    if (currentGainNode) {
        currentGainNode.disconnect();
        currentGainNode = null;
    }
}

// --------- DOM 要素 ----------
let els = {};
let videoElement, canvasElement, canvasCtx;

function getElSafe(id) {
    return document.getElementById(id) || null;
}

// --------- 小さいヘルパー ----------
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); }
function playTone(freq, type, dur) { if (!audioCtx) return; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = 0.1; o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + dur); }
function playSound(type) {
    if (!audioCtx) return;
    if (type === 'count') playTone(600, 'square', 0.05);
    if (type === 'start') { playTone(600, 'square', 0.1); setTimeout(() => playTone(1200, 'square', 0.1), 100); }
    if (type === 'ok') { playTone(880, 'sine', 0.1); setTimeout(() => playTone(1760, 'sine', 0.1), 50); }
    if (type === 'ng') playTone(150, 'sawtooth', 0.3);
    if (type === 'crit') { playTone(880, 'sine', 0.1); setTimeout(() => playTone(1760, 'sine', 0.2), 50); }
    if (type === 'hit') { playTone(400, 'square', 0.1); setTimeout(() => playTone(600, 'square', 0.1), 50); }
    if (type === 'win') { playTone(523, 'triangle', 0.2); setTimeout(() => playTone(659, 'triangle', 0.1), 100); setTimeout(() => playTone(784, 'triangle', 0.4), 200); }
}
function speak(text, force = false) {
    if (!window.speechSynthesis) return;
    const now = Date.now();
    if (force || (now - lastSpeechTime > SPEECH_COOLDOWN)) {
        const uttr = new SpeechSynthesisUtterance(text); uttr.lang = 'ja-JP'; uttr.rate = 1.2; window.speechSynthesis.speak(uttr); lastSpeechTime = now;
    }
}
function calculateAngle(a, b, c) { const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x); let angle = Math.abs(radians * 180.0 / Math.PI); if (angle > 180.0) angle = 360 - angle; return angle; }
function fireConfetti(opts) { if (window.confetti) confetti(Object.assign({ particleCount: 80, spread: 60, origin: { y: 0.6 } }, opts || {})); }
function showComboEffect(val) { if (!els.comboDisp) return; els.comboDisp.innerText = val + " COMBO!"; els.comboDisp.classList.add("combo-active"); playSound('hit'); setTimeout(() => els.comboDisp.classList.remove("combo-active"), 800); }

// --------- 画面管理 ----------
function showScreen(name) {
    ['start-screen', 'camera-screen', 'result-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const el = document.getElementById(name + '-screen');
    if (el) el.style.display = 'flex';
    window.scrollTo(0, 0);
}

// --------- DOM 初期化 ----------
function setupElements() {
    videoElement = getElSafe('input_video');
    canvasElement = getElSafe('output_canvas');
    canvasCtx = canvasElement ? canvasElement.getContext('2d') : null;

    els = {
        uiSquat: getElSafe('squat-ui'), uiGame: getElSafe('game-info'),
        depthGaugeContainer: getElSafe('depth-gauge-container'),
        depthBar: getElSafe('depth-bar'), targetLine: getElSafe('target-line'), targetLabel: getElSafe('target-label'),

        gmScore: getElSafe('gm-score'), comboDisp: getElSafe('combo-display'),
        monster: getElSafe('monster'), monsterName: getElSafe('monster-name'), hpBar: getElSafe('hp-bar'), hpText: getElSafe('hp-text'),
        gmComboVal: getElSafe('gm-combo-val'), gmLvlVal: getElSafe('gm-lvl-val'),

        statusLamp: getElSafe('status-lamp'), warningMsg: getElSafe('warning-msg'),
        countOverlay: getElSafe('countdown-overlay'), countVal: getElSafe('countdown-val'),

        btnStart: getElSafe('btn-start'), resReps: getElSafe('res-reps')
    };
}

// --------- スタート / カメラ起動 ----------
async function startApp() {
    if (!poseLandmarker) return;

    showScreen('camera');
    initAudio(); speak("カメラを起動します");

    if (els.uiSquat) els.uiSquat.style.display = 'block';
    if (els.uiGame) els.uiGame.style.display = 'block';
    spawnMonster();

    try {
        if (!videoElement.srcObject) {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }
            });
            videoElement.srcObject = cameraStream;
            await videoElement.play();
            startPredictionLoop();
        }
    } catch (e) {
        console.error("Camera start failed:", e);
        alert("カメラを起動できませんでした。カメラの許可を確認してください。");
        showScreen('start');
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    if (videoElement) videoElement.srcObject = null;
}

function startPredictionLoop() {
    function loop() {
        if (!poseLandmarker || appState.isFinished) return;

        const now = performance.now();
        if (videoElement.currentTime !== lastVideoTime) {
            lastVideoTime = videoElement.currentTime;
            const result = poseLandmarker.detectForVideo(videoElement, now);
            onResults(result && result.landmarks && result.landmarks.length > 0 ? result.landmarks[0] : null);
        }
        requestAnimationFrame(loop);
    }
    loop();
}

// --------- カウントダウン / 終了 ----------
function runCountdown() {
    let c = 5; if (els.countOverlay) els.countOverlay.style.display = 'flex'; if (els.countVal) els.countVal.innerText = c;
    playSound('count');
    const timer = setInterval(() => {
        c--; if (els.countVal) els.countVal.innerText = c;
        if (c > 0) playSound('count');
        if (c <= 0) {
            clearInterval(timer);
            if (els.countVal) els.countVal.innerText = "START!";
            playSound('start');
            setTimeout(() => {
                if (els.countOverlay) els.countOverlay.style.display = 'none';
                if (appState.isFinished) return;
                appState.startTime = Date.now();
                appState.isRunning = true;
                playBGM(); // カウントダウン後にBGM開始
            }, 1000);
        }
    }, 1000);
}

function finishSession() {
    if (appState.isFinished) return;
    appState.isFinished = true; appState.isRunning = false;
    stopBGM();
    stopCamera();
    showResult();
}

// --------- 結果表示（回数だけ） ----------
function showResult() {
    const n = metrics.count || 0;
    if (els.resReps) els.resReps.innerText = n;
    showScreen('result');
    speak(`がんばったね！スクワット ${n} 回`, true);
    fireConfetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
}

// --------- ゲームロジック（Monster 等） ----------
function spawnMonster() {
    let lv = metrics.monsterLevel;
    if (lv >= MONSTERS.length) lv = MONSTERS.length - 1;
    const m = MONSTERS[lv];
    if (els.monster) els.monster.innerText = m[0];
    if (els.monsterName) els.monsterName.innerText = `Lv.${lv + 1} ${m[1]}`;
    if (els.gmLvlVal) els.gmLvlVal.innerText = (lv + 1);

    metrics.monsterHP = m[1];
    updateHP(metrics.monsterHP, metrics.monsterHP);
}
function updateHP(cur, max) { if (els.hpBar) els.hpBar.style.width = ((cur / max) * 100) + "%"; if (els.hpText) els.hpText.innerText = `${cur} / ${max}`; }
function updateScore(val) { metrics.score += val; if (els.gmScore) els.gmScore.innerText = metrics.score; }
function damageEffect(dmg, isCrit) {
    metrics.monsterHP -= dmg; if (metrics.monsterHP < 0) metrics.monsterHP = 0;
    updateHP(metrics.monsterHP, MONSTERS[Math.min(metrics.monsterLevel, MONSTERS.length - 1)][1]);
    if (els.monster) { els.monster.classList.remove('damage-shake'); void els.monster.offsetWidth; els.monster.classList.add('damage-shake'); }
    if (isCrit) { playSound('crit'); fireConfetti(); } else { playSound('hit'); }
    if (metrics.monsterHP <= 0) {
        setTimeout(() => {
            if (appState.isFinished) return;
            playSound('win'); speak("撃破！");
            metrics.monsterLevel++; metrics.defeated++;
            if (metrics.monsterLevel >= MAX_MONSTER_LEVEL) { finishSession(); return; }
            spawnMonster();
        }, 500);
    }
}

// --------- スクワット判定 ----------
function processSquatLogic(lms) {
    let side = "RIGHT", sIdx = 12, hIdx = 24, kIdx = 26, aIdx = 28;
    if (lms[11].visibility > lms[12].visibility) { side = "LEFT"; sIdx = 11; hIdx = 23; kIdx = 25; aIdx = 27; }

    if (lms[sIdx].visibility > 0.5 && lms[hIdx].visibility > 0.5) {
        const kneeAngle = calculateAngle(lms[hIdx], lms[kIdx], lms[aIdx]);
        const hipAngle = calculateAngle(lms[sIdx], lms[hIdx], lms[kIdx]);

        const minAng = SQUAT_MAX_ANGLE, maxAng = SQUAT_MIN_ANGLE;
        let p = (minAng - kneeAngle) / (minAng - maxAng) * 100; if (p < 0) p = 0; if (p > 100) p = 100;

        if (els.depthBar) els.depthBar.style.height = p + "%";

        let tp = (minAng - DEPTH_THRESHOLD) / (minAng - maxAng) * 100;
        if (els.targetLine) els.targetLine.style.top = tp + "%";
        if (els.targetLabel) els.targetLabel.style.top = tp + "%";

        // 体幹〜膝のライン
        if (canvasCtx && canvasElement) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(lms[sIdx].x * canvasElement.width, lms[sIdx].y * canvasElement.height);
            canvasCtx.lineTo(lms[hIdx].x * canvasElement.width, lms[hIdx].y * canvasElement.height);
            canvasCtx.lineTo(lms[kIdx].x * canvasElement.width, lms[kIdx].y * canvasElement.height);
            canvasCtx.strokeStyle = "yellow"; canvasCtx.lineWidth = 5; canvasCtx.stroke();
        }

        let warning = "", isKneeIn = false;
        if (side === "RIGHT" && lms[kIdx].x > lms[aIdx].x + KNEE_IN_THRESHOLD) isKneeIn = true;
        if (side === "LEFT" && lms[kIdx].x < lms[aIdx].x - KNEE_IN_THRESHOLD) isKneeIn = true;

        if (isKneeIn && kneeAngle < CLEAN_FORM_THRESHOLD) {
            if (metrics.isMoving && metrics.isClean) { warning = "ひざを開いて！"; metrics.isClean = false; speak("ひざ"); playSound('ng'); }
        }
        if (hipAngle < BAD_POSTURE_ANGLE && kneeAngle < CLEAN_FORM_THRESHOLD) {
            if (metrics.isMoving && metrics.isClean) { warning = "胸を張って！"; metrics.isClean = false; speak("むね"); playSound('ng'); }
        }

        if (warning) {
            if (els.warningMsg) { els.warningMsg.innerText = warning; els.warningMsg.style.display = 'block'; }
        } else {
            if (els.warningMsg) els.warningMsg.style.display = 'none';
        }

        if (appState.isRunning) {
            // 動作開始
            if (kneeAngle < SQUAT_START_THRESHOLD && !metrics.isMoving) {
                metrics.isMoving = true;
                appState.repStart = Date.now();
                metrics.minAngle = SQUAT_MAX_ANGLE;
                metrics.isDeep = false;
                metrics.isClean = true;
            }

            if (metrics.isMoving) {
                if (kneeAngle < metrics.minAngle) metrics.minAngle = kneeAngle;
                if (kneeAngle < DEPTH_THRESHOLD) metrics.isDeep = true;

                // 立ち上がり = 1回完了
                if (kneeAngle > RESET_ANGLE) {
                    if (metrics.isDeep) {
                        metrics.count++;

                        let damage = 0, isCrit = false;
                        if (metrics.isClean) {
                            metrics.combo++;
                            if (metrics.combo > metrics.maxCombo) metrics.maxCombo = metrics.combo;

                            if (metrics.minAngle < CRITICAL_DEPTH_ANGLE) {
                                damage = DAMAGE_CRIT_BASE + metrics.combo * DAMAGE_CRIT_BONUS;
                                isCrit = true;
                            } else {
                                damage = DAMAGE_BASE + metrics.combo * DAMAGE_COMBO_BONUS;
                            }
                            updateScore(damage);
                            showComboEffect(metrics.combo);
                        } else {
                            metrics.combo = 0;
                            damage = DAMAGE_MISS;
                            updateScore(DAMAGE_MISS);
                            speak("おしい");
                        }
                        damageEffect(damage, isCrit);
                        if (els.gmComboVal) els.gmComboVal.innerText = metrics.combo;
                    }
                    metrics.isMoving = false;
                }
            }
        }

        // ステータスランプ
        if (metrics.isDeep) {
            if (els.statusLamp) { els.statusLamp.innerText = "OK!"; els.statusLamp.className = "status-lamp lamp-ready"; }
        } else {
            if (els.statusLamp) { els.statusLamp.innerText = "しゃがむ"; els.statusLamp.className = "status-lamp lamp-squat"; }
        }
    }
}

// 毎フレーム呼ばれる（lms = ポーズランドマーク or null）
function onResults(lms) {
    if (appState.isFinished) return;
    if (!canvasCtx || !canvasElement || !videoElement) return;

    canvasElement.width = videoElement.videoWidth; canvasElement.height = videoElement.videoHeight;
    canvasCtx.save(); canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (lms) {
        // 初回検出時にカウントダウン開始
        if (!appState.isCameraReady) {
            appState.isCameraReady = true;
            if (els.depthGaugeContainer) els.depthGaugeContainer.style.display = 'block';
            if (els.targetLabel) els.targetLabel.style.display = 'block';
            runCountdown();
        }

        // 顔ランドマークを除いて描画
        const FACE_MASK = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        const bodyConnections = window.PoseLandmarker.POSE_CONNECTIONS.filter(c => {
            const s = (c.start !== undefined) ? c.start : c[0];
            const e = (c.end !== undefined) ? c.end : c[1];
            return !FACE_MASK.has(s) && !FACE_MASK.has(e);
        });
        drawingUtils.drawConnectors(lms, bodyConnections, { color: "#00FF00", lineWidth: 4 });
        const bodyLandmarks = lms.filter((_, i) => !FACE_MASK.has(i));
        drawingUtils.drawLandmarks(bodyLandmarks, { color: "#FF0000", lineWidth: 2 });

        processSquatLogic(lms);
    }

    canvasCtx.restore();
}

// --------- イベント登録 ----------
function setupEventListeners() {
    els.btnStart?.addEventListener("click", () => {
        initAudio(); playSound('ok');
        startApp();
    });

    getElSafe("btn-finish")?.addEventListener("click", () => { initAudio(); playSound('ok'); finishSession(); });

    getElSafe("btn-retry")?.addEventListener("click", () => {
        initAudio(); playSound('ok');
        setTimeout(() => { location.reload(); }, 100); // 効果音が鳴り終わるまでのタイムラグ
    });

    // BGM ON/OFF
    getElSafe('bgm-switch')?.addEventListener('change', (e) => {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        if (currentGainNode && audioCtx) {
            const vol = e.target.checked ? BGM_VOLUME : 0;
            try {
                currentGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
                currentGainNode.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
            } catch (err) {
                currentGainNode.gain.value = vol;
            }
        }
    });
}

// --------- 初期化 ----------
async function initApp() {
    console.log("Initializing Squat Battle...");
    setupElements();
    setupEventListeners();
    showScreen('start');
    try {
        await initPoseLandmarker();
        console.log("Pose Landmarker Ready");
        if (els.btnStart) { els.btnStart.disabled = false; els.btnStart.innerText = "スタート"; }
    } catch (e) {
        console.error("Initialization failed:", e);
        if (els.btnStart) { els.btnStart.innerText = "読み込み失敗（再読み込みしてください）"; }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
