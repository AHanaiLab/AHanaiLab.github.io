// URLはご自身のものに書き換えてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbyKqUnAi2JcfbQCzeI4498mTYEXFDCo1itE9pdnOQB9JJfyFHGvM4Z2SpkZsMjGRPsk/exec";

const KNEE_IN_THRESHOLD = 0.04;
const BAD_POSTURE_ANGLE = 75;
const RESET_ANGLE = 160;
const DEPTH_THRESHOLD = 130;
const SPEECH_COOLDOWN = 3000;
const SLOW_CYCLE_MS = 7000;
const MONSTERS = [["👾", 300], ["🦇", 500], ["👻", 800], ["👹", 1200], ["🐲", 2000]];

// 物理演算用定数（CS30/CS60 推定用）
const G_ACC = 9.81;       // 重力加速度 (m/s^2)
const CHAIR_HEIGHT = 0.40; // 椅子の高さ (m) 仮定


let appState = { exercise: "", subMode: "", isRunning: false, isFinished: false, isCameraReady: false, startTime: null, repStart: 0, patientID: "Guest" };
let metrics = {
    count: 0, minAngle: 180, isDeep: false, isMoving: false, isClean: true,
    score: 0, combo: 0, maxCombo: 0, monsterLevel: 0, monsterHP: 0, defeated: 0, logs: [],
    isBalancing: false, balanceStart: 0, currentBalanceTime: 0, maxBalanceTime: 0,
    maxAngleL: 0, maxAngleR: 0
};
let surveyData = { rpe: 3, pain: "None" };
let audioCtx = null;
let lastSpeechTime = 0;

function getEl(id) { return document.getElementById(id); }
const videoElement = getEl('input_video');
const canvasElement = getEl('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// ★ 修正: 不足していたDOM要素をelsに追加
const els = {
    uiSquat: getEl('squat-ui'), uiBalance: getEl('balance-ui'), uiBanzai: getEl('banzai-ui'),
    uiTraining: getEl('training-info'), uiGame: getEl('game-info'),

    depthGaugeContainer: getEl('depth-gauge-container'), // 追加
    depthBar: getEl('depth-bar'), targetLine: getEl('target-line'), targetLabel: getEl('target-label'),
    pacerGhost: getEl('pacer-ghost'), pacerContainer: getEl('pacer-container'),
    trReps: getEl('tr-reps'), trSpeed: getEl('tr-speed'), trTimer: getEl('tr-timer'), trPacerBox: getEl('tr-pacer-box'), trPacerVal: getEl('tr-pacer-val'),

    gmScoreBoard: getEl('gm-score-board'), gmScore: getEl('gm-score'), comboDisp: getEl('combo-display'),
    battleStage: getEl('battle-stage'), monster: getEl('monster'), monsterName: getEl('monster-name'), hpBar: getEl('hp-bar'), hpText: getEl('hp-text'),
    gmComboVal: getEl('gm-combo-val'), gmLvlVal: getEl('gm-lvl-val'),

    balTimer: getEl('bal-timer'), balStatus: getEl('bal-status'), balBest: getEl('bal-best'),
    bzAngleL: getEl('bz-angle-l'), bzAngleR: getEl('bz-angle-r'), bzBarL: getEl('banzai-bar-L'), bzBarR: getEl('banzai-bar-R'),

    statusLamp: getEl('status-lamp'), warningMsg: getEl('warning-msg'),
    countOverlay: getEl('countdown-overlay'), countVal: getEl('countdown-val'),
    startScreen: getEl('start-screen'), surveyScreen: getEl('survey-screen'), resScreen: getEl('result-screen'),
    genericMenu: getEl('generic-menu'), squatMenu: getEl('squat-menu'), measureMenu: getEl('measure-menu'), mainMenu: getEl('main-menu')
};

function initAudio() { if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } if (audioCtx.state === 'suspended') audioCtx.resume(); }
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
function fireConfetti() { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#ffd700', '#00e676', '#2979ff'] }); }
function showComboEffect(val) { els.comboDisp.innerText = val + " COMBO!"; els.comboDisp.classList.add("combo-active"); playSound('hit'); setTimeout(() => els.comboDisp.classList.remove("combo-active"), 800); }

function updateRPE(val) { document.getElementById('rpe-val').innerText = val; surveyData.rpe = val; }
function setPain(val, btn) { surveyData.pain = val; document.querySelectorAll('.pain-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }

// Game Logic
function spawnMonster() { let lv = metrics.monsterLevel; if (lv >= MONSTERS.length) lv = MONSTERS.length - 1; const m = MONSTERS[lv]; els.monster.innerText = m[0]; els.monsterName.innerText = `Lv.${lv + 1} ${m[1]}`; metrics.monsterHP = m[1]; updateHP(m[1], m[1]); }
function updateHP(cur, max) { const p = (cur / max) * 100; els.hpBar.style.width = p + "%"; els.hpText.innerText = `${cur} / ${max}`; }
function updateScore(val) { metrics.score += val; els.gmScore.innerText = metrics.score; }
function damageEffect(dmg, isCrit) {
    metrics.monsterHP -= dmg; if (metrics.monsterHP < 0) metrics.monsterHP = 0; updateHP(metrics.monsterHP, MONSTERS[Math.min(metrics.monsterLevel, 4)][1]);
    els.monster.classList.remove('damage-shake'); void els.monster.offsetWidth; els.monster.classList.add('damage-shake');
    if (isCrit) { playSound('crit'); fireConfetti(); } else { playSound('hit'); }
    if (metrics.monsterHP <= 0) {
        setTimeout(() => {
            playSound('win'); speak("撃破！"); metrics.monsterLevel++; metrics.defeated++;

            // ★★★ 追加：レベル5倒したらゲームクリア ★★★
            if (metrics.monsterLevel >= 5) {
                finishSession();   // リザルト画面へ
                return;
            }


            spawnMonster();
        }, 500);
    }
}

// Flow Control
function selectCategory(cat) {
    appState.exercise = cat;
    if (cat === 'squat') {
        getEl('main-menu').style.display = 'none'; getEl('squat-menu').style.display = 'flex';
        setSquatMode('slow');
    } else if (cat === 'measure') {
        getEl('main-menu').style.display = 'none'; getEl('measure-menu').style.display = 'flex';
        setMode('squat', 'cs30');
    }
}

function setSquatMode(mode) {
    appState.subMode = mode;
    ['slow', 'self', 'cs30', 'game'].forEach(m => getEl('opt-' + m).classList.remove('selected'));
    getEl('opt-' + mode).classList.add('selected');
}

function setMode(ex, sub) {
    appState.exercise = ex; appState.subMode = sub;
    const container = els.measureMenu;
    const btns = container.getElementsByClassName('sub-btn');
    for (let b of btns) b.classList.remove('selected');
    const btn = document.getElementById('opt-' + (ex === 'squat' ? 'cs30' : ex));
    if (btn) btn.classList.add('selected');
}

function backToMain() {
    getEl('squat-menu').style.display = 'none'; getEl('measure-menu').style.display = 'none';
    getEl('main-menu').style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function goHome() {
    // すべての画面を閉じる
    getEl('squat-ui').style.display = 'none';
    getEl('balance-ui').style.display = 'none';
    getEl('banzai-ui').style.display = 'none';
    getEl('result-screen').style.display = 'none';
    getEl('survey-screen').style.display = 'none';

    // メニューを表示
    getEl('main-menu').style.display = 'flex';
    getEl('start-screen').style.display = 'flex';

    // ★ まずハッシュジャンプ（ブラウザ標準）
    location.hash = "#top";

    // ★ UI レイアウトが安定するまで何度も 0 に押し戻す
    let lock = setInterval(() => {
        window.scrollTo(0, 0);
    }, 30);

    // ★ 0.6 秒後に解除（十分安定）
    setTimeout(() => {
        clearInterval(lock);
    }, 600);
}

function startApp() {
    appState.patientID = getEl('patient-id').value || "Guest";
    els.startScreen.style.display = 'none';
    initAudio(); speak("カメラを起動します");

    els.uiSquat.style.display = 'none'; els.uiBalance.style.display = 'none'; els.uiBanzai.style.display = 'none';

    if (appState.exercise === 'squat') {
        els.uiSquat.style.display = 'block';
        if (appState.subMode === 'game') {
            els.uiGame.style.display = 'block'; els.uiTraining.style.display = 'none'; spawnMonster();
        } else {
            els.uiTraining.style.display = 'block'; els.uiGame.style.display = 'none';
            els.trTimer.style.display = (appState.subMode === 'cs30') ? 'block' : 'none';
            els.trPacerBox.style.display = (appState.subMode === 'slow') ? 'block' : 'none';
        }
        // ★修正：スロトレ以外は非表示
        els.pacerContainer.style.display = (appState.subMode === 'slow') ? 'block' : 'none';
    } else if (appState.exercise === 'balance') {
        els.uiBalance.style.display = 'block';
    } else {
        els.uiBanzai.style.display = 'block';
    }

    // グローバル変数としてカメラを保持
    if (!window.camera) {
        window.camera = new Camera(videoElement, {
            onFrame: async () => { if (!appState.isFinished) await pose.send({ image: videoElement }); },
            width: 1280, height: 720
        });
        window.camera.start();
    }
    if (appState.exercise === 'squat') animatePacerLoop();
}

function runCountdown() {
    let c = 5; els.countOverlay.style.display = 'flex'; els.countVal.innerText = c; playSound('count');
    const timer = setInterval(() => {
        c--; els.countVal.innerText = c; if (c > 0) playSound('count');
        if (c <= 0) {
            clearInterval(timer); els.countVal.innerText = "START!"; playSound('start');
            setTimeout(() => { els.countOverlay.style.display = 'none'; appState.startTime = Date.now(); appState.isRunning = true; }, 1000);
        }
    }, 1000);
}

function finishSession() {
    appState.isFinished = true; appState.isRunning = false;
    speak("終了です"); document.querySelector('.container').style.display = 'none'; els.surveyScreen.style.display = 'flex';
}
/*以下の関数は元の元から丸替え*/
function submitSurvey() {
    els.surveyScreen.style.display = 'none';
    els.resScreen.style.display = 'flex';

    if (appState.exercise === 'squat') {
        getEl('res-squat-area').style.display = 'block';
        getEl('res-simple-area').style.display = 'none';
        getEl('res-reps').innerText = metrics.count;

        if (appState.subMode === 'game') {
            getEl('game-result-area').style.display = 'block';
            getEl('res-score-final').innerText = metrics.score;
            let r = "B";
            if (metrics.score > metrics.count * 120) r = "S";
            else if (metrics.score > metrics.count * 100) r = "A";
            getEl('res-rank').innerText = r;
        } else {
            getEl('game-result-area').style.display = 'none';
        }

        const lbls = metrics.logs.map(d => d.rep);
        const spds = metrics.logs.map(d => d.duration);
        const dpts = metrics.logs.map(d => d.depth);
        const clrs = metrics.logs.map(d => (d.note === "Perfect") ? '#00e676' : '#ff1744');

        // 既存チャートの再生成に備えて破棄
        if (window.mySpeedChart) window.mySpeedChart.destroy();
        if (window.myDepthChart) window.myDepthChart.destroy();

        window.mySpeedChart = new Chart(getEl('speedChart'), {
            type: 'line',
            data: {
                labels: lbls,
                datasets: [{
                    label: '秒数',
                    data: spds,
                    borderColor: '#00e676',
                    tension: 0.3
                }]
            }
        });

        window.myDepthChart = new Chart(getEl('depthChart'), {
            type: 'bar',
            data: {
                labels: lbls,
                datasets: [{
                    label: '深さ',
                    data: dpts,
                    backgroundColor: clrs
                }]
            },
            options: {
                scales: {
                    y: {
                        reverse: true,
                        min: 60,
                        max: 180
                    }
                }
            }
        });

        if (metrics.logs.length >= 6) {
            const f = metrics.logs.slice(0, 3).reduce((a, b) => a + b.duration, 0) / 3;
            const l = metrics.logs.slice(-3).reduce((a, b) => a + b.duration, 0) / 3;
            getEl('res-fatigue').innerText = (l / f).toFixed(2);
        }

        // ★ ここで研究用指標を計算・表示
        calcScienceMetrics();

    } else {
        // バランス / バンザイなど
        getEl('res-squat-area').style.display = 'none';
        getEl('res-simple-area').style.display = 'block';

        if (appState.exercise === 'balance') {
            getEl('res-simple-label').innerText = "最大バランス時間";
            getEl('res-simple-val').innerText = metrics.maxBalanceTime.toFixed(2) + " s";
        } else {
            getEl('res-simple-label').innerText = "最大可動域 (L/R)";
            getEl('res-simple-val').innerText =
                `${Math.floor(metrics.maxAngleL)}° / ${Math.floor(metrics.maxAngleR)}°`;
        }
    }
}
function animatePacerLoop() {
    if (!appState.isFinished && appState.subMode === 'slow') {
        if (appState.isRunning && appState.startTime) {
            const t = (Date.now() - appState.startTime) % SLOW_CYCLE_MS; let pos = 0;
            if (t < 3000) pos = 100 - (t / 3000 * 100); else if (t < 6000) pos = (t - 3000) / 3000 * 100; else pos = 100;
            els.pacerGhost.style.top = pos + "%";
            const cycles = Math.floor((Date.now() - appState.startTime) / SLOW_CYCLE_MS);
            els.trPacerVal.innerText = cycles;
        } else { els.pacerGhost.style.top = "100%"; }
        requestAnimationFrame(animatePacerLoop);
    }
}

function checkBalance(lAnkle, rAnkle) {
    const diff = Math.abs(lAnkle.y - rAnkle.y);
    if (diff > 0.05) {
        if (!metrics.isBalancing) { metrics.isBalancing = true; metrics.balanceStart = Date.now(); speak("計測ちゅう"); els.balStatus.innerText = "計測中"; els.balStatus.style.color = "#00e676"; }
        const t = (Date.now() - metrics.balanceStart) / 1000;
        metrics.currentBalanceTime = t;
        if (t > metrics.maxBalanceTime) metrics.maxBalanceTime = t;
        els.balTimer.innerText = t.toFixed(2);
    } else {
        if (metrics.isBalancing) { metrics.isBalancing = false; speak("ストップ"); els.balStatus.innerText = "足をつきました"; els.balStatus.style.color = "#ff1744"; els.balBest.innerText = metrics.maxBalanceTime.toFixed(2); }
    }
}

function checkBanzai(sL, eL, sR, eR, hL, hR) {
    const angL = calculateAngle(hL, sL, eL); const angR = calculateAngle(hR, sR, eR);
    if (angL > metrics.maxAngleL) metrics.maxAngleL = angL; if (angR > metrics.maxAngleR) metrics.maxAngleR = angR;
    els.bzAngleL.innerText = Math.floor(angL) + "°"; els.bzAngleR.innerText = Math.floor(angR) + "°";
    els.bzBarL.style.height = (angL / 180 * 100) + "%"; els.bzBarR.style.height = (angR / 180 * 100) + "%";
}

function onResults(results) {
    if (appState.isFinished) return;

    // カメラ準備完了検知
    if (!appState.isCameraReady) {
        appState.isCameraReady = true;
        if (appState.exercise === 'squat') {
            els.depthGaugeContainer.style.display = 'block';
            els.targetLabel.style.display = 'block';
            // スロトレとセルフならペーサー表示
            if (appState.subMode === 'slow' || appState.subMode === 'self') els.pacerContainer.style.display = 'block';

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

    canvasElement.width = videoElement.videoWidth; canvasElement.height = videoElement.videoHeight;
    canvasCtx.save(); canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
        const lms = results.poseLandmarks;
        // ★ 骨格マーカーを最優先で描画
        /*変更箇所はここから*/
        //drawConnectors(canvasCtx, lms, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
        //drawLandmarks(canvasCtx, lms, { color: '#FF0000', lineWidth: 2 });

        // === 顔ランドマークの定義（0〜10 が顔まわり）===
        const FACE_LANDMARKS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

        // === 顔を含まないコネクションだけを抽出して描画 ===
        const BODY_CONNECTIONS = POSE_CONNECTIONS.filter(([a, b]) =>
            !FACE_LANDMARKS.has(a) && !FACE_LANDMARKS.has(b)
        );
        drawConnectors(canvasCtx, lms, BODY_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });

        // === 顔を除いたランドマークだけ点を描画 ===
        const bodyLandmarks = [];
        for (let i = 0; i < lms.length; i++) {
            if (!FACE_LANDMARKS.has(i)) {
                bodyLandmarks.push(lms[i]);
            }
        }
        drawLandmarks(canvasCtx, bodyLandmarks, { color: '#FF0000', lineWidth: 2 });
        /*変更箇所はここまで*/

        if (appState.exercise === 'balance') {
            if (lms[27].visibility > 0.5 && lms[28].visibility > 0.5) checkBalance(lms[27], lms[28]);
        } else if (appState.exercise === 'banzai') {
            if (lms[11].visibility > 0.5 && lms[23].visibility > 0.5) checkBanzai(lms[11], lms[13], lms[12], lms[14], lms[23], lms[24]);
        } else {
            // Squat Logic
            let side = "RIGHT", sIdx = 12, hIdx = 24, kIdx = 26, aIdx = 28;
            if (lms[11].visibility > lms[12].visibility) { side = "LEFT"; sIdx = 11; hIdx = 23; kIdx = 25; aIdx = 27; }
            if (lms[sIdx].visibility > 0.5 && lms[hIdx].visibility > 0.5) {
                const kneeAngle = calculateAngle(lms[hIdx], lms[kIdx], lms[aIdx]);
                const hipAngle = calculateAngle(lms[sIdx], lms[hIdx], lms[kIdx]);

                // UI
                const minAng = 180, maxAng = 70;
                let p = (minAng - kneeAngle) / (minAng - maxAng) * 100; if (p < 0) p = 0; if (p > 100) p = 100;
                els.depthBar.style.height = p + "%";
                let tp = (minAng - DEPTH_THRESHOLD) / (minAng - maxAng) * 100; els.targetLine.style.top = tp + "%"; els.targetLabel.style.top = tp + "%";
                if (appState.subMode === 'self' || appState.subMode === 'game') els.pacerGhost.style.top = p + "%";

                canvasCtx.beginPath(); canvasCtx.moveTo(lms[sIdx].x * canvasElement.width, lms[sIdx].y * canvasElement.height); canvasCtx.lineTo(lms[hIdx].x * canvasElement.width, lms[hIdx].y * canvasElement.height); canvasCtx.lineTo(lms[kIdx].x * canvasElement.width, lms[kIdx].y * canvasElement.height); canvasCtx.strokeStyle = "yellow"; canvasCtx.lineWidth = 5; canvasCtx.stroke();

                let warning = "", isKneeIn = false;
                if (side === "RIGHT" && lms[kIdx].x > lms[aIdx].x + KNEE_IN_THRESHOLD) isKneeIn = true;
                if (side === "LEFT" && lms[kIdx].x < lms[aIdx].x - KNEE_IN_THRESHOLD) isKneeIn = true;
                if (isKneeIn && kneeAngle < 160) { if (metrics.isMoving && metrics.isClean) { warning = "ひざを開いて！"; metrics.isClean = false; speak("ひざ"); playSound('ng'); } }
                if (hipAngle < BAD_POSTURE_ANGLE && kneeAngle < 160) { if (metrics.isMoving && metrics.isClean) { warning = "胸を張って！"; metrics.isClean = false; speak("むね"); playSound('ng'); } }
                if (warning) { els.warningMsg.innerText = warning; els.warningMsg.style.display = 'block'; } else { els.warningMsg.style.display = 'none'; }

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
                                    els.gmComboVal.innerText = metrics.combo;
                                } else {
                                    els.trReps.innerText = metrics.count; els.trSpeed.innerText = dur.toFixed(2);
                                    if (metrics.isClean) speak("OK", true);
                                }

                                let note = "Perfect"; if (warning) note = "Error";
                                metrics.logs.push({ id: appState.patientID, time: getNowStr(), rep: metrics.count, depth: Math.floor(metrics.minAngle), duration: parseFloat(dur.toFixed(2)), note: note });
                            }
                            metrics.isMoving = false;
                        }
                    }
                }
                if (metrics.isDeep) { els.statusLamp.innerText = "OK!"; els.statusLamp.className = "status-lamp lamp-ready"; } else { els.statusLamp.innerText = "しゃがむ"; els.statusLamp.className = "status-lamp lamp-squat"; }
            }
        }
    }
    if (appState.subMode === 'cs30' && appState.isRunning && !appState.isFinished) { const elap = (Date.now() - appState.startTime) / 1000; let rem = 30 - elap; if (rem <= 0) { rem = 0; finishSession(); } els.trTimer.innerText = Math.ceil(rem); }
    canvasCtx.restore();
}

/*以下の関数を追加*/
// === CS30/CS60 から筋パワー・VO2peak推定 ===
function calcScienceMetrics() {
    // 入力値
    const h_cm = parseFloat(getEl('user-height').value) || 170;
    const w_kg = parseFloat(getEl('user-weight').value) || 65;
    const h_m = h_cm / 100;

    // 測定値（立ち座り回数）
    const n = metrics.count;

    // 実施時間の推定
    // CS30 のときは 30 秒、それ以外はログの合計時間から近似
    let duration = 30;
    if (appState.subMode !== 'cs30' && metrics.logs.length > 0) {
        duration = metrics.logs.reduce((a, b) => a + b.duration, 0);
    }
    if (duration < 1) duration = 1; // 0 除算ガード

    // --- 1. 下肢筋パワー (Alcazar et al. 2018ベース) ---
    // 重心の垂直移動距離: 身長の 50% - 椅子高
    let verticalDisp = (h_m * 0.5) - CHAIR_HEIGHT;
    if (verticalDisp < 0.2) verticalDisp = 0.2; // 最小値ガード

    // STS Mean Power = mass * g * disp * n / T * 1.5 （エキセントリック分を含める係数）
    const stsPower = (w_kg * G_ACC * verticalDisp * n / duration) * 1.5;
    const stsPowerRel = stsPower / w_kg;

    // --- 2. 推定 VO2peak (ACSM Stepping 式を簡略応用) ---
    // 1分あたり回数
    const freqMin = n * (60 / duration);

    // VO2 ≒ 1.8 * verticalDisp * freqMin + 3.5 + 3.5
    // 追加の 3.5 はスクワットが踏み台より筋量が大きいことへの簡易補正
    let predVO2 = (1.8 * verticalDisp * freqMin) + 3.5 + 3.5;
    const mets = predVO2 / 3.5;

    // UI に反映
    getEl('val-power').innerText = Math.round(stsPower);
    getEl('val-power-rel').innerText = stsPowerRel.toFixed(2) + " W/kg";

    getEl('val-vo2').innerText = Math.round(predVO2);
    getEl('val-mets').innerText = mets.toFixed(1);

    // スクワット系モードのときのみ表示
    getEl('science-metrics').style.display = (appState.exercise === 'squat') ? 'block' : 'none';
}


function sendToGoogleSheets() {
    const btn = getEl('cloud-btn'); btn.innerText = "送信中..."; btn.disabled = true;
    const sID = appState.patientID + "_" + Date.now();
    const fatigue = (appState.exercise === 'squat') ? getEl('res-fatigue').innerText : "-";
    let scoreVal = metrics.score, maxVal = metrics.maxCombo;
    if (appState.exercise === 'balance') maxVal = metrics.maxBalanceTime;
    if (appState.exercise === 'banzai') scoreVal = (metrics.maxAngleL + metrics.maxAngleR) / 2;
    const payload = {
        sessionID: sID,
        summary: {
            patientID: appState.patientID, date: getNowStr(),
            mode: appState.exercise + "_" + appState.subMode,
            reps: metrics.count, score: scoreVal,
            maxCombo: maxVal, fatigue: fatigue,
            rpe: surveyData.rpe, pain: surveyData.pain
        },
        logs: metrics.logs
    };
    fetch(GAS_URL, { method: 'POST', body: JSON.stringify(payload), headers: { "Content-Type": "text/plain" } })
        .then(() => { alert("完了"); btn.innerText = "送信済み"; })
        .catch(e => { alert("エラー"); btn.disabled = false; });
}

function downloadCSV() {
    let c = "ID,Time,Rep,Depth,Duration,Note\n";
    metrics.logs.forEach(r => c += `${r.id},${r.time},${r.rep},${r.depth},${r.duration},${r.note}\n`);
    const a = document.createElement("a"); a.href = encodeURI("data:text/csv;charset=utf-8," + c); a.download = "log.csv"; a.click();
}

const pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
pose.onResults(onResults);
