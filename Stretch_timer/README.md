# ストレッチタイマー

シンプルな **インターバル／ストレッチ用タイマー** です。  
円形プログレス表示・音声カウントダウン・BGM・スリープ抑止に対応。

## 機能
- ストレッチと休憩のインターバル管理  
- 残り時間と合計時間の表示  
- 音声カウントダウンと BGM 再生  
- バイブレーション通知（対応端末のみ）  
- Wake Lock によるスリープ防止  

## 使い方
1. リポジトリをクローンまたは zip をダウンロード
2. 音声ファイルを `index.html` と同じディレクトリに配置  
3. `index.html` をブラウザで開く  
4. 「スタート」ボタンでタイマー開始  

## 設定
以下を変更すると動作をカスタマイズできます。

```js
const sets = 8;          // セット数
const stretchTime = 20;  // ストレッチ秒
const restTime = 10;     // 休憩秒
```

## 音楽の追加
1. 音楽ファイルを配置  
2. `<audio>` タグを追加（例）:
   ```html
   <audio id="my_bgm" src="my_bgm.mp3" preload="auto" loop></audio>
   ```
3. JavaScript から呼び出し:
   ```js
   function playCustomBGM(id) {
     const bgm = document.getElementById(id);
     if (bgm) {
       bgm.currentTime = 0;
       bgm.volume = 0.5;
       bgm.play().catch(e => console.warn("BGM再生失敗:", e));
     }
   }

   playCustomBGM("my_bgm");
   ```

## 開発
- HTML / CSS / JavaScript (Vanilla)  
- 音声再生はユーザー操作後に許可されます（ブラウザ仕様）  
- 動作確認: Chrome, Edge, Safari (最新近傍)  

## ライセンス
MIT License


## 開発者向け情報

### 構成
- `index.html`: 本体。HTML/CSS/JavaScript が1ファイルにまとまっています。
- 音声ファイル: `audio` 要素で読み込まれる mp3/wav ファイル。

### 技術メモ
- タイマーは `requestAnimationFrame` と `performance.now()` を用いて実時間を基準に制御しており、
  `setInterval` に比べてバックグラウンド時のズレが少ない実装になっています。
- Wake Lock API を利用して画面スリープを防止（非対応ブラウザでは無視されます）。
- 音声はブラウザの自動再生ポリシーに従い、ユーザー操作後にのみ再生可能です。

### 開発のヒント
- **デザイン変更**: `<style>` セクションで色・フォント・レイアウトを調整できます。
- **拡張**:  
  - フェードイン/フェードアウトの追加  
  - 複数 BGM の切り替えやランダム再生  
  - ログ出力やエクスポート機能  
- **デバッグ**:  
  - `console.log` を適宜追加して状態を確認  
  - ブラウザ開発者ツールで DOM / Audio の動作を確認  
