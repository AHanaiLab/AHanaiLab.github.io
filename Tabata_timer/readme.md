# タバタタイマー (Tabata Timer)

## 全体機能の説明

このプロジェクトは、**ブラウザ上で動作するタバタトレーニング専用タイマー** です。  
主な特徴と機能は以下の通りです。

### 1. タイマー機能
- ワーク（運動） 20 秒・休憩 10 秒を 8 セット繰り返す標準的なタバタプロトコルに対応。
- 開始前に 3 秒のカウントダウンを表示。
- 残り時間を円形タイマーおよび数字で表示。
- 全体の進行状況を進捗バーで可視化。
- タイマー完了後に音声で「終了」をアナウンス。

### 2. 音声制御
- **BGM**：ワーク中に流れる背景音楽。
- **効果音 (SE)**：開始 3 秒前、ワーク/休憩開始 3 秒前、ワーク/休憩開始時に鳴る音。
- **音声 (Voice)**：各ワーク番号や全セット終了時のアナウンス。
- 音量は BGM / SE / Voice の 3 系統を独立して調整可能。
- Safari や iOS の AudioContext サスペンドにも対応。

### 3. UI 機能
- 円形タイマーと数字表示で残り時間を直感的に確認可能。
- セット名（例: ワーク 1, 休憩 1）を表示。
- 一時停止／再開／リセットボタンを装備。
- 音量設定パネルと説明モーダルをモーダルウィンドウで表示。

### 4. 安全・利便性機能
- 別タブに移動するとカウントダウン中はリセット、進行中は自動で一時停止。
- 画面常時点灯（Wake Lock API）対応でスマホでも画面が消えない。
- バックグラウンド復帰時に自動で音声再開を試みる。

### 5. カスタマイズ可能
- ワーク時間・休憩時間・セット数を簡単に変更可能。
- BGM・効果音・声のファイルを差し替え可能。
- UI の色やサイズを CSS で自由に変更可能。

## ファイル構成と役割

プロジェクトの主要ファイルとその役割は以下の通りです。

project-root/
├── index.html # 画面レイアウト・UI・ボタン・モーダル
├── style.css # タイマー・ボタン・進捗バー・モーダルなどのデザイン・レイアウト
├── audio.js # 音声管理モジュール
├── main.js # タイマー進行・円形表示・ユーザー操作処理
└── assets/
    ├── bgm/
    │   └── MOCHIKO_POISON.wav      # 背景音楽
    ├── se/
    │   ├── countdown.mp3           # カウントダウン3秒前
    │   ├── countToRest.mp3         # ワーク終了3秒前
    │   └── startOfRest.mp3         # 休憩開始時
    └── voice/
        ├── 1.mp3                   # ワーク番号読み上げ 1〜8
        ├── 2.mp3
        ├── ...
        ├── 8.mp3
        ├── end.mp3                 # 全セット終了時
        └── otsukare.mp3            # 終了後のアナウンス



### 各ファイルの詳細

#### 1. `index.html`
- HTML で UI を構築
- 円形タイマー、残り時間表示、進捗バーを含む
- ボタン操作（スタート、停止、リセット、音量、説明モーダル）
- 音量設定モーダル・説明モーダルの構造を保持

#### 2. `style.css`
- UI のデザインを担当
- 円形タイマーの色・サイズ、ボタンデザイン、進捗バー、モーダルの見た目
- 音量スライダーのスタイルも管理
- CSS を変更することでデザインや配色を簡単にカスタマイズ可能

#### 3. `audio.js`
- Web Audio API を使って BGM、効果音、音声アナウンスを管理
- 音量の独立制御 (BGM / SE / Voice)
- 再生・停止・リセット・フェードアウト機能を提供
- Safari/iOS 対応として AudioContext の自動復帰やユーザー操作による有効化を実装
- `window.AudioModule` を通じて main.js から操作可能

#### 4. `main.js`
- タイマー制御のメインロジック
- カウントダウン、ワーク/休憩の切り替え、全体進捗の計算
- 円形タイマーの描画更新、進捗バーの更新
- ボタン操作（開始/一時停止/リセット）と音声呼び出し
- タブ切り替えやバックグラウンド時の挙動制御
- Wake Lock API で画面消灯防止

#### 5. `assets/`
- 音声ファイルを格納
- ファイルパスは `audio.js` および `main.js` 内で指定
- ディレクトリ構造を変える場合は該当コード内のパスも更新する必要あり

### 音声ファイル読み込み設定
- main.js の冒頭付近で読み込む音声を指定しています。
- 必要に応じてファイルパスを変更してください。

// BGM
window.AudioModule.loadBGM('assets/bgm/MOCHIKO_POISON.wav');

// 効果音
Object.entries(window.AudioModule.seFiles).forEach(([name, url]) => {
    window.AudioModule.loadSE(name, `assets/se/${url}`);
});

// 音声アナウンス
Object.entries(window.AudioModule.voiceFiles).forEach(([name, url]) => {
    window.AudioModule.loadVoice(name, `assets/voice/${url}`);
});

## index.html の詳細解説

`index.html` は UI の構造を定義するファイルです。  
円形タイマー・ボタン・モーダルなど、すべてのフロントエンド表示要素がここで作られています。

---

### 1. `<head>` 部分

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>タバタタイマー</title>
<link rel="stylesheet" href="style.css">
````

* `meta charset="UTF-8"` : 日本語表示に必要
* `viewport` : スマホで正しく表示するためのレスポンシブ設定
* `title` : ブラウザタブのタイトル
* `link rel="stylesheet"` : `style.css` を読み込み、デザインを適用

---

### 2. タイトル・ワーク名表示

```html
<h1>タバタタイマー</h1>
<div class="exercise-name" id="exercise-name">準備中...</div>
```

* `<h1>` : ページタイトル
* `<div id="exercise-name">` : 現在のワーク名（例: ワーク 1, 休憩 1）を表示
  → `main.js` の `updateDisplay()` で更新されます

---

### 3. 円形タイマー表示

```html
<div class="circle-wrapper">
  <svg class="progress-ring" width="220" height="220">
    <circle class="progress-ring__background" cx="110" cy="110" r="100"></circle>
    <circle class="progress-ring__circle" cx="110" cy="110" r="100"></circle>
  </svg>
  <div class="circle-content">
    <div class="timer" id="timer">--</div>
    <hr class="divider" />
    <div class="total-timer" id="total-timer">--:--</div>
  </div>
</div>
```

* `<svg>` と `<circle>` : 円形タイマーの背景と進捗円を描画
* `.circle-content` 内の `<div id="timer">` : 残り秒数を表示
* `<div id="total-timer">` : 全体の残り時間を表示
* `main.js` の `setProgress()` と `updateDisplay()` で描画更新

---

### 4. 操作ボタン

```html
<div class="controls">
  <button id="start-btn">スタート</button>
  <button id="pause-btn" style="display:none">一時停止</button>
  <button id="reset-btn">リセット</button>
  <button id="toggle-panel-btn">音量</button>
  <button id="info-btn">説明</button>
</div>
```

* `start-btn` : タイマー開始
* `pause-btn` : 一時停止／再開切替（初期は非表示）
* `reset-btn` : タイマーリセット
* `toggle-panel-btn` : 音量設定モーダル表示
* `info-btn` : 説明モーダル表示

---

### 5. 説明モーダル

```html
<div id="info-modal" class="modal-overlay">
  <div class="modal-content">
    <h3>説明</h3>
    <div class="info-text">
      <div class="info-section">
        <h4>📌 タバタタイマー</h4>
        <p>ワーク20秒・休憩10秒を8セット繰り返すタイマーです。</p>
      </div>
      ...
    </div>
    <button class="close-btn" id="close-info-btn">閉じる</button>
  </div>
</div>
```

* `.modal-overlay` : モーダル背景
* `.modal-content` : モーダル本体
* `.close-btn` : モーダルを閉じる
* 内容はワーク概要、音量説明、注意事項を表示

---

### 6. 音量設定モーダル

```html
<div id="modal-overlay" class="modal-overlay">
  <div class="modal-content">
    <h3>音量設定</h3>
    <div class="volume-controls" id="volume-controls">
      <div>
        <label for="bgm-volume">BGM: <span id="bgm-volume-display">0.4</span></label>
        <input type="range" id="bgm-volume" min="0" max="1" step="0.01" value="0.4">
      </div>
      ...
    </div>
    <button class="close-btn" id="close-modal-btn">閉じる</button>
  </div>
</div>
```

* `bgm-volume`, `se-volume`, `voice-volume` のスライダーで音量調整
* `main.js` のイベントで変更値を `AudioModule` に反映

---

### 7. 全体進捗バー

```html
<div class="progress-bar-container">
  <div class="progress-bar" id="progress-bar"></div>
</div>
```

* `.progress-bar` : 全体のセット進行度を表示
* `main.js` の `updateDisplay()` で幅 (`width`) を更新

---

### 8. JavaScript 読み込み

```html
<script src="audio.js"></script>
<script src="main.js"></script>
```

* `audio.js` : 音声管理
* `main.js` : タイマー制御
* 両方を読み込むことで UI と音声が連動

## style.css の詳細解説

`style.css` はタイマー UI の全体デザイン、ボタン、モーダル、進捗バー、音量スライダーのスタイルを管理しています。  
以下に主要セクションごとの解説を示します。

---

### 1. 全体レイアウト

```css
body {
    font-family: sans-serif;
    background: #f4f4f4;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
}
````

* ページ全体を中央揃え、縦方向に並べる
* 背景色 #f4f4f4
* 最小高さ 100vh で画面いっぱいに表示
* フォントは sans-serif

---

### 2. 円形タイマー

```css
.circle-wrapper { position: relative; width: 220px; height: 220px; margin: 1rem 0; }

.progress-ring { transform: rotate(-90deg); position: absolute; top: 0; left: 0; }
.progress-ring__background { fill: none; stroke: #eee; stroke-width: 10; }
.progress-ring__circle { fill: none; stroke: #ff4500; stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset 0.1s linear; }

.circle-content { position: absolute; top: 0; left: 0; width: 220px; height: 220px; display: flex; flex-direction: column; justify-content: center; align-items: center; }

.timer { font-size: 4rem; color: #333; margin: 1rem 0 0 0; line-height: 1; }
.total-timer { font-size: 2rem; color: #999; margin: 0 0 1rem 0; line-height: 1; }
.divider { width: 150px; border: none; border-top: 1px solid #aaa; margin: 0.5rem 0; }
.exercise-name { font-size: 1.25rem; color: #666; margin-bottom: 0.5rem; }
```

* `.circle-wrapper` : SVG と中身をまとめる
* `.progress-ring__circle` : ワーク進捗に応じて線の長さを変更
* `.circle-content` : 数字表示やセット名を中央に配置
* `.timer` : 秒数表示（大きめフォント）
* `.total-timer` : 全体残り時間
* `.divider` : デザイン上の区切り線
* `.exercise-name` : 現在のワーク名

---

### 3. 操作ボタン

```css
.controls { display: flex; gap: 1rem; margin: 1rem 0; }
.controls button {
    font-size: 1rem; padding: 0.5rem 1rem; border: none; border-radius: 5px;
    background-color: #007bff; color: white; cursor: pointer;
}
.controls button:hover { background-color: #0056b3; }
```

* ボタンを横並び、1rem 間隔
* 背景青、白文字、角丸 5px
* ホバー時は濃い青に変化

---

### 4. モーダル表示

```css
.modal-overlay {
    display: none;
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.5); z-index: 1000;
}

.modal-content {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #f9f9f9; border: 2px solid #007bff; border-radius: 15px;
    padding: 2rem; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;
}

.close-btn { margin-top: 1rem; padding: 1rem; font-size: 1.5rem; background-color: #dc3545; color: white; border-radius: 10px; cursor: pointer; }
.close-btn:hover { background-color: #a71d2a; }
```

* `.modal-overlay` : 背景の半透明黒
* `.modal-content` : 中央に固定表示、角丸、スクロール可能
* `.close-btn` : 閉じるボタン、赤背景で大きめ

---

### 5. 説明モーダル内部

```css
.info-text { font-size: 1rem; color: #333; line-height: 1.6; text-align: left; }
.info-section {
    margin-bottom: 1.5rem; padding: 1rem; background: #fdfdfd; border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.info-section h4 { margin: 0 0 0.5rem 0; font-size: 1.2rem; color: #007bff; }
.info-section ul { margin: 0; padding-left: 1.2rem; }
.info-section li { margin-bottom: 0.3rem; }
```

* モーダル内の説明を見やすく装飾
* 各セクションは白背景・角丸・影付き
* 見出しとリストを整理

---

### 6. 全体進捗バー

```css
.progress-bar-container { width: 90%; height: 20px; background: #ddd; border-radius: 10px; overflow: hidden; margin: 1rem 0; }
.progress-bar { height: 100%; width: 0%; background: linear-gradient(to right, #ff4500, #7cfc00); border-radius: 10px 0 0 10px; transition: width 0.2s linear; }
```

* `.progress-bar-container` : 背景バー
* `.progress-bar` : 線形グラデーションで進行状況を表示
* `transition` により幅が滑らかに変化

---

### 7. 音量スライダー

```css
.volume-controls { display: flex; flex-direction: column; gap: 1.5rem; }
input[type="range"] { width: 100%; height: 14px; background: #ddd; border-radius: 7px; cursor: pointer; }
input[type="range"]::-webkit-slider-thumb { width: 28px; height: 20px; background: #007bff; border-radius: 4px; cursor: pointer; }
input[type="range"]::-moz-range-thumb { width: 28px; height: 20px; background: #007bff; border-radius: 4px; cursor: pointer; }
```

* 縦方向にスライダーを並べる
* スライダー自体の色と形状をカスタマイズ
* BGM / SE / Voice の音量調整に対応

## main.js の詳細解説

`main.js` はタバタタイマーの **メイン制御ロジック** を担当します。  
タイマーの進行、円形表示・進捗バー更新、ボタン操作、音声呼び出しを統合しています。

---

### 1. 音量スライダーの操作補助

```js
function enableFullDrag(slider) { ... }
["bgm-volume", "se-volume", "voice-volume"].forEach(id => {
    enableFullDrag(document.getElementById(id));
});
````

* スライダーをクリック・ドラッグで自由に操作可能にする
* PC / タッチ端末両対応
* `input` イベントを dispatch して即座に音量変更

---

### 2. モーダル操作

```js
const toggleBtn = document.getElementById("toggle-panel-btn");
const modalOverlay = document.getElementById("modal-overlay");
const closeBtn = document.getElementById("close-modal-btn");
toggleBtn.addEventListener("click", () => modalOverlay.style.display = "block");
closeBtn.addEventListener("click", () => modalOverlay.style.display = "none");
```

* 音量設定モーダルの開閉
* 背景クリックで閉じる処理もあり
* 説明モーダルも同様に制御

---

### 3. タイマー設定

```js
const sets = 8;
const workTime = 20;
const restTime = 10;
```

* タイマーのセット数、ワーク時間、休憩時間を指定
* 必要に応じて変更可能

---

### 4. タイマーシーケンス生成

```js
let sequence = [];
for (let i = 0; i < sets; i++) {
    sequence.push({ name: `ワーク ${i + 1}`, duration: workTime });
    if (i < sets - 1) sequence.push({ name: `休憩 ${i + 1}`, duration: restTime });
}
```

* 配列 `sequence` にワーク・休憩を順番に格納
* ワーク / 休憩の名前と秒数を管理

---

### 5. DOM 要素取得

```js
const nameEl = document.getElementById("exercise-name");
const timerEl = document.getElementById("timer");
const totalTimerEl = document.getElementById("total-timer");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
```

* タイマー表示やボタン操作の対象となる DOM を取得
* `updateDisplay()` で内容を動的に更新

---

### 6. 音量スライダー連携

```js
bgmVolumeSlider.addEventListener("input", () => window.AudioModule.setBGMVolume(...));
seVolumeSlider.addEventListener("input", () => window.AudioModule.setSEVolume(...));
voiceSlider.addEventListener("input", () => window.AudioModule.setVoiceVolume(...));
```

* スライダー値を `AudioModule` に反映
* 表示ラベルもリアルタイム更新

---

### 7. 音声ファイルのロード

```js
window.AudioModule.loadBGM('MOCHIKO_POISON.wav');
Object.entries(window.AudioModule.seFiles).forEach(([name, url]) => window.AudioModule.loadSE(name, url));
Object.entries(window.AudioModule.voiceFiles).forEach(([name, url]) => window.AudioModule.loadVoice(name, url));
```

* BGM / 効果音 / 音声アナウンスを事前ロード
* ロード完了後に再生可能

---

### 8. 円形タイマーと進捗バー初期化

```js
const circle = document.querySelector(".progress-ring__circle");
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
circle.style.strokeDasharray = `${circumference}`;
circle.style.strokeDashoffset = `${circumference}`;
```

* SVG の円の長さを計算して stroke-dashoffset で進捗表示
* `setProgress(percent)` で残り時間に応じて線を進める

---

### 9. タイマー描画と進行管理

```js
function animateProgress(timestamp) { ... }
function updateDisplay() { ... }
function nextStep() { ... }
```

* `animateProgress` : requestAnimationFrame で 1 秒ごとの残り時間更新
* ワーク・休憩の色変更、音声再生、バイブレーションも制御
* `nextStep()` で次のワーク/休憩へ進む
* 全セット終了時に `fadeOutAudio()` と終了音声再生

---

### 10. スタート／一時停止／リセット

```js
function startTimer() { ... }
function pauseTimer() { ... }
function resetTimer() { ... }

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
```

* `startTimer()` : 3 秒カウントダウン後にタイマー開始
* `pauseTimer()` : 一時停止／再開切替
* `resetTimer()` : カウントダウン・進行中に関わらずタイマーを初期状態に戻す

---

### 11. タブ切り替え・バックグラウンド制御

```js
document.addEventListener("visibilitychange", () => {
    if (startBtn.style.display !== "none") return;

    if (document.hidden) {
        if (countdownInterval) resetTimer();
        else if (!paused && current < sequence.length) pauseTimer();
    }
});
```

* 別タブに移動した場合の挙動を制御
* カウントダウン中 → 強制リセット
* 進行中 → 自動一時停止
* Safari/iOS 対応

---

## audio.js の詳細解説

`audio.js` は **Web Audio API を用いた音声管理モジュール** です。  
BGM、効果音、音声アナウンスの再生・停止・リセット・音量制御を提供します。

---

### 1. AudioContext 初期化と Safari 対策

```js
let audioCtx, bgmGain, seGain, voiceGain;
let isUserActivated = false;

function ensureAudioContext() { ... }
function resumeAudioContext() { ... }
function enableAudio() { ... }

document.addEventListener('touchstart', enableAudio, { once: true });
document.addEventListener('click', enableAudio, { once: true });
````

* AudioContext を作成し、BGM / SE / Voice 用の GainNode を接続
* Safari/iOS 対策として、ユーザー操作で初回 resume
* `enableAudio()` はタッチまたはクリック時に一度だけ実行

---

### 2. BGM 制御

```js
let bgmBuffer, bgmSource, bgmStartTime = 0, bgmPauseTime = 0, userWantsBGM = false;

function loadBGM(url) { ... }    // BGM ファイルのロード
function playBGM() { ... }       // 再生開始（ループあり）
function stopBGM() { ... }       // 一時停止、再開位置を保存
function resetBGM() { ... }      // 完全停止・位置リセット
function setBGMVolume(vol) { ... } // 音量設定
```

* ループ再生に対応
* 再開時は停止位置を考慮
* `setBGMVolume()` で GainNode の値を変更可能

---

### 3. 効果音 (SE) 制御

```js
const seFiles = { countdown: "countdown.mp3", countToRest: "countToRest.mp3", startOfRest: "startOfRest.mp3" };
const seBuffers = {}, seState = {};

async function loadSE(name, url) { ... }
function playSE(name) { ... }
function stopSE(name) { ... }
function resetAllSE() { ... }
function setSEVolume(vol) { ... }
```

* 個別の効果音をロード・再生
* 再生中の音は stop して重複防止
* 音量を独立調整可能
* `main.js` のタイマーイベントで呼び出される

---

### 4. 音声アナウンス (Voice) 制御

```js
const voiceFiles = { v1:"1.mp3", v2:"2.mp3", ..., end:"end.mp3", otsukare:"otsukare.mp3" };
const voiceBuffers = {}, voiceState = {};

async function loadVoice(name, url) { ... }
function playVoice(name) { ... }
function resetAllVoice() { ... }
function setVoiceVolume(vol) { ... }
```

* ワーク番号や終了アナウンスの音声を管理
* 再生中の音は stop して重複防止
* 音量を独立調整可能
* `main.js` の `playWorkVoice()` や終了処理で呼び出される

---

### 5. フェードアウト機能

```js
function fadeOutAudio(duration = 10000) { ... }
```

* BGM を指定秒数で徐々に音量を下げ、最後に停止
* タイマー終了時の自然な音声フェードアウトに使用

---

### 6. 外部公開 API

```js
window.AudioModule = {
    loadBGM, playBGM, stopBGM, resetBGM, setBGMVolume,
    loadSE, playSE, stopSE, resetAllSE, setSEVolume,
    loadVoice, playVoice, resetAllVoice, setVoiceVolume,
    fadeOutAudio, seFiles, voiceFiles
};
```

* `main.js` からアクセス可能
* すべての音声操作はここを介して実行

---

### 7. その他の特徴

* AudioContext の状態変化を監視して自動復帰
* Safari 割り込みやバックグラウンド復帰にも対応
* 音量スライダーやタイマーイベントと完全連動

---

## 🎵 音声ファイルを追加して任意のタイミングで再生する方法

### 1. ファイルを配置
新しい音声ファイルは `assets/` 以下の適切なフォルダに保存してください。  
例: `assets/se/newAlert.mp3`

### 2. audio.js に登録
`audio.js` の **SE** または **Voice** 定義オブジェクトに新しいキーとパスを追加します。

```javascript
// 例: 新しい効果音を追加する場合
const seFiles = {
    countdown: "countdown.mp3",
    countToRest: "countToRest.mp3",
    startOfRest: "startOfRest.mp3",
    newAlert: "assets/se/newAlert.mp3"   // ← 追加
};
````

Voice を追加する場合は `voiceFiles` に同様に追記してください。

### 3. main.js でロード

`main.js` の初期化部分では `seFiles` / `voiceFiles` に登録されたものを自動で読み込みます。
通常は追加作業不要ですが、自動ロードを使わずに明示的にロードしたい場合は以下を追記します。

```javascript
// 明示的にロードする例
window.AudioModule.loadSE("newAlert", "assets/se/newAlert.mp3");
```

### 4. 再生する

任意の場所で以下のように呼び出すと再生されます。

```javascript
// 効果音を再生
window.AudioModule.playSE("newAlert");

// 声を再生（例: v9 を追加した場合）
window.AudioModule.playVoice("v9");
```

### 5. 使用例

#### 例A: ワーク開始時に新しい効果音を流す

`main.js` の `animateProgress()` 内にある「ワーク開始」判定に追記します。

```javascript
if (sequence[current].name.startsWith("ワーク") && !workVoicePlayed) {
    const num = parseInt(sequence[current].name.replace("ワーク ", ""));
    workVoicePlayed = true;
    restVoicePlayed = false;
    setTimeout(() => playWorkVoice(num), 500);

    // 新しい効果音を追加で流す
    window.AudioModule.playSE("newAlert");
}
```

#### 例B: リセット時にカスタム効果音を流す

`resetTimer()` の末尾に追記します。

```javascript
window.AudioModule.resetAllVoice();
releaseWakeLock();

// リセット完了時の効果音を流す
window.AudioModule.playSE("newAlert");
```

---

この手順に従えば、新しい音声を簡単に追加し、任意のイベントで再生できるようになります。

```

