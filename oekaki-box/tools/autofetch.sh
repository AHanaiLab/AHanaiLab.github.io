#!/usr/bin/env bash
# Mac で、10分おきに fetch.sh を自動実行する(launchd)。届いた絵が、Google ドライブのフォルダに自動で増える。
#   ./tools/autofetch.sh install     設定して、すぐ1回実行する
#   ./tools/autofetch.sh status      動いているか、直近のログを見る
#   ./tools/autofetch.sh uninstall   止めて、設定を消す
# 注意: Mac が起動していて、ログインしている間だけ動く(スリープ中・電源オフ中は動かない。起きたら、すぐ追いつく)。
set -euo pipefail
LABEL="jp.ahanailab.oekaki-autofetch"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG="$HOME/Library/Logs/oekaki-autofetch.log"
HERE="$(cd "$(dirname "$0")/.." && pwd)"   # oekaki-box のフォルダ
INTERVAL="${INTERVAL:-600}"                # 実行の間隔(秒)

case "${1:-}" in
  install)
    command -v aws >/dev/null || { echo "エラー: aws コマンドが見つかりません" >&2; exit 1; }
    AWS_DIR="$(dirname "$(command -v aws)")"
    mkdir -p "$(dirname "$PLIST")" "$(dirname "$LOG")"
    cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string><string>-c</string>
    <string>cd "${HERE}" &amp;&amp; date &amp;&amp; ./fetch.sh</string>
  </array>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>${AWS_DIR}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    <key>HOME</key><string>${HOME}</string>
  </dict>
  <key>StartInterval</key><integer>${INTERVAL}</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>${LOG}</string>
  <key>StandardErrorPath</key><string>${LOG}</string>
</dict></plist>
PL
    launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
    launchctl bootstrap "gui/$(id -u)" "$PLIST"
    echo "設定しました。${INTERVAL}秒おきに自動で取り込みます。ログ: ${LOG}"
    echo "数秒後に、./tools/autofetch.sh status で、動作を確認してください。"
    ;;
  status)
    if launchctl print "gui/$(id -u)/${LABEL}" >/dev/null 2>&1; then echo "設定: あり(動作中)"; else echo "設定: なし"; fi
    echo "---- ログの末尾 (${LOG})"; tail -n 15 "$LOG" 2>/dev/null || echo "(まだログがありません)"
    ;;
  uninstall)
    launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
    rm -f "$PLIST"; echo "止めて、設定を消しました。"
    ;;
  *) echo "使い方: $0 install | status | uninstall" >&2; exit 1 ;;
esac
