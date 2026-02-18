// main.js v9.2 — Squat Master (camera-screen ベース)
// 注意: HTML に <div id="camera-screen"> を作成しておくこと

// --------- 設定 ----------
const GAS_URL = "https://script.google.com/macros/s/AKfycbwptY96GJx-A_kXHRLvokJXK0e_fH19t0hoC_Ayijbbz1nzfZClmDj1WzLQfD9P9AvO/exec";

const KNEE_IN_THRESHOLD = 0.04;
const BAD_POSTURE_ANGLE = 75;
const RESET_ANGLE = 160;
const DEPTH_THRESHOLD = 130;
const SPEECH_COOLDOWN = 3000;
const SLOW_CYCLE_MS = 7000;
const MONSTERS = [["👾", 300], ["🦇", 500], ["👻", 800], ["👹", 1200], ["🐲", 2000]];

const G_ACC = 9.81;
const CHAIR_HEIGHT = 0.40;


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
let appState = { exercise: "", subMode: "", isRunning: false, isFinished: false, isCameraReady: false, startTime: null, repStart: 0, patientID: "Guest" };
// BGMの音源設定（実際のファイルパスに合わせて書き換えてください）
// BGMの音源設定
const bgmFiles = {
    'squat-slow': 'audio/128bpm_slow.mp3',
    'squat-game': ['audio/battle1.mp3', 'audio/battle2.mp3', 'audio/battle3.mp3'], // 3曲からランダム
    'squat-cs30': 'audio/ChairStand30.mp3',
    'squat-self': 'audio/cascada_2.mp3',
    'balance-normal': 'audio/MOCHIKO.wav',
    'banzai-normal': 'audio/cascada_2.mp3'
};

let currentBgmSource = null; // 現在再生中のAudioBufferSourceNode
let currentGainNode = null;   // BGM音量制御用GainNode
const bgmBufferCache = {};    // デコード済みAudioBufferのキャッシュ

// AudioBufferをロード＆デコードするヘルパー
async function loadAudioBuffer(url) {
    if (bgmBufferCache[url]) return bgmBufferCache[url];

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();

        // audioCtxがまだ無ければ作成 (playBGM等はinitAudio後に呼ばれる前提だが念のため)
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        bgmBufferCache[url] = decodedBuffer;
        return decodedBuffer;
    } catch (e) {
        console.error("Audio buffer load failed:", e);
        return null;
    }
}

// BGM再生用の関数 (Web Audio API版)
async function playBGM(exercise, subMode) {
    // ユーザーインタラクションが必要なコンテキストの再開
    initAudio();

    // すでに再生中なら一旦止める
    stopBGM();

    // キーを生成
    let key = exercise;
    // subModeがあれば結合（squat-slow, balance-normal 等）
    if (subMode) {
        key = `${exercise}-${subMode}`;
    } else {
        if (appState.subMode) {
            key = `${exercise}-${appState.subMode}`;
        }
    }

    // バランス/バンザイで subMode が "normal" の場合などのマッピング修正
    if (exercise === 'balance' && !key.includes('normal')) key = 'balance-normal';
    if (exercise === 'banzai' && !key.includes('normal')) key = 'banzai-normal';

    let filePathOrArray = bgmFiles[key];
    let filePath = filePathOrArray;

    // 配列ならランダム選択
    if (Array.isArray(filePathOrArray)) {
        const idx = Math.floor(Math.random() * filePathOrArray.length);
        filePath = filePathOrArray[idx];
    }

    if (filePath) {
        // AudioBuffer取得
        const buffer = await loadAudioBuffer(filePath);
        if (!buffer) return;

        // もしロード中に別のBGM再生指示が来てstopBGMされていたら、再生しない等の制御も可能だが
        // シンプルにここでaudioCtxの状態を確認して再生

        // ソースノード作成
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true; // シームレスループ

        // ゲインノード作成（音量調整）
        const gainNode = audioCtx.createGain();
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // スイッチの状態を見て初期音量を決定
        const isEnabled = document.getElementById('bgm-switch') ? document.getElementById('bgm-switch').checked : true;
        gainNode.gain.value = isEnabled ? 0.4 : 0;

        source.start(0);

        currentBgmSource = source;
        currentGainNode = gainNode;

    } else {
        console.warn(`BGM file not found for key: ${key}`);
    }
}

// BGM停止用の関数 (Web Audio API版)
function stopBGM() {
    if (currentBgmSource) {
        try {
            currentBgmSource.stop();
        } catch (e) {
            // すでに止まっている場合などは無視
        }
        currentBgmSource.disconnect();
        currentBgmSource = null;
    }
    if (currentGainNode) {
        currentGainNode.disconnect();
        currentGainNode = null;
    }
}

let metrics = {
    count: 0, minAngle: 180, isDeep: false, isMoving: false, isClean: true,
    score: 0, combo: 0, maxCombo: 0, monsterLevel: 0, monsterHP: 0, defeated: 0, logs: [],
    isBalancing: false, balanceStart: 0, currentBalanceTime: 0, maxBalanceTime: 0,
    maxAngleL: 0, maxAngleR: 0
};
let surveyData = { rpe: 3, pain: "None" };
let audioCtx = null;
let lastSpeechTime = 0;

// --------- DOM 要素（後で初期化） ----------
let els = {};
let videoElement, canvasElement, canvasCtx;

// 安全に要素を取得（存在しなければ null）
function getElSafe(id) {
    return document.getElementById(id) || null;
}

// 小さいヘルパー
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
    const now = Date.now();
    if (force || (now - lastSpeechTime > SPEECH_COOLDOWN)) {
        const uttr = new SpeechSynthesisUtterance(text); uttr.lang = 'ja-JP'; uttr.rate = 1.2; window.speechSynthesis.speak(uttr); lastSpeechTime = now;
    }
}
function getNowStr() { return new Date().toLocaleString(); }
function calculateAngle(a, b, c) { const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x); let angle = Math.abs(radians * 180.0 / Math.PI); if (angle > 180.0) angle = 360 - angle; return angle; }
function fireConfetti() { if (window.confetti) confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } }); }
function showComboEffect(val) { if (!els.comboDisp) return; els.comboDisp.innerText = val + " COMBO!"; els.comboDisp.classList.add("combo-active"); playSound('hit'); setTimeout(() => els.comboDisp.classList.remove("combo-active"), 800); }

// --------- 画面管理 ----------

function hideAllScreens() {
    ['start-screen', 'camera-screen', 'survey-screen', 'result-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function showScreen(name) {
    hideAllScreens();
    const map = {
        start: 'start-screen',
        camera: 'camera-screen',
        survey: 'survey-screen',
        result: 'result-screen'
    };
    const id = map[name];
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

// 強制的に短時間トップへ固定（画面移動時のちらつき防止）
function lockScrollTopBrief() {
    // ブラウザの自動スクロールを抑制して 0 に戻す
    document.documentElement.style.scrollBehavior = 'auto';
    let n = 0;
    const lock = setInterval(() => {
        window.scrollTo(0, 0);
        n++;
        if (n > 30) { clearInterval(lock); document.documentElement.style.scrollBehavior = ''; }
    }, 20);
}

// --------- DOM 初期化（DOMContentLoaded 内で呼ぶ） ----------
function setupElements() {
    // video / canvas
    videoElement = getElSafe('input_video');
    canvasElement = getElSafe('output_canvas');
    canvasCtx = canvasElement ? canvasElement.getContext('2d') : null;

    // 必須要素を els に格納
    els = {
        uiSquat: getElSafe('squat-ui'), uiBalance: getElSafe('balance-ui'), uiBanzai: getElSafe('banzai-ui'),
        uiTraining: getElSafe('training-info'), uiGame: getElSafe('game-info'),

        depthGaugeContainer: getElSafe('depth-gauge-container'),
        depthBar: getElSafe('depth-bar'), targetLine: getElSafe('target-line'), targetLabel: getElSafe('target-label'),
        pacerGhost: getElSafe('pacer-ghost'), pacerContainer: getElSafe('pacer-container'),
        trReps: getElSafe('tr-reps'), trSpeed: getElSafe('tr-speed'), trTimer: getElSafe('tr-timer'), trPacerBox: getElSafe('tr-pacer-box'), trPacerVal: getElSafe('tr-pacer-val'),

        gmScoreBoard: getElSafe('gm-score-board'), gmScore: getElSafe('gm-score'), comboDisp: getElSafe('combo-display'),
        battleStage: getElSafe('battle-stage'), monster: getElSafe('monster'), monsterName: getElSafe('monster-name'), hpBar: getElSafe('hp-bar'), hpText: getElSafe('hp-text'),
        gmComboVal: getElSafe('gm-combo-val'), gmLvlVal: getElSafe('gm-lvl-val'),

        balTimer: getElSafe('bal-timer'), balStatus: getElSafe('bal-status'), balBest: getElSafe('bal-best'),
        bzAngleL: getElSafe('bz-angle-l'), bzAngleR: getElSafe('bz-angle-r'), bzBarL: getElSafe('banzai-bar-L'), bzBarR: getElSafe('banzai-bar-R'),

        statusLamp: getElSafe('status-lamp'), warningMsg: getElSafe('warning-msg'),
        countOverlay: getElSafe('countdown-overlay'), countVal: getElSafe('countdown-val'),
        startScreen: getElSafe('start-screen'), surveyScreen: getElSafe('survey-screen'), resScreen: getElSafe('result-screen'),
        genericMenu: getElSafe('generic-menu'), squatMenu: getElSafe('squat-menu'), measureMenu: getElSafe('measure-menu'), mainMenu: getElSafe('main-menu'),
        comboDisplay: getElSafe('combo-display')
    };

    // ボタンに便利なショートハンド（存在チェックしてから）
    const cloudBtn = getElSafe('cloud-btn'); if (cloudBtn) cloudBtn.addEventListener('click', sendToGoogleSheets);
}

// --------- UI 操作関数（画面切替 / メニュー） ----------
function selectCategory(cat) {
    appState.exercise = cat;
    if (cat === 'squat') {
        if (els.mainMenu) els.mainMenu.style.display = 'none';
        if (els.squatMenu) els.squatMenu.style.display = 'flex';
        setSquatMode('slow');
    } else if (cat === 'measure') {
        if (els.mainMenu) els.mainMenu.style.display = 'none';
        if (els.measureMenu) els.measureMenu.style.display = 'flex';
        setMode('squat', 'cs30');
    }
}

function setSquatMode(mode) {
    appState.subMode = mode;
    ['slow', 'self', 'cs30', 'game'].forEach(m => {
        const b = getElSafe('opt-' + m);
        if (b) b.classList.remove('selected');
    });
    const sel = getElSafe('opt-' + mode);
    if (sel) sel.classList.add('selected');
}

function setMode(ex, sub) {
    appState.exercise = ex; appState.subMode = sub;
    const container = getElSafe('measure-menu');
    if (container) {
        const btns = container.getElementsByClassName('sub-btn');
        for (let b of btns) b.classList.remove('selected');
    }
    const btn = getElSafe('opt-' + (ex === 'squat' ? 'cs30' : ex));
    if (btn) btn.classList.add('selected');
}

function backToMain() {
    const sm = getElSafe('squat-menu'); if (sm) sm.style.display = 'none';
    const mm = getElSafe('measure-menu'); if (mm) mm.style.display = 'none';
    const main = getElSafe('main-menu'); if (main) main.style.display = 'flex';
    // メニュー表示なら start-screen を表示
    showScreen('start');
    // 終局トップに
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function goHome() {
    // 画面をすべて閉じメインに戻す
    if (els.uiSquat) els.uiSquat.style.display = 'none';
    if (els.uiBalance) els.uiBalance.style.display = 'none';
    if (els.uiBanzai) els.uiBanzai.style.display = 'none';
    if (els.resScreen) els.resScreen.style.display = 'none';
    if (els.surveyScreen) els.surveyScreen.style.display = 'none';
    if (els.mainMenu) els.mainMenu.style.display = 'flex';
    if (els.startScreen) els.startScreen.style.display = 'flex';

    // ハッシュジャンプ（ブラウザ処理で滑らかに戻る場合がある）
    location.hash = "#top";

    // 何度も戻すロック
    let lock = setInterval(() => { window.scrollTo(0, 0); }, 30);
    setTimeout(() => { clearInterval(lock); }, 600);
    // 表示は start-screen に
    showScreen('start');
}


function startPredictionLoop() {
    async function loop() {
        if (!poseLandmarker || appState.isFinished) return;

        const now = performance.now();

        if (videoElement.currentTime !== lastVideoTime) {
            lastVideoTime = videoElement.currentTime;

            const result = poseLandmarker.detectForVideo(
                videoElement,
                now
            );

            if (result.landmarks && result.landmarks.length > 0) {
                onResults({
                    poseLandmarks: result.landmarks[0]
                });
            }
        }

        requestAnimationFrame(loop);
    }

    loop();
}

// --------- スタート / カメラ起動 ----------
async function startApp() {
    appState.patientID = (getElSafe('patient-id') && getElSafe('patient-id').value) ? getElSafe('patient-id').value : "Guest";
    // camera-screen を表示
    showScreen('camera');

    initAudio(); speak("カメラを起動します");

    // UI 初期表示整理
    if (els.uiSquat) els.uiSquat.style.display = 'none';
    if (els.uiBalance) els.uiBalance.style.display = 'none';
    if (els.uiBanzai) els.uiBanzai.style.display = 'none';

    if (appState.exercise === 'squat') {
        if (els.uiSquat) els.uiSquat.style.display = 'block';
        if (appState.subMode === 'game') {
            if (els.uiGame) els.uiGame.style.display = 'block';
            if (els.uiTraining) els.uiTraining.style.display = 'none';
            spawnMonster();
        } else {
            if (els.uiTraining) els.uiTraining.style.display = 'block';
            if (els.uiGame) els.uiGame.style.display = 'none';
            if (els.trTimer) els.trTimer.style.display = (appState.subMode === 'cs30') ? 'block' : 'none';
            if (els.trPacerBox) els.trPacerBox.style.display = (appState.subMode === 'slow') ? 'block' : 'none';
        }
        if (els.pacerContainer) els.pacerContainer.style.display = (appState.subMode === 'slow') ? 'block' : 'none';
    } else if (appState.exercise === 'balance') {
        if (els.uiBalance) els.uiBalance.style.display = 'block';
    } else {
        if (els.uiBanzai) els.uiBanzai.style.display = 'block';
    }

    // カメラ起動（Camera / MediaPipe 用）
    // --- MediaPipe Tasks 用カメラ起動 ---
    if (!videoElement.srcObject) {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 }
        });

        videoElement.srcObject = stream;
        await videoElement.play();

        startPredictionLoop();
    }


    // playBGM(appState.exercise); // ここでの一括再生は廃止（カウントダウン後に再生 or 即再生）

    // カウントダウンが無いモード（Balance, Banzai）はここで再生
    if (appState.exercise === 'balance' || appState.exercise === 'banzai') {
        playBGM(appState.exercise, 'normal');
    }
    // Squat系（Game, Slow, CS-30, Self）は runCountdown 内、
    // または runCountdown を呼ばない場合（Selfなど）に個別対応が必要だが
    // 現在のロジックでは Squat は全て runCountdown を通るか、通らないならここで再生が必要。
    // main.js のロジックを見ると、Squatでもカウントダウンが無いモードがあるかもしれないが
    // onResults 内で needsCount = (game || cs30 || slow) となっている。
    // Self モードは needsCount = false なので、runCountdown が呼ばれない。
    // なので Self の場合はここで鳴らす必要がある。

    if (appState.exercise === 'squat') {
        // subMode check
        const needsCount = (appState.subMode === 'game' || appState.subMode === 'cs30' || appState.subMode === 'slow');
        if (!needsCount) {
            playBGM(appState.exercise, appState.subMode);
        }
        animatePacerLoop();
    }
}

// --------- カウントダウン / 終了系 ----------
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
                appState.startTime = Date.now();
                appState.isRunning = true;
                playBGM(appState.exercise, appState.subMode); // ★カウントダウン後にBGM開始
            }, 1000);
        }
    }, 1000);
}

function finishSession() {
    if (appState.isFinished) return;
    appState.isFinished = true; appState.isRunning = false;
    speak("終了です");
    stopBGM(); // ★終了時にBGM停止
    // hide camera container to show survey
    const cam = getElSafe('camera-screen');
    if (cam) cam.style.display = 'none';
    showScreen('survey');
}

// --------- ゲームロジック（Monster 等） ----------
function spawnMonster() {
    let lv = metrics.monsterLevel;
    if (lv >= MONSTERS.length) lv = MONSTERS.length - 1;
    const m = MONSTERS[lv];
    if (els.monster) els.monster.innerText = m[0];
    if (els.monsterName) els.monsterName.innerText = `Lv.${lv + 1} ${m[1]}`;
    // 左上のレベル表示も更新
    if (els.gmLvlVal) els.gmLvlVal.innerText = (lv + 1);

    metrics.monsterHP = m[1];
    updateHP(metrics.monsterHP, metrics.monsterHP);
}
function updateHP(cur, max) { if (els.hpBar) els.hpBar.style.width = ((cur / max) * 100) + "%"; if (els.hpText) els.hpText.innerText = `${cur} / ${max}`; }
function updateScore(val) { metrics.score += val; if (els.gmScore) els.gmScore.innerText = metrics.score; }
function damageEffect(dmg, isCrit) {
    metrics.monsterHP -= dmg; if (metrics.monsterHP < 0) metrics.monsterHP = 0;
    updateHP(metrics.monsterHP, MONSTERS[Math.min(metrics.monsterLevel, 4)][1]);
    if (els.monster) { els.monster.classList.remove('damage-shake'); void els.monster.offsetWidth; els.monster.classList.add('damage-shake'); }
    if (isCrit) { playSound('crit'); fireConfetti(); } else { playSound('hit'); }
    if (metrics.monsterHP <= 0) {
        setTimeout(() => {
            playSound('win'); speak("撃破！");
            metrics.monsterLevel++; metrics.defeated++;
            if (metrics.monsterLevel >= 5) { finishSession(); return; }
            spawnMonster();
        }, 500);
    }
}

// --------- アニメーション / ペーサー ----------
function animatePacerLoop() {
    if (!appState.isFinished && appState.subMode === 'slow') {
        if (appState.isRunning && appState.startTime) {
            const t = (Date.now() - appState.startTime) % SLOW_CYCLE_MS; let pos = 0;
            if (t < 3000) pos = 100 - (t / 3000 * 100); else if (t < 6000) pos = (t - 3000) / 3000 * 100; else pos = 100;
            if (els.pacerGhost) els.pacerGhost.style.top = pos + "%";
            const cycles = Math.floor((Date.now() - appState.startTime) / SLOW_CYCLE_MS);
            if (els.trPacerVal) els.trPacerVal.innerText = cycles;
        } else { if (els.pacerGhost) els.pacerGhost.style.top = "100%"; }
        requestAnimationFrame(animatePacerLoop);
    }
}

// --------- 計測ロジック（onResults へ統合） ----------
function checkBalance(lAnkle, rAnkle) {
    const diff = Math.abs(lAnkle.y - rAnkle.y);
    if (diff > 0.05) {
        if (!metrics.isBalancing) { metrics.isBalancing = true; metrics.balanceStart = Date.now(); speak("計測ちゅう"); if (els.balStatus) { els.balStatus.innerText = "計測中"; els.balStatus.style.color = "#00e676"; } }
        const t = (Date.now() - metrics.balanceStart) / 1000;
        metrics.currentBalanceTime = t;
        if (t > metrics.maxBalanceTime) metrics.maxBalanceTime = t;
        if (els.balTimer) els.balTimer.innerText = t.toFixed(2);
    } else {
        if (metrics.isBalancing) { metrics.isBalancing = false; speak("ストップ"); if (els.balStatus) { els.balStatus.innerText = "足をつきました"; els.balStatus.style.color = "#ff1744"; } if (els.balBest) els.balBest.innerText = metrics.maxBalanceTime.toFixed(2); }
    }
}
function checkBanzai(sL, eL, sR, eR, hL, hR) {
    const angL = calculateAngle(hL, sL, eL); const angR = calculateAngle(hR, sR, eR);
    if (angL > metrics.maxAngleL) metrics.maxAngleL = angL; if (angR > metrics.maxAngleR) metrics.maxAngleR = angR;
    if (els.bzAngleL) els.bzAngleL.innerText = Math.floor(angL) + "°"; if (els.bzAngleR) els.bzAngleR.innerText = Math.floor(angR) + "°";
    if (els.bzBarL) els.bzBarL.style.height = (angL / 180 * 100) + "%"; if (els.bzBarR) els.bzBarR.style.height = (angR / 180 * 100) + "%";
}

// onResults は MediaPipe Pose のコールバックで呼ばれる
function onResults(results) {
    if (appState.isFinished) return;

    if (!appState.isCameraReady) {
        appState.isCameraReady = true;
        if (appState.exercise === 'squat') {
            if (els.depthGaugeContainer) els.depthGaugeContainer.style.display = 'block';
            if (els.targetLabel) els.targetLabel.style.display = 'block';
            if (appState.subMode === 'slow' || appState.subMode === 'self') if (els.pacerContainer) els.pacerContainer.style.display = 'block';

            const needsCount = (appState.subMode === 'game' || appState.subMode === 'cs30' || appState.subMode === 'slow');
            if (needsCount) runCountdown();
            else {
                appState.startTime = Date.now();
                appState.isRunning = true;
                speak("スタート");
            }
        } else {
            appState.isRunning = true; speak("計測を開始します");
        }
    }

    if (!canvasCtx || !canvasElement || !videoElement) return;
    canvasElement.width = videoElement.videoWidth; canvasElement.height = videoElement.videoHeight;
    canvasCtx.save(); canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
        const lms = results.poseLandmarks;

        // 顔ランドマークを除いて描画（視覚ノイズを減らす）
        const FACE_MASK = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

        // POSE_CONNECTIONS のうち、顔が含まれるものを除外
        const bodyConnections = window.PoseLandmarker.POSE_CONNECTIONS.filter(c => {
            const s = (c.start !== undefined) ? c.start : c[0];
            const e = (c.end !== undefined) ? c.end : c[1];
            return !FACE_MASK.has(s) && !FACE_MASK.has(e);
        });

        drawingUtils.drawConnectors(
            lms,
            bodyConnections,
            { color: "#00FF00", lineWidth: 4 }
        );

        // 顔以外のランドマークのみを描画
        const bodyLandmarks = lms.filter((_, i) => !FACE_MASK.has(i));
        drawingUtils.drawLandmarks(
            bodyLandmarks,
            { color: "#FF0000", lineWidth: 2 }
        );


        if (appState.exercise === 'balance') {
            if (lms[27].visibility > 0.5 && lms[28].visibility > 0.5) checkBalance(lms[27], lms[28]);
        } else if (appState.exercise === 'banzai') {
            if (lms[11].visibility > 0.5 && lms[23].visibility > 0.5) checkBanzai(lms[11], lms[13], lms[12], lms[14], lms[23], lms[24]);
        } else {
            // squat logic
            let side = "RIGHT", sIdx = 12, hIdx = 24, kIdx = 26, aIdx = 28;
            if (lms[11].visibility > lms[12].visibility) { side = "LEFT"; sIdx = 11; hIdx = 23; kIdx = 25; aIdx = 27; }
            if (lms[sIdx].visibility > 0.5 && lms[hIdx].visibility > 0.5) {
                const kneeAngle = calculateAngle(lms[hIdx], lms[kIdx], lms[aIdx]);
                const hipAngle = calculateAngle(lms[sIdx], lms[hIdx], lms[kIdx]);

                const minAng = 180, maxAng = 70;
                let p = (minAng - kneeAngle) / (minAng - maxAng) * 100; if (p < 0) p = 0; if (p > 100) p = 100;
                if (els.depthBar) els.depthBar.style.height = p + "%";
                let tp = (minAng - DEPTH_THRESHOLD) / (minAng - maxAng) * 100;
                if (els.targetLine) els.targetLine.style.top = tp + "%";
                if (els.targetLabel) els.targetLabel.style.top = tp + "%";
                if (appState.subMode === 'self' || appState.subMode === 'game') if (els.pacerGhost) els.pacerGhost.style.top = p + "%";

                canvasCtx.beginPath();
                canvasCtx.moveTo(lms[sIdx].x * canvasElement.width, lms[sIdx].y * canvasElement.height);
                canvasCtx.lineTo(lms[hIdx].x * canvasElement.width, lms[hIdx].y * canvasElement.height);
                canvasCtx.lineTo(lms[kIdx].x * canvasElement.width, lms[kIdx].y * canvasElement.height);
                canvasCtx.strokeStyle = "yellow"; canvasCtx.lineWidth = 5; canvasCtx.stroke();

                let warning = "", isKneeIn = false;
                if (side === "RIGHT" && lms[kIdx].x > lms[aIdx].x + KNEE_IN_THRESHOLD) isKneeIn = true;
                if (side === "LEFT" && lms[kIdx].x < lms[aIdx].x - KNEE_IN_THRESHOLD) isKneeIn = true;
                if (isKneeIn && kneeAngle < 160) { if (metrics.isMoving && metrics.isClean) { warning = "ひざを開いて！"; metrics.isClean = false; speak("ひざ"); playSound('ng'); } }
                if (hipAngle < BAD_POSTURE_ANGLE && kneeAngle < 160) { if (metrics.isMoving && metrics.isClean) { warning = "胸を張って！"; metrics.isClean = false; speak("むね"); playSound('ng'); } }
                if (warning) { if (els.warningMsg) { els.warningMsg.innerText = warning; els.warningMsg.style.display = 'block'; } } else { if (els.warningMsg) els.warningMsg.style.display = 'none'; }

                if (appState.isRunning) {
                    if (kneeAngle < 165 && !metrics.isMoving) { metrics.isMoving = true; appState.repStart = Date.now(); metrics.minAngle = 180; metrics.isDeep = false; metrics.isClean = true; }
                    if (metrics.isMoving) {
                        if (kneeAngle < metrics.minAngle) metrics.minAngle = kneeAngle;
                        if (kneeAngle < DEPTH_THRESHOLD) metrics.isDeep = true;
                        if (kneeAngle > RESET_ANGLE) {
                            if (metrics.isDeep) {
                                metrics.count++;
                                const dur = (Date.now() - appState.repStart) / 1000;
                                if (appState.subMode === 'game') {
                                    let damage = 0, isCrit = false;
                                    if (metrics.isClean) {
                                        metrics.combo++; if (metrics.combo > metrics.maxCombo) metrics.maxCombo = metrics.combo;
                                        if (metrics.minAngle < 100) { damage = 150 + metrics.combo * 10; isCrit = true; } else { damage = 100 + metrics.combo * 5; }
                                        updateScore(damage); showComboEffect(metrics.combo);
                                    } else {
                                        metrics.combo = 0; damage = 10; updateScore(10); speak("おしい");
                                    }
                                    damageEffect(damage, isCrit);
                                    if (els.gmComboVal) els.gmComboVal.innerText = metrics.combo;
                                } else {
                                    if (els.trReps) els.trReps.innerText = metrics.count;
                                    if (els.trSpeed) els.trSpeed.innerText = dur.toFixed(2);
                                    if (metrics.isClean) speak("OK", true);
                                }
                                let note = "Perfect"; if (warning) note = "Error";
                                metrics.logs.push({ id: appState.patientID, time: getNowStr(), rep: metrics.count, depth: Math.floor(metrics.minAngle), duration: parseFloat(dur.toFixed(2)), note: note });
                            }
                            metrics.isMoving = false;
                        }
                    }
                }
                if (metrics.isDeep) { if (els.statusLamp) { els.statusLamp.innerText = "OK!"; els.statusLamp.className = "status-lamp lamp-ready"; } } else { if (els.statusLamp) { els.statusLamp.innerText = "しゃがむ"; els.statusLamp.className = "status-lamp lamp-squat"; } }
            }
        }
    }

    if (appState.subMode === 'cs30' && appState.isRunning && !appState.isFinished) {
        const elap = (Date.now() - appState.startTime) / 1000;
        let rem = 30 - elap;
        if (rem <= 0) { rem = 0; finishSession(); }
        if (els.trTimer) els.trTimer.innerText = Math.ceil(rem);
    }

    canvasCtx.restore();
}

// ★ Page1 / Page2 初期化
function initResultScreen() {
    const page1 = document.getElementById("res-page-1");
    const page2 = document.getElementById("res-page-2");
    if (page1 && page2) {
        page1.style.display = "flex";
        page2.style.display = "none";
    }
}


// --------- Page1 / Page2 切替 ----------

function showResultPage1() {
    const page1 = document.getElementById("res-page-1");
    const page2 = document.getElementById("res-page-2");
    if (page1 && page2) {
        page1.style.display = "flex";
        page2.style.display = "none";

        // Page1 情報更新
        if (appState.exercise === 'squat') {

            // ★ visibility fix: always show game-result-area for squats, control inner elements instead
            const gra = document.getElementById('game-result-area');
            if (gra) gra.style.display = 'block';

            const boxRankScore = document.getElementById('res-rank-score-box');
            if (boxRankScore) {
                // hide rank box if not game mode
                boxRankScore.style.display = (appState.subMode === 'game') ? 'block' : 'none';
            }

            // Update Reps
            const rReps = document.getElementById('res-reps');
            if (rReps) rReps.innerText = metrics.count || 0;

            // Update Fatigue (Restore logic from submitSurvey)
            const rf = document.getElementById('res-fatigue');
            if (metrics.logs && metrics.logs.length >= 6) {
                const f = metrics.logs.slice(0, 3).reduce((a, b) => a + b.duration, 0) / 3;
                const l = metrics.logs.slice(-3).reduce((a, b) => a + b.duration, 0) / 3;
                if (rf) rf.innerText = (l / f).toFixed(2);
            } else {
                if (rf) rf.innerText = "--";
            }

            // Recalculate Science Metrics (Power, VO2, etc.)
            if (typeof calcScienceMetrics === 'function') calcScienceMetrics();

        } else if (appState.exercise === 'balance') {
            const rLabel = document.getElementById('res-simple-label');
            const rVal = document.getElementById('res-simple-val');
            if (rLabel) rLabel.innerText = "最大バランス時間";
            if (rVal) rVal.innerText = metrics.maxBalanceTime.toFixed(2) + " s";
        } else if (appState.exercise === 'banzai') {
            const rLabel = document.getElementById('res-simple-label');
            const rVal = document.getElementById('res-simple-val');
            if (rLabel) rLabel.innerText = "最大可動域 (L/R)";
            if (rVal) rVal.innerText = `${Math.floor(metrics.maxAngleL)}° / ${Math.floor(metrics.maxAngleR)}°`;
        }
    }
}


function showResultPage2() {
    const page1 = document.getElementById("res-page-1");
    const page2 = document.getElementById("res-page-2");
    if (page1 && page2) {
        page1.style.display = "none";
        page2.style.display = "flex";

        // Page2 情報更新（グラフ）
        const lbls = metrics.logs.map(d => d.rep);
        const spds = metrics.logs.map(d => d.duration);
        const dpts = metrics.logs.map(d => d.depth);
        const clrs = metrics.logs.map(d => (d.note === "Perfect") ? '#00e676' : '#ff1744');

        if (window.mySpeedChart) window.mySpeedChart.destroy();
        if (window.myDepthChart) window.myDepthChart.destroy();

        const speedCtx = document.getElementById('speedChart')?.getContext('2d');
        const depthCtx = document.getElementById('depthChart')?.getContext('2d');

        if (speedCtx) window.mySpeedChart = new Chart(speedCtx, {
            type: 'line',
            data: { labels: lbls, datasets: [{ label: '秒数', data: spds, borderColor: '#00e676', tension: 0.3 }] }
        });

        if (depthCtx) window.myDepthChart = new Chart(depthCtx, {
            type: 'bar',
            data: { labels: lbls, datasets: [{ label: '深さ', data: dpts, backgroundColor: clrs }] },
            options: { scales: { y: { reverse: true, min: 60, max: 180 } } }
        });
    }
}


// --------- 研究指標（結果画面） ----------
function calcScienceMetrics() {
    const h_cm = parseFloat(getElSafe('user-height') && getElSafe('user-height').value) || 170;
    const w_kg = parseFloat(getElSafe('user-weight') && getElSafe('user-weight').value) || 65;
    const h_m = h_cm / 100;
    const n = metrics.count;
    let duration = 30;
    if (appState.subMode !== 'cs30' && metrics.logs.length > 0) duration = metrics.logs.reduce((a, b) => a + b.duration, 0);
    if (duration < 1) duration = 1;
    let verticalDisp = (h_m * 0.5) - CHAIR_HEIGHT;
    if (verticalDisp < 0.2) verticalDisp = 0.2;
    const stsPower = (w_kg * G_ACC * verticalDisp * n / duration) * 1.5;
    const stsPowerRel = stsPower / w_kg;
    const freqMin = n * (60 / duration);
    let predVO2 = (1.8 * verticalDisp * freqMin) + 3.5 + 3.5;
    const mets = predVO2 / 3.5;

    const elP = getElSafe('val-power'); if (elP) elP.innerText = Math.round(stsPower);
    const elPr = getElSafe('val-power-rel'); if (elPr) elPr.innerText = "( " + stsPowerRel.toFixed(2) + " W/kg )";
    const elV = getElSafe('val-vo2'); if (elV) elV.innerText = Math.round(predVO2);
    const elM = getElSafe('val-mets'); if (elM) elM.innerText = mets.toFixed(1);
    const sm = getElSafe('science-metrics'); if (sm) sm.style.display = (appState.exercise === 'squat') ? 'block' : 'none';
}


// --------- 送信 / CSV ---------- //今後書き換え？
function sendToGoogleSheets() {
    const btn = getElSafe('cloud-btn');
    if (btn) { btn.innerText = "送信中..."; btn.disabled = true; }

    // --- 値を安全に取得し、"--" を "-" に変換する補助関数 ---
    const getCleanText = (id) => {
        const el = document.getElementById(id);
        if (!el) return "-";
        let text = el.innerText.trim();
        return (text === "" || text === "--") ? "-" : text;
    };

    let pID = (document.getElementById('patient-id')?.value || "Guest").trim();
    // カンマが含まれるとCSVが壊れるのでセミコロンに置換
    pID = pID.replace(/,/g, ";");
    const date = getNowStr();
    const exercise = appState.exercise;
    const subMode = appState.subMode;

    // 1. 基本情報の整理
    let modeName = (exercise === 'squat') ? subMode : exercise;
    let rpe = surveyData.rpe || "-";
    let pain = surveyData.pain || "-";

    // 2. 数値情報の取得（画面の "--" を "-" に置換）
    let rank = (subMode === 'game') ? getCleanText('res-rank') : "-";
    let score = (subMode === 'game') ? (metrics.score || "0") : "-";

    // repsの判定（モードにより中身を変える）
    let reps = "-";
    if (exercise === 'squat' || exercise === 'cs-30') {
        reps = metrics.count || "0";
    } else if (exercise === 'balance') {
        reps = metrics.maxBalanceTime || "0";
    } else if (exercise === 'banzai') {
        reps = (metrics.maxAngleL.toFixed(1) || 0) + " / " + (metrics.maxAngleR.toFixed(1) || 0);
    }

    // 3. 推定値の取得（画面から直接取る）
    let fatigue = getCleanText('res-fatigue');
    let power = getCleanText('val-power');
    let vo2 = getCleanText('val-vo2');

    // --- 【重要】GASに送る「順番」を確定させる ---
    const summaryPayload = {
        date: date,          // A列
        patientID: pID,     // B列
        mode: modeName,      // C列
        rpe: rpe,            // D列
        pain: pain,          // E列
        rank: rank,          // F列
        score: score,        // G列
        reps: reps,          // H列
        fatigue: fatigue,    // I列
        power: power,        // J列
        vo2: vo2             // K列
    };

    const payload = {
        summary: summaryPayload,
        logs: metrics.logs || []
    };

    fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain" }
    })
        .then(() => {
            alert("保存完了");
            if (btn) btn.innerText = "送信済み";
        })
        .catch(e => {
            alert("エラー");
            if (btn) { btn.disabled = false; btn.innerText = "再試行"; }
        });
}


// 関数の外（スクリプトのトップレベル）にフラグを定義
let isDownloading = false;

window.downloadCSV = function (event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (isDownloading) return;
    isDownloading = true;

    try {
        // --- sendToGoogleSheets と同じロジックでデータ収集 ---
        const getCleanText = (id) => {
            const el = document.getElementById(id);
            if (!el) return "-";
            let text = el.innerText.trim();
            return (text === "" || text === "--") ? "-" : text;
        };

        let pID = (document.getElementById('patient-id')?.value || "Guest").trim();
        pID = pID.replace(/,/g, ";"); // CSV対策

        const date = getNowStr();
        const exercise = appState.exercise;
        const subMode = appState.subMode;

        // 1. 基本情報の整理
        let modeName = (exercise === 'squat') ? subMode : exercise;
        let rpe = surveyData.rpe || "-";
        let pain = surveyData.pain || "-";

        // 2. 数値情報の取得
        let rank = (subMode === 'game') ? getCleanText('res-rank') : "-";
        let score = (subMode === 'game') ? (metrics.score || "0") : "-";

        let reps = "-";
        if (exercise === 'squat' || exercise === 'cs-30') {
            reps = metrics.count || "0";
        } else if (exercise === 'balance') {
            reps = metrics.maxBalanceTime || "0";
        } else if (exercise === 'banzai') {
            reps = (metrics.maxAngleL.toFixed(1) || 0) + " / " + (metrics.maxAngleR.toFixed(1) || 0);
        }

        // 3. 推定値の取得
        let fatigue = getCleanText('res-fatigue');
        let power = getCleanText('val-power');
        let vo2 = getCleanText('val-vo2');

        // --- CSV生成 ---
        const header = "日付,ID,モード,RPE,痛み,ランク,スコア,回数,疲労度,パワー,推定VO2\n";
        const row = `${date},${pID},${modeName},${rpe},${pain},${rank},${score},${reps},${fatigue},${power},${vo2}\n`;
        const csv = header + row;

        // --- ダウンロード処理 ---
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MPS_Result_${date.replace(/[\/ :]/g, '_')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        console.log("CSV Downloaded:", csv);

    } catch (e) {
        console.error("CSV Download Error:", e);
        alert("CSV保存エラー");
    } finally {
        // 短時間でフラグ解除
        setTimeout(() => { isDownloading = false; }, 1000);
    }
}



// --------- ボタン・イベント バインド（DOMContentLoaded 内で実行） ----------
function bindUIActions() {
    const startBtns = document.querySelectorAll('.start-btn');
    startBtns.forEach(b => b.addEventListener('click', startApp));
    const backBtns = document.querySelectorAll('[onclick^="backToMain"], [onclick*="backToMain("]');
    // backToMain を HTML 側から直接呼ぶことも想定。ただし安全に。
    const backManual = getElSafe('back-to-main-manual');
    // 明示的な要素がなければ HTML の inline onclick を使う想定なのでここでは追加バインドを最低限にする。

    // goHome / close result
    const closeButtons = document.querySelectorAll('[onclick*="location.reload"], [onclick*="goHome("]');
    closeButtons.forEach(b => {
        // leave as-is; HTML may handle it. No-op here.
    });

    // result send / csv
    const cloud = getElSafe('cloud-btn'); if (cloud) cloud.addEventListener('click', sendToGoogleSheets);
    const dl = document.querySelectorAll('.dl-btn'); dl.forEach(d => d.addEventListener('click', downloadCSV));

    // rpe slider
    const rpe = getElSafe('rpe-slider'); if (rpe) rpe.addEventListener('input', (e) => updateRPE(e.target.value));

    // BGM switch
    const bgmSwitch = getElSafe('bgm-switch');
    if (bgmSwitch) {
        bgmSwitch.addEventListener('change', (e) => {
            if (currentGainNode && audioCtx) {
                const vol = e.target.checked ? 0.4 : 0;
                // 平滑化して音量変更 (クリックノイズ防止)
                currentGainNode.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
            }
        });
    }

    // pain buttons inline onclick already set in HTML (setPain)
}


function handleBgmToggle(el) {
    if (!el.checked) {
        stopBGM();
    } else {
        playBGM(appState.exercise, appState.subMode);
    }
}

/**
 * イベントリスナーの一括登録
 */

// --------- アンケート提出 / リザルト表示 ----------
function submitSurvey() {
    // 1. 画面切り替え
    const s = getElSafe('survey-screen'); if (s) s.style.display = 'none';
    const r = getElSafe('result-screen');
    if (r) {
        r.style.display = 'flex'; // ★ 'flex' に変更してCSSのレイアウト設定を活かす
        r.scrollTop = 0;
    }

    // 2. ページ初期状態
    const p1 = getElSafe('res-page-1'); if (p1) p1.style.display = 'flex';
    const p2 = getElSafe('res-page-2'); if (p2) p2.style.display = 'none';

    // 3. 要素の取得
    const blkGameArea = getElSafe('game-result-area');     // スクワット用
    const boxRankScore = getElSafe('res-rank-score-box');  // ランク
    const rowSquatStats = getElSafe('res-squat-stats-row');// 回数・疲労度
    const blkSimple = getElSafe('res-simple-area');        // バランス・バンザイ用
    const blkScience = getElSafe('science-metrics');       // 推定値
    const btnNext = getElSafe('btn-res-next');             // 次へ
    const simpleBtns = getElSafe('simple-mode-buttons');   // 保存/DL/閉じる

    // 4. タイトル設定
    const resTitle1 = getElSafe('res-screen-title');
    if (resTitle1) {
        if (appState.exercise === 'squat') resTitle1.innerText = "SQUAT RESULT";
        else if (appState.exercise === 'balance') resTitle1.innerText = "BALANCE RESULT";
        else if (appState.exercise === 'banzai') resTitle1.innerText = "BANZAI RESULT";
    }

    // ============================================
    // 5. 分岐処理
    // ============================================

    if (appState.exercise === 'squat') {
        // --- スクワット系 ---
        if (blkGameArea) blkGameArea.style.display = 'block';
        if (blkSimple) blkSimple.style.display = 'none';
        if (blkScience) blkScience.style.display = 'block';
        if (btnNext) btnNext.style.display = 'block';
        if (simpleBtns) simpleBtns.style.display = 'none';

        if (rowSquatStats) rowSquatStats.style.display = 'flex';

        // 回数の更新
        const rReps = getElSafe('res-reps');
        if (rReps) rReps.innerText = metrics.count || 0;

        // 疲労度の更新
        const rf = getElSafe('res-fatigue');
        if (metrics.logs && metrics.logs.length >= 6) {
            const f = metrics.logs.slice(0, 3).reduce((a, b) => a + b.duration, 0) / 3;
            const l = metrics.logs.slice(-3).reduce((a, b) => a + b.duration, 0) / 3;
            if (rf) rf.innerText = (l / f).toFixed(2);
        } else {
            if (rf) rf.innerText = "--";
        }

        // ランク・スコア (ゲームモードのみ)
        if (appState.subMode === 'game') {
            if (boxRankScore) boxRankScore.style.display = 'block';

            const rScore = getElSafe('res-score-final');
            const rRank = getElSafe('res-rank');
            const scoreBox = getElSafe('res-rank-score-box'); // 親ボックスを取得

            if (rRank) {
                let score = metrics.score || 0;
                let count = Math.max(metrics.count, 1);
                let rank = "B";
                let mainColor = "#ffffff"; // ランクごとのテーマ色
                let glow = "none";

                // --- ランク判定と色の決定 ---
                if (score > count * 120) {
                    rank = "S";
                    mainColor = "#00ffff"; // シアン
                    glow = "0 0 20px rgba(0, 255, 255, 0.6)";
                } else if (score > count * 100) {
                    rank = "A";
                    mainColor = "#ffd700"; // ゴールド
                    glow = "0 0 15px rgba(255, 215, 0, 0.5)";
                } else {
                    rank = "B";
                    mainColor = "#ff8a65"; // 銅色に近いオレンジ
                    glow = "none";
                }

                // --- スタイルの一括適用 ---
                // 1. ランク文字
                rRank.innerText = rank;
                rRank.style.color = mainColor;
                rRank.style.textShadow = glow;

                // 2. スコア部分（ラベルと数値の両方を含むボックス全体）
                if (scoreBox) {
                    // ボックス内のすべての文字色をランクの色に合わせる
                    scoreBox.style.color = mainColor;
                }

                // 3. スコアの数値だけを更新
                if (rScore) {
                    rScore.innerText = score;
                    rScore.style.color = mainColor; // 数値も同じ色に
                }
            }
        } else {
            // CS-30（appState.exercise === 'cs30'）や
            // 通常トレーニング時はここに入り、確実に非表示にする
            if (boxRankScore) boxRankScore.style.display = 'none';
        }

        if (typeof calcScienceMetrics === 'function') calcScienceMetrics();
        initSquatCharts();

    } else {
        // --- バランス / バンザイ系 ---
        if (blkGameArea) blkGameArea.style.display = 'none';
        if (blkSimple) blkSimple.style.display = 'flex';    // ★ ここを表示させる
        if (blkScience) blkScience.style.display = 'none';   // ★ 推定値非表示
        if (btnNext) btnNext.style.display = 'none';         // ★ 次へを隠す
        if (simpleBtns) simpleBtns.style.display = 'flex';   // ★ 保存ボタン等を表示

        const labelEl = getElSafe('res-simple-label');
        const valEl = getElSafe('res-simple-val');

        if (appState.exercise === 'balance') {
            // 片足立ち
            if (labelEl) labelEl.innerText = "最大バランス時間";
            let val = metrics.maxBalanceTime || 0;
            if (valEl) valEl.innerText = val.toFixed(2) + " s";
        } else {
            // バンザイ (banzai)
            if (labelEl) labelEl.innerText = "最大可動域 (L/R)";
            let angL = Math.floor(metrics.maxAngleL || 0);
            let angR = Math.floor(metrics.maxAngleR || 0);
            if (valEl) valEl.innerText = angL + "°/" + angR + "°";
        }
    }
}

function initSquatCharts() {
    const lbls = metrics.logs.map(d => d.rep);
    const spds = metrics.logs.map(d => d.duration);
    const dpts = metrics.logs.map(d => d.depth);
    const clrs = metrics.logs.map(d => (d.note === "Perfect") ? '#00e676' : '#ff1744');

    const speedCtx = getElSafe('speedChart') ? getElSafe('speedChart').getContext('2d') : null;
    const depthCtx = getElSafe('depthChart') ? getElSafe('depthChart').getContext('2d') : null;

    if (speedCtx) {
        if (window.mySpeedChart) window.mySpeedChart.destroy();
        window.mySpeedChart = new Chart(speedCtx, {
            type: 'line',
            data: { labels: lbls, datasets: [{ label: '秒数', data: spds, borderColor: '#00e676', tension: 0.3 }] }
        });
    }
    if (depthCtx) {
        if (window.myDepthChart) window.myDepthChart.destroy();
        window.myDepthChart = new Chart(depthCtx, {
            type: 'bar',
            data: { labels: lbls, datasets: [{ label: '深さ', data: dpts, backgroundColor: clrs }] },
            options: { scales: { y: { reverse: true, min: 60, max: 180 } } }
        });
    }
}

// 初期状態
surveyData.pain = "None";
function setupEventListeners() {
    console.log("Setting up event listeners...");

    // --- カテゴリ・モード選択 ---
    document.getElementById("btn-cat-squat")?.addEventListener("click", () => selectCategory("squat"));
    document.getElementById("btn-cat-measure")?.addEventListener("click", () => selectCategory("measure"));

    // スクワットサブモード
    ["slow", "self", "game"].forEach(mode => {
        document.getElementById(`opt-${mode}`)?.addEventListener("click", () => setSquatMode(mode));
    });

    // 測定系モード
    document.getElementById("opt-cs30")?.addEventListener("click", () => setMode("squat", "cs30"));
    document.getElementById("opt-balance")?.addEventListener("click", () => setMode("balance", "normal"));
    document.getElementById("opt-banzai")?.addEventListener("click", () => setMode("banzai", "normal"));

    // --- アプリ制御系 ---
    document.querySelectorAll(".start-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            console.log("Start button clicked");
            startApp();
        });
    });

    document.getElementById("btn-finish")?.addEventListener("click", finishSession);

    // 戻る/ホーム
    ["btn-back-main-1", "btn-back-main-2"].forEach(id => {
        document.getElementById(id)?.addEventListener("click", backToMain);
    });

    // 閉じるボタン（リロード）
    document.querySelectorAll(".close-btn, [onclick*='location.reload']").forEach(btn => {
        btn.addEventListener("click", () => location.reload());
    });

    // --- BGM・アンケート ---
    const bgmSwitch = document.getElementById('bgm-switch');
    // Web Audio API対応の音量切り替え
    bgmSwitch?.addEventListener('change', (e) => {
        if (typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (typeof currentGainNode !== 'undefined' && currentGainNode && typeof audioCtx !== 'undefined' && audioCtx) {
            const vol = e.target.checked ? 0.4 : 0;
            try {
                // 平滑化して変更
                currentGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
                currentGainNode.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
            } catch (err) {
                // フォールバック
                currentGainNode.gain.value = vol;
            }
        }
    });

    const rpeSlider = document.getElementById("rpe-slider");
    const rpeVal = document.getElementById("rpe-val");

    if (rpeSlider) {
        rpeSlider.addEventListener("input", () => {
            const v = rpeSlider.value;

            rpeVal.textContent = v;      // 表示更新
            surveyData.rpe = v;          // 保存
        });
    }

    const painButtons = document.querySelectorAll(".pain-btn");
    const noneBtn = document.getElementById("pain-none");

    painButtons.forEach(btn => {
        btn.addEventListener("click", () => {

            const v = btn.dataset.pain;
            const allBtns = document.querySelectorAll(".pain-btn");

            if (v === "None") {

                // --- 「なし」押下 ---
                surveyData.pain = "None";

                allBtns.forEach(b => {
                    b.classList.remove("active");
                    b.classList.remove("active-none");
                });

                btn.classList.add("active-none");

            } else {

                // --- 膝・腰・他 ---
                if (noneBtn) noneBtn.classList.remove("active-none");

                btn.classList.toggle("active");

                let selected = [];

                allBtns.forEach(b => {
                    if (b.classList.contains("active")) {
                        selected.push(b.dataset.pain);
                    }
                });

                surveyData.pain =
                    selected.length > 0 ? selected.join(";") : "None";

                if (selected.length === 0 && noneBtn) {
                    noneBtn.classList.add("active-none");
                    surveyData.pain = "None";
                }
            }

            console.log("Pain:", surveyData.pain);
        });
    });


    const submitBtn = document.getElementById("btn-submit-survey");
    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            submitSurvey();

            // safety: リロード後トップに戻す（念のため）
            if (localStorage.getItem('backToTop')) {
                document.documentElement.style.overflow = 'hidden';
                window.scrollTo(0, 0);
                let lock = setInterval(() => window.scrollTo(0, 0), 50);
                setTimeout(() => {
                    clearInterval(lock);
                    document.documentElement.style.overflow = '';
                    localStorage.removeItem('backToTop');
                }, 1500);
            }
        });
    }

    // --- データ保存 ---
    document.querySelectorAll('.dl-btn').forEach(btn => {
        btn.addEventListener('click', (e) => downloadCSV(e));
    });
    document.querySelectorAll('.cloud-btn').forEach(btn => {
        btn.addEventListener('click', () => sendToGoogleSheets());
    });

    // リザルト画面のページ切り替え
    document.getElementById('btn-res-next')?.addEventListener('click', showResultPage2);
    document.getElementById('btn-res-prev')?.addEventListener('click', showResultPage1);
}

/**
 * 最終的な初期化実行
 */
// 最終的な初期化実行
async function initApp() {
    console.log("Initializing App...");
    setupElements();
    setupEventListeners();
    try {
        await initPoseLandmarker();
        console.log("Pose Landmarker Ready");
    } catch (e) {
        console.error("Initialization failed:", e);
    }
    showScreen('start');
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}






// EOF
