// ===============================
// Web Audio API 初期化 & Safari対策
// ===============================
let audioCtx, bgmGain, seGain, voiceGain;
let isUserActivated = false;

function ensureAudioContext() {
    if (!audioCtx || audioCtx.state === "closed") {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        bgmGain = audioCtx.createGain();
        seGain = audioCtx.createGain();
        voiceGain = audioCtx.createGain();
        bgmGain.connect(audioCtx.destination);
        seGain.connect(audioCtx.destination);
        voiceGain.connect(audioCtx.destination);
    }
}

function resumeAudioContext() {
    ensureAudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}
function enableAudio() {
    if (!isUserActivated) {
        resumeAudioContext();
        isUserActivated = true;
    }
}
document.addEventListener('touchstart', enableAudio, { once: true });
document.addEventListener('click', enableAudio, { once: true });

// ===============================
// BGM
// ===============================
let bgmBuffer, bgmSource, bgmStartTime = 0, bgmPauseTime = 0, userWantsBGM = false;
function loadBGM(url) {
    ensureAudioContext();
    return fetch(url)
        .then(r => r.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(decoded => { bgmBuffer = decoded; });
}
function playBGM() {
    ensureAudioContext();
    if (!bgmBuffer) return;
    userWantsBGM = true;
    if (audioCtx.state === 'suspended') resumeAudioContext();

    if (bgmSource) {
        bgmSource.stop();
        bgmSource.disconnect();
    }

    bgmSource = audioCtx.createBufferSource();
    bgmSource.buffer = bgmBuffer;
    bgmSource.connect(bgmGain);
    bgmSource.loop = true;

    // 停止時間を考慮して再開位置を計算
    const offset = bgmPauseTime % bgmBuffer.duration;
    bgmStartTime = audioCtx.currentTime - offset;

    bgmSource.start(0, offset);
    bgmSource.onended = () => { bgmSource = null; };
}

function stopBGM() {
    ensureAudioContext();
    if (bgmSource) {
        // 再生経過時間を計算（ループを考慮）
        bgmPauseTime = (audioCtx.currentTime - bgmStartTime) % bgmBuffer.duration;
        bgmSource.stop();
        bgmSource.disconnect();
        bgmSource = null;
    }
    userWantsBGM = false;
}

function resetBGM() {
    ensureAudioContext();
    if (bgmSource) {
        bgmSource.stop();
        bgmSource.disconnect();
        bgmSource = null;
    }
    bgmPauseTime = 0;
    userWantsBGM = false;
}
function setBGMVolume(vol) {
    ensureAudioContext();
    bgmGain.gain.value = vol;
}

// SE（効果音）
const seFiles = {
    countdown: "assets/se/countdown.mp3",
    countToRest: "assets/se/countToRest.mp3",
    startOfRest: "assets/se/startOfRest.mp3"
};
const seBuffers = {}, seState = {};
async function loadSE(name, url) {
    ensureAudioContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    seBuffers[name] = decoded;
    seState[name] = { source: null, startTime: 0, pauseTime: 0 };
}
function playSE(name) {
    ensureAudioContext();
    if (!seBuffers[name]) return;
    if (audioCtx.state === 'suspended') resumeAudioContext();
    const state = seState[name];
    if (state.source) { state.source.stop(); state.source.disconnect(); }
    const source = audioCtx.createBufferSource();
    source.buffer = seBuffers[name];
    source.connect(seGain);
    state.startTime = audioCtx.currentTime;
    source.start(0, state.pauseTime);
    state.source = source;
    source.onended = () => { if (state.source === source) { state.source = null; state.pauseTime = 0; } };
}
function stopSE(name) {
    ensureAudioContext();
    const state = seState[name];
    if (state && state.source) {
        state.pauseTime += audioCtx.currentTime - state.startTime;
        state.source.stop();
        state.source.disconnect();
        state.source = null;
    }
}
function resetAllSE() {
    ensureAudioContext();
    for (const key in seState) {
        const state = seState[key];
        if (state.source) {
            state.source.stop();
            state.source.disconnect();
            state.source = null;
        }
        state.pauseTime = 0;
    }
}
function setSEVolume(vol) {
    ensureAudioContext();
    seGain.gain.value = vol;
}

// ===============================
// Voice（音声）
// ===============================
// Voice（音声）
const voiceFiles = {
    v1: "assets/voice/1.mp3",
    v2: "assets/voice/2.mp3",
    v3: "assets/voice/3.mp3",
    v4: "assets/voice/4.mp3",
    v5: "assets/voice/5.mp3",
    v6: "assets/voice/6.mp3",
    v7: "assets/voice/7.mp3",
    v8: "assets/voice/8.mp3",
    end: "assets/voice/end.mp3",
    otsukare: "assets/voice/otsukare.mp3"
};

const voiceBuffers = {}, voiceState = {};
async function loadVoice(name, url) {
    ensureAudioContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    voiceBuffers[name] = decoded;
    voiceState[name] = { source: null, startTime: 0, pauseTime: 0 };
}
function playVoice(name) {
    ensureAudioContext();
    if (!voiceBuffers[name]) return;
    if (audioCtx.state === 'suspended') resumeAudioContext();
    const state = voiceState[name];
    if (state.source) { state.source.stop(); state.source.disconnect(); }
    const source = audioCtx.createBufferSource();
    source.buffer = voiceBuffers[name];
    source.connect(voiceGain);
    state.startTime = audioCtx.currentTime;
    source.start(0, state.pauseTime);
    state.source = source;
    source.onended = () => { if (state.source === source) { state.source = null; state.pauseTime = 0; } };
}
function resetAllVoice() {
    ensureAudioContext();
    for (const key in voiceState) {
        const state = voiceState[key];
        if (state.source) {
            state.source.stop();
            state.source.disconnect();
            state.source = null;
        }
        state.pauseTime = 0;
    }
}
function setVoiceVolume(vol) {
    ensureAudioContext();
    voiceGain.gain.value = vol;
}

// ===============================
// フェードアウト
// ===============================
let currentFadeId = 0;
function fadeOutAudio(duration = 10000) {
    ensureAudioContext();
    if (!bgmGain || !audioCtx) return;
    const fadeId = ++currentFadeId;
    const now = audioCtx.currentTime;
    const currentVol = bgmGain.gain.value;
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setValueAtTime(currentVol, now);
    bgmGain.gain.linearRampToValueAtTime(0, now + duration / 1000);
    setTimeout(() => {
        if (fadeId !== currentFadeId) return;
        if (bgmSource) {
            try { bgmSource.stop(); } catch { }
            try { bgmSource.disconnect(); } catch { }
            bgmSource = null;
        }
        bgmPauseTime = 0;
        // 音量を元に戻す
        bgmGain.gain.setValueAtTime(currentVol, audioCtx.currentTime);
    }, duration);
}

// ===============================
// 外部公開
// ===============================
window.AudioModule = {
    loadBGM,
    playBGM,
    stopBGM,
    resetBGM,
    setBGMVolume,
    loadSE,
    playSE,
    stopSE,
    resetAllSE,
    setSEVolume,
    loadVoice,
    playVoice,
    resetAllVoice,
    setVoiceVolume,
    fadeOutAudio,
    seFiles,
    voiceFiles
};
// AudioContext も参照できるように公開
Object.defineProperty(window, "audioCtx", {
    get: () => audioCtx
});

// AudioContextの状態変化を監視
function monitorAudioContext() {
    if (!audioCtx) return;
    audioCtx.onstatechange = () => {
        console.log("AudioContext state changed:", audioCtx.state);
        if (audioCtx.state === "interrupted") {
            // Safari特有: 割り込みで停止された
            // → 再開を試みる
            tryResume();
        }
    };
}

function tryResume() {
    if (!audioCtx) return;
    audioCtx.resume().catch(err => {
        console.warn("自動resume失敗:", err);
        // Safariではユーザー操作待ちになる
    });
}

// 最初に呼んで監視開始
monitorAudioContext();

// ユーザー操作でも復帰を保証
document.addEventListener("click", tryResume);
document.addEventListener("touchstart", tryResume);
