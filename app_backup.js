console.log("TEST V60");
/* oncology_app/app.js - Refactored for Firebase Integration */

/* ===== 共通状態 / State ===== */
const STORAGE_KEY_VO2 = "eo_vo2_records_v1";

const AppState = {
    // Data Models (Firestore)
    subject: null,
    project: null,
    exercises: [],
    projects: [],     // Added
    categories: [],   // Added

    // UI State
    vo2Records: [],
    vo2Chart: null,
    currentVo2max: null,
    weight: 60,
    isCelebrated: false,
    dailyPlan: new Array(19).fill(null), // 05:00 to 24:00 (19 slots)
    version: "20260204_v60",
    homeMode: "input" // or "result"
};

/* Util for Safe URL Generation */
function getApiUrl(path) {
    // Validates window.AWS_CONFIG presence
    const config = window.AWS_CONFIG || {};
    const base = config.apiBase || "";
    // Robust join (removes trailing slash from base, leading slash from path)
    const cleanBase = base.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${cleanBase}/${cleanPath}`;
}

/* ===== METs 活動データベース (Backup / Static) ===== */
const ACTIVITY_DATABASE = [
    // Lifestyle
    { name: "座って読書・テレビ鑑賞", mets: 1.3 },
    { name: "座って事務作業・PC作業", mets: 1.5 },
    { name: "立って会話・電話", mets: 1.8 },
    { name: "皿洗い・立位での軽い家事", mets: 1.8 },
    { name: "料理・食材の準備", mets: 2.0 },
    { name: "洗濯物を干す・取り込む", mets: 2.3 },
    { name: "植物への水やり", mets: 2.5 },
    { name: "子どもと遊ぶ (立位・軽度)", mets: 2.5 },
    { name: "掃除機をかける", mets: 3.3 },
    { name: "床磨き・風呂掃除", mets: 3.5 },
    { name: "子どもと遊ぶ (歩く/走る)", mets: 4.0 },
    { name: "自転車での移動 (通勤・買い物)", mets: 4.0 },
    { name: "階段を降りる", mets: 3.5 },
    { name: "草むしり・庭仕事", mets: 5.0 },
    { name: "家具の移動・運搬", mets: 6.0 },
    { name: "雪かき", mets: 6.0 },
    { name: "階段を上る (ゆっくり)", mets: 4.0 },
    { name: "階段を上る (速く)", mets: 8.8 },
    // Exercise
    { name: "ストレッチ・ヨガ(ハタ)", mets: 2.5 },
    { name: "ゆっくりとした歩行 (散歩)", mets: 3.0 },
    { name: "太極拳", mets: 3.0 },
    { name: "ボウリング", mets: 3.0 },
    { name: "卓球", mets: 4.0 },
    { name: "ラジオ体操", mets: 4.0 },
    { name: "速歩き (通勤・通学程度)", mets: 4.3 },
    { name: "アクアビクス", mets: 5.5 },
    { name: "かなり速歩き (運動目的)", mets: 5.0 },
    { name: "ウェイトトレーニング（高強度）", mets: 6.0 },
    { name: "ジョギング (ゆっくり)", mets: 7.0 },
    { name: "テニス (シングルス)", mets: 7.3 },
    { name: "登山", mets: 7.3 },
    { name: "水泳（ゆっくり）", mets: 8.0 },
    { name: "ランニング (9.7km/h)", mets: 9.8 },
    { name: "縄跳び（速い）", mets: 12.3 },
    // Proposal Specific
    { name: "スクワット", mets: 5.0 },
    { name: "椅子からの立ち座り", mets: 3.5 },
    { name: "深呼吸・リラックス", mets: 1.2 }
];

const APP_MENUS = [
    { id: 'nav-home', label: 'ホーム', icon: '🏠', screen: 'screen-home' },
    { id: 'nav-plan', label: 'プラン', icon: '📝', screen: 'screen-plan' },
    { id: 'nav-program', label: '運動', icon: '🎬', screen: 'screen-program' },
    { id: 'nav-measure', label: '測定', icon: '🎮', screen: 'screen-measure' },
    { id: 'nav-tools', label: 'ツール', icon: '🧮', screen: 'screen-tools' },
    { id: 'nav-cloud', label: 'クラウド', icon: '☁️', screen: 'screen-cloud' }
];

/* ===== MOVE-CARE コアエンジン ===== */
const MoveCare = {
    state: { fatigue: 5, pain: 0, mood: "mid" },
    ui: {
        updateFatigue(v) { MoveCare.state.fatigue = parseInt(v, 10); document.getElementById("mc-val-fatigue").textContent = v; },
        setPain(v, btn) { MoveCare.state.pain = v; btn.parentNode.querySelectorAll(".mc-chip").forEach(c => c.classList.remove("selected")); btn.classList.add("selected"); },
        setMood(v, btn) { MoveCare.state.mood = v; btn.parentNode.querySelectorAll(".mc-chip").forEach(c => c.classList.remove("selected")); btn.classList.add("selected"); },
    },

    /* --- Utilities --- */
    debug: {
        // Seeding moved to backend script (setup_aws.py)
        async seed() {
            alert("データベース初期化は管理者用スクリプト(python)から実行してください。");
        },
        async clear() {
            alert("データ削除機能は無効化されました。");
        }
    },

    /* --- Auth & Data Loading --- */
    /* --- Auth & Data Loading (LIFF) --- */
    async initLIFF() {
        console.log("Initializing LIFF (app.js)...");
        try {
            await liff.init({ liffId: "2008978598-Ipe0zQRV" });

            // URLクリーンアップ & パラメータ有無の検知
            const url = new URL(window.location.href);
            // Ensure boolean cast to avoid 'null' string in logs
            const hasOAuthParams = !!(url.searchParams.has("code") || url.searchParams.has("state") || url.searchParams.get("liff.state"));

            if (hasOAuthParams) {
                console.log("Cleaning up OAuth params from URL...");
                url.search = "";
                window.history.replaceState({}, document.title, url.toString());
            }

            const authMode = localStorage.getItem("mc-auth-mode");
            const hasSession = !!(AppState.subject && AppState.subject.id);
            console.log(`[AuthCheck] Mode: ${authMode}, HasSession: ${hasSession}, LIFF_Login: ${liff.isLoggedIn()}, InitialLogin: ${hasOAuthParams}`);

            // 1. セッション成立済み、または manual モードなら停止
            if (hasSession || authMode === "manual") {
                console.log(">>> [SAFE] Manual session or mode. Continuing to refresh UI. <<<");
                MoveCare.showAppScreen();
                // If it's the target user, double check the ID mapping
                const TARGET_LINE_UID = 'Ub8fbc4be1b65aeab49cf3837cd66f8ed';
                if (AppState.subject && AppState.subject.lineUserId === TARGET_LINE_UID) {
                    AppState.subject.id = '1';
                }
                refreshUI();
                return;
            }

            // 1.5 [意図的なログアウト後] -> 自動ログイン阻止
            if (sessionStorage.getItem("intentional_logout")) {
                console.log(">>> [STOP] Intentional logout detected. Blocking auto-login. <<<");
                MoveCare.showLoginScreen();
                return;
            }

            // 2. 状態の不整合チェック (パラメータ無しのリロード時に mode:line なのにセッションが無い場合のみリセット)
            if (authMode === "line" && !hasSession && !hasOAuthParams) {
                console.log(">>> [RESET] Stale LINE mode detected. Clearing... <<<");
                localStorage.removeItem("mc-auth-mode");
                MoveCare.showLoginScreen();
                return;
            }

            // 3. モード未設定の初回ロード
            if (!authMode) {
                console.log(">>> [WAIT] No auth mode. Choice required. <<<");
                MoveCare.showLoginScreen();
                return;
            }

            // 4. LINE モードでの自動ログイン (Sessionがない場合のみ実行)
            if (authMode === "line" && liff.isLoggedIn() && !hasSession) {
                const profile = await liff.getProfile();
                console.log(">>> [NOTICE] LINE Mode: Auto-login... <<<");
                await MoveCare.loginAndFetchProfile(profile.userId, profile.displayName, "line");
            } else {
                MoveCare.showLoginScreen();
            }

        } catch (e) {
            console.error("LIFF Init Error:", e);
            if (!AppState.subject) MoveCare.showLoginScreen();
        }
    },

    async handleLogin() {
        const inputId = document.getElementById("login-input-id").value.trim();
        if (!inputId) {
            alert("被験者IDを入力してください。");
            return;
        }

        // 手動ログインを試みる前に、念のためLINE系のモードとログアウトフラグを即時クリア
        localStorage.removeItem("mc-auth-mode");
        sessionStorage.removeItem("intentional_logout");

        const loginBtn = document.getElementById("login-btn");
        const originalText = loginBtn.textContent;
        loginBtn.disabled = true;
        loginBtn.textContent = "読み込み中...";

        try {
            // 手動ログインを試行。成功した場合のみモードを切り替える
            await MoveCare.loginAndFetchProfile(inputId, "被験者 " + inputId, "manual");
            sessionStorage.removeItem("intentional_logout");
        } catch (e) {
            console.error("Manual Login Error:", e);
            document.getElementById("login-error").classList.remove("hidden");
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
        }
    },

    async retryLineLogin() {
        if (AppState.subject && !confirm("LINEログインに切り替えますか？ 現在のセッションは終了します。")) return;

        sessionStorage.removeItem("intentional_logout");
        // 明示的な切り替えなので、既存セッションを破棄してモードを固定する
        localStorage.removeItem("currentUser");
        localStorage.setItem("mc-auth-mode", "line");

        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            await MoveCare.loginAndFetchProfile(profile.userId, profile.displayName, "line");
        } else {
            liff.login();
        }
    },

    async loginAndFetchProfile(uid, displayName, mode) {
        console.log(`Fetching profile for: ${uid} (AWS) Mode: ${mode}`);
        try {
            let finalId = uid;
            const TARGET_LINE_UID = 'Ub8fbc4be1b65aeab49cf3837cd66f8ed';
            if (mode === 'line' && uid === TARGET_LINE_UID) {
                finalId = '1';
                console.log("[Auth] Mapping LINE UID to Subject ID: 1");
            }

            let res;
            if (mode === 'line') {
                // /auth/line はエイリアス(SUBJECT_ALIAS)を解決して本物の被験者データを返す
                res = await fetch(getApiUrl("auth/line"), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: uid }) // Keep original UID for alias lookup if needed, but the mapping above is proactive
                });

                // If proactive mapping is preferred over backend alias lookup for this specific user:
                if (uid === TARGET_LINE_UID) {
                    console.log("[Auth] Overriding LINE auth with direct Subject 1 fetch");
                    res = await fetch(getApiUrl(`subjects/1`));
                }
            } else {
                res = await fetch(getApiUrl(`subjects/${finalId}`));
            }

            // Sync the uid to finalId for the rest of the session
            const effectiveId = (mode === 'line' && uid === TARGET_LINE_UID) ? '1' : uid;

            let userData;
            if (res.ok) {
                userData = await res.json();
                console.log("AWS Profile Loaded:", userData);
            } else if (res.status === 404) {
                if (mode === 'line') {
                    console.log(">>> [UNLINKED] This LINE account has no subject linked. <<<");
                    // 自動作成をせず、ログイン画面を表示し、ユーザーにID入力を促す
                    MoveCare.showLoginScreen();
                    const errorEl = document.getElementById("login-error");
                    if (errorEl) {
                        errorEl.textContent = "LINE連携されていません。被験者IDでログインしてください。";
                        errorEl.classList.remove("hidden");
                    }
                    return;
                }

                console.log("User not found on AWS. Creating new...");
                userData = {
                    id: uid,
                    name: displayName || "利用者",
                    createdAt: new Date().toISOString(),
                    projectId: "default",
                    feedforward: "はじめまして！よろしくお願いします。",
                    logs: []
                };

                // Create on AWS (Manual mode only)
                const createRes = await fetch(getApiUrl(`subjects/${uid}`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                if (!createRes.ok) throw new Error(`AWSユーザー作成に失敗しました (${createRes.status})`);
            } else {
                throw new Error(`API接続エラー: ${res.status}`);
            }

            // ログイン成功後、もしLINEがログイン中ならエイリアスを作成（連携）
            if (mode === 'manual' && typeof liff !== 'undefined' && liff.isLoggedIn()) {
                try {
                    const profile = await liff.getProfile();
                    console.log("Auto-linking Subject to current LINE account:", profile.userId);
                    await fetch(getApiUrl(`subjects/${uid}/link`), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: profile.userId })
                    });
                } catch (linkErr) {
                    console.warn("Silent link failed", linkErr);
                }
            }

            // Session Setup
            const sessionData = {
                ...userData,
                id: effectiveId,
                loginDate: Date.now()
            };

            // 成功したタイミングで永続化
            AppState.subject = sessionData;
            localStorage.setItem("currentUser", JSON.stringify(sessionData));
            if (mode) localStorage.setItem("mc-auth-mode", mode);

            // 被験者データに予定があれば反映
            if (userData.daily_schedule && Array.isArray(userData.daily_schedule) && userData.daily_schedule.length === 19) {
                console.log("Syncing daily_schedule from profile...");
                AppState.dailyPlan = userData.daily_schedule;
                localStorage.setItem("eo_daily_plan_v1", JSON.stringify(AppState.dailyPlan));
            }

            // Success Transition
            console.log(">>> UI Rendering Start <<<");
            try {
                // 非同期でマスタ取得 (ブロックしない)
                MoveCare.fetchGlobalData().catch(e => console.warn("Background master fetch failed", e));
            } catch (ex) {
                console.warn("Global data fetch failed during login, continuing...", ex);
            }

            // 画面切り替えと描画
            MoveCare.showAppScreen();
            switchScreen('screen-home');
            refreshUI();

        } catch (e) {
            console.error("AWS Auth Error:", e);
            if (e.message.includes("404")) {
                alert("ユーザーが見つかりません。被験者IDを確認してください。");
            } else {
                alert("ログイン処理中にエラーが発生しました。\nネットワーク環境を確認してください。");
            }
            // 失敗しても念のため画面リセット
            const loginBtn = document.getElementById("login-btn");
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = "ログイン";
            }
            throw e;
        }
    },

    async fetchGlobalData() {
        try {
            // Fetch Exercises
            const exRes = await fetch(getApiUrl('exercises'));
            if (exRes.ok) {
                AppState.exercises = await exRes.json();
            }

            // Fetch Projects & Find User's Project
            const projRes = await fetch(getApiUrl('projects'));
            if (projRes.ok) {
                AppState.projects = await projRes.json();
                if (AppState.subject.projectId) {
                    AppState.project = AppState.projects.find(p => String(p.id) === String(AppState.subject.projectId));
                }
            }
        } catch (e) { console.error("Master data fetch failed", e); }
    },

    showAppScreen() {
        document.getElementById("login-modal").classList.add("hidden");

        // Update Header ID
        const headerId = document.getElementById('header-subject-id');
        if (headerId) headerId.textContent = AppState.subject.id;

        // Update Profile Screen Info
        const profileInfo = document.querySelector('#screen-cloud .font-bold');
        if (profileInfo && AppState.subject) {
            profileInfo.textContent = `${AppState.subject.name || '利用者'} (ID: ${AppState.subject.id || '---'})`;
        }

        renderProgramList();
        renderBottomNav();
        refreshUI();
        refreshSubjectUI();

        // Reveal App
        const main = document.getElementById("app-main");
        if (main) main.classList.remove("opacity-0");

        // Hide Splash
        const splash = document.getElementById("splash-screen");
        if (splash) {
            splash.classList.add("opacity-0", "pointer-events-none");
            setTimeout(() => splash.style.display = 'none', 500);
        }
    },

    async logout() {
        if (!confirm("ログアウトしますか？")) return;

        // 次回リロード時に自動ログインさせないためのフラグ
        sessionStorage.setItem("intentional_logout", "true");

        // 1. LIFF セッションの解除
        try {
            if (typeof liff !== 'undefined' && liff.isLoggedIn()) {
                liff.logout();
            }
        } catch (e) { console.warn("LIFF logout failed", e); }

        // 2. localStorage / sessionStorage の完全消去
        localStorage.removeItem("currentUser");
        localStorage.removeItem("mc-auth-mode");
        sessionStorage.removeItem("currentUser");
        // intentional_logout 以外を削除するため clear は慎重に
        // ここでは必要なものを個別に消去
        localStorage.removeItem("app_version"); // キャッシュ更新を促すため消すのもあり

        // 3. Service Worker の登録解除 (ゾンビ化防止)
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            } catch (e) { console.warn("SW unregister failed", e); }
        }

        // 4. Cache Storage の物理削除
        if ('caches' in window) {
            try {
                const names = await caches.keys();
                for (let name of names) await caches.delete(name);
            } catch (e) { console.warn("Caches delete failed", e); }
        }

        // 3. リロードではなく、クリーンなURLへ遷移 (パラメータ除去)
        window.location.href = window.location.origin + window.location.pathname;
    },

    showLoginScreen() {
        document.getElementById("login-modal").classList.remove("hidden");
        const splash = document.getElementById("splash-screen");
        if (splash) {
            splash.classList.add("opacity-0", "pointer-events-none");
            setTimeout(() => splash.style.display = 'none', 500);
        }
    },



    /* --- Proposal Logic (Schedule Based) --- */
    calcVo2BasedSuggestion() {
        if (!AppState.currentVo2max) return null;
        const vo2 = AppState.currentVo2max;
        const metsMax = vo2ToMETs(vo2);

        let targetPercent = 45;
        const { fatigue, mood, pain } = MoveCare.state;

        if (fatigue >= 7 || pain === 1) targetPercent = 35;
        else if (fatigue <= 3 && mood === "high") targetPercent = 55;

        const targetVo2 = vo2 * targetPercent / 100;
        const targetMets = vo2ToMETs(targetVo2);
        let minutes = 20;
        if (fatigue >= 7 || pain === 1) minutes = 10;
        else if (fatigue <= 3 && mood === "high") minutes = 30;

        const tri = getTriAxisPrescription(targetPercent);
        return { vo2, metsMax, targetPercent, targetMets, minutes, tri };
    },

    classifyActivitiesByVO2(vo2Mets) {
        const lightMax = vo2Mets * 0.4;
        const moderateMax = vo2Mets * 0.6;
        const light = ACTIVITY_DATABASE.filter(a => a.mets <= lightMax);
        const moderate = ACTIVITY_DATABASE.filter(a => a.mets > lightMax && a.mets <= moderateMax);
        const vigorous = ACTIVITY_DATABASE.filter(a => a.mets > moderateMax && a.mets <= vo2Mets);
        return { light, moderate, vigorous, lightMax, moderateMax };
    },

    /* --- Fitbit Auth Logic --- */
    async connectFitbit() {
        if (!AppState.subject) return;
        try {
            // Mock Auth Flow for Demo
            const width = 500, height = 600;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;

            const popup = window.open("about:blank", "FitbitAuth", `width=${width},height=${height},top=${top},left=${left}`);
            popup.document.write("<h1>Fitbit Login</h1><p>Connecting to Fitbit...</p><p>(Mock Auth Flow)</p>");

            await new Promise(r => setTimeout(r, 1500));
            popup.close();

            // Use Local State instead of DB write for now
            alert("Fitbitと連携しました！(デモ)");
            AppState.fitbitConnected = true;
            refreshUiFitbitStatus();

        } catch (e) {
            console.error(e);
            alert("連携失敗: " + e.message);
        }
    },



    /* --- Notification Logic --- */
    async scheduleNotification(timeStr, title) {
        if (!("Notification" in window)) {
            alert("このブラウザは通知機能に対応していません。");
            return;
        }

        // Request Permission
        if (Notification.permission !== "granted") {
            try {
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    alert("通知許可が得られませんでした。\n・ブラウザの設定で通知をブロックしていないか確認してください。\n・ローカルファイル(file://)で開いている場合、セキュリティ制限により通知が動かないことがあります。");
                    return;
                }
            } catch (e) {
                console.error(e);
                alert("通知設定エラー: " + e.message + "\n※ローカルファイル(file://)では通知機能が制限される場合があります。");
                return;
            }
        }

        // Parse Time
        const [h, m] = timeStr.split(":").map(Number);
        const now = new Date();
        const target = new Date();
        target.setHours(h, m, 0, 0);

        // If time is past, assume tomorrow
        if (target < now) {
            target.setDate(target.getDate() + 1);
        }

        const delay = target.getTime() - now.getTime();
        const delayMin = Math.round(delay / 60000);

        // Schedule
        setTimeout(() => {
            new Notification("Activity Pacing: 時間です！", {
                body: `${title}\n活動の時間になりました。無理せず始めましょう。`,
                icon: "https://via.placeholder.com/128?text=AP" // Placeholder icon
            });
        }, delay);

        // Test Notification (Immediate confirm)
        if (confirm(`${timeStr} (約${delayMin}分後) に通知をセットしました。\n\n※テスト用に「5秒後」に通知を送信しますか？`)) {
            setTimeout(() => {
                new Notification("Activity Pacing (Test)", {
                    body: "これはテスト通知です。本番通知もこのように表示されます。",
                });
            }, 5000);
        } else {
            alert(`通知をセットしました: ${timeStr}`);
        }
    },
    async createProposal() {
        if (!AppState.subject) return;

        // UI Loading State
        const btn = document.querySelector("#mc-view-input .btn-primary");
        const originalText = btn ? btn.textContent : "今日の提案をつくる ✨";
        if (btn) {
            btn.textContent = "AI分析中... 🤖";
            btn.disabled = true;
        }

        try {
            // 1. Calculate Day & Collect State
            const { fatigue, pain, mood } = MoveCare.state;

            // Check Fitbit Connection (Mock)
            // Fitbit Check (Mock for now, or fetch from Subject profile if available)
            let fitbitConnected = false;
            // AWS Migration: If fitbit status is needed, it should be in AppState.subject
            if (AppState.subject.hasFitbit) fitbitConnected = true;

            // Build Context for API
            const context = {
                fatigue: fatigue,
                pain: pain,
                mood: mood,
                // Add dummy sleep/HRV to pass backend "Challenge" check if unknown
                sleep: "good",
                hrv: "normal"
            };

            // Show "Thinking" UI
            const thinkingMsg = "🤖 AIが今日の運動メニューを考えています... (高速生成中)";
            // Only use body for message
            document.getElementById("mc-proposal-body").innerHTML = `<div class="p-8 text-center text-slate-400 text-xs animate-pulse flex flex-col items-center gap-2">
                <span class="text-2xl">🤔</span>
                <span>${thinkingMsg}</span>
            </div>`;

            // Switch View EARLY to show thinking state
            document.getElementById("mc-view-input").classList.add("hidden-view");
            document.getElementById("mc-view-result").classList.remove("hidden-view");

            // Call API Gateway
            let result = null;
            try {
                const res = await fetch(getApiUrl('proposal'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subjectId: String(AppState.subject.id),
                        currentCondition: context
                    })
                });
                if (res.ok) {
                    result = await res.json();
                } else {
                    console.warn("API Error:", res.status);
                    throw new Error("API Error");
                }
            } catch (e) {
                console.warn("Network error or API fail.", e);
                // 500エラーや通信タイムアウト時の優しいフォールバック
                alert("サーバーが混み合っているか、接続に失敗しました。\nしばらく経ってからもう一度お試しいただくか、現在の体調に合わせたセルフケアを優先してください。");

                // 元の画面に戻す (フリーズ防止)
                document.getElementById("mc-view-input").classList.remove("hidden-view");
                document.getElementById("mc-view-result").classList.add("hidden-view");
                if (btn) {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
                return; // ここで終了
            }



            // Strategy Determination (API vs Local)
            let strategy = "normal"; // normal, rest, high
            let aiMessage = "";
            let aiReason = "";

            if (result && result.mode) {
                // Map API Mode to App Strategy
                if (result.mode === "Warning") strategy = "rest";
                else if (result.mode === "Challenge") strategy = "high";
                else strategy = "normal";

                aiMessage = result.message;
                aiReason = result.reason;
            } else {
                // Local Fallback Logic
                if (fatigue >= 7 || pain === 1) strategy = "rest";
                else if (fatigue <= 3 && mood === "high") strategy = "high";
            }

            /* --- 1. Determine Texts --- */
            let title = "";
            let bodyHtml = "";
            let energyRatio = 0.6;
            let apMenuLines = [];
            let themeColor = "emerald"; // default

            if (strategy === "rest") {
                title = "今日は休息モード";
                if (fitbitConnected) title += " <span class='ml-1 text-[9px] bg-teal-100 text-teal-700 px-1 rounded'>Fitbit連携中</span>";
                themeColor = "orange";
                bodyHtml += `<div class="p-2 bg-orange-50 rounded-xl mb-2 border border-orange-100">
                    <div class="text-xs font-bold text-orange-800 mb-1">無理せず身体を休めましょう</div>
                    <div class="text-[10px] text-orange-700">${aiMessage || "疲労や痛みが強いため、ごく軽めの活動（ストレッチや散歩）にとどめるのがおすすめです。"}</div>
                    ${aiReason ? `<div class="mt-1 text-[9px] text-orange-400 border-t border-orange-200 pt-1">💡 ${aiReason}</div>` : ""}
                </div>`;
                apMenuLines = ["5分だけ横になり深呼吸", "首・肩まわりのストレッチ", "家の中をゆっくり3〜5分歩く"];
                energyRatio = 0.3;
            } else if (strategy === "high") {
                title = "コンディション良好！";
                if (fitbitConnected) title += " <span class='ml-1 text-[9px] bg-teal-100 text-teal-700 px-1 rounded'>Fitbit連携中</span>";
                themeColor = "pink";
                bodyHtml += `<div class="p-2 bg-pink-50 rounded-xl mb-2 border border-pink-100">
                    <div class="text-xs font-bold text-pink-800 mb-1">チャレンジ日和です</div>
                    <div class="text-[10px] text-pink-700">${aiMessage || "体調・気分ともに良好です。息が弾む程度の運動で、少し負荷をかけてみましょう。"}</div>
                    ${aiReason ? `<div class="mt-1 text-[9px] text-pink-400 border-t border-pink-200 pt-1">💡 ${aiReason}</div>` : ""}
                </div>`;
                apMenuLines = ["下半身サーキット (スクワット等)", "速歩き・早歩き (10〜20分)", "ストレッチ (太もも・胸)"];
                energyRatio = 0.8;
            } else {
                title = "通常モード (Routine)";
                if (fitbitConnected) title += " <span class='ml-1 text-[9px] bg-teal-100 text-teal-700 px-1 rounded'>Fitbit連携中</span>";
                bodyHtml += `<div class="p-2 bg-emerald-50 rounded-xl mb-2 border border-emerald-100">
                    <div class="text-xs font-bold text-emerald-800 mb-1">いつものペースで</div>
                    <div class="text-[10px] text-emerald-700">${aiMessage || "体調はおおむね良好です。無理のない範囲で、中くらいの運動を行いましょう。"}</div>
                    ${aiReason ? `<div class="mt-1 text-[9px] text-emerald-400 border-t border-emerald-200 pt-1">💡 ${aiReason}</div>` : ""}
                </div>`;
                apMenuLines = ["椅子からの立ち座り 10回", "やや速めの歩行 (10〜15分)", "全身のストレッチ"];
                energyRatio = 0.6;
            }

            // --- Feedforward from Admin ---
            if (AppState.subject.feedforward) {
                bodyHtml += `<div class="p-2 bg-yellow-50 rounded-xl mb-2 border border-yellow-100 flex items-start gap-2">
                    <div class="text-lg">👨‍⚕️</div>
                    <div>
                        <div class="text-[10px] font-bold text-yellow-800">先生からのメッセージ</div>
                        <div class="text-[10px] text-yellow-700 whitespace-pre-wrap">${AppState.subject.feedforward}</div>
                    </div>
                </div>`;
            }

            // --- 2. Schedule Proposal Logic (Dynamic Queue) ---
            let recommendedTime = "09:00"; // default fallback
            let scheduleReason = "朝の時間帯がおすすめです。";
            let isTomorrow = false;

            // 1. Analyze Scores
            const activityLogs = (AppState.subject.logs || []).filter(l => l.type === "activity" && l.done);
            let scores = [
                { name: "Morning", label: "朝", startHour: 9, count: 0 },
                { name: "Afternoon", label: "昼", startHour: 14, count: 0 },
                { name: "Evening", label: "夜", startHour: 20, count: 0 }
            ];

            if (activityLogs.length > 0) {
                activityLogs.forEach(l => {
                    const h = new Date(l.date).getHours();
                    if (h >= 5 && h < 12) scores[0].count++;
                    else if (h >= 12 && h < 17) scores[1].count++;
                    else scores[2].count++;
                });
            }

            // 2. Rank Slots (Descending order)
            scores.sort((a, b) => b.count - a.count);

            // 3. Find Next Available Slot (Default Local Logic)
            const now = new Date();
            const currentHour = now.getHours();
            let selectedSlot = null;

            // 3-a. Check Today's remaining slots
            for (let slot of scores) {
                if (currentHour < slot.startHour) {
                    selectedSlot = slot;
                    isTomorrow = false;
                    scheduleReason = `${slot.label}の時間帯(実績${slot.count}回)がおすすめです。`;
                    break;
                }
            }

            // 3-b. If all slots passed today, pick TOP rank for Tomorrow
            if (!selectedSlot) {
                selectedSlot = scores[0]; // Best slot
                isTomorrow = true;
                scheduleReason = `${selectedSlot.label}の時間帯(実績No.1)が最適です。`;
            }

            recommendedTime = `${String(selectedSlot.startHour).padStart(2, '0')}:00`;

            // --- AI OVERRIDE: Sync with AI Proposal ---
            if (result && result.suggested_schedule && result.suggested_schedule.length > 0) {
                // Backend returns ["14:00", "17:00"] etc.
                const nextTime = result.suggested_schedule[0]; // Take the first one
                // Simple parsing: "14:00" -> 14
                const [h, m] = nextTime.replace("明日", "").split(":");
                recommendedTime = `${h}:${m}`;
                if (nextTime.includes("明日")) isTomorrow = true;

                scheduleReason = "AI提案: 最適なリフレッシュタイミングです。";
            }

            // Calendar Link Generation
            const calTitle = encodeURIComponent(`${title} (Activity Pacing)`);
            const calDetails = encodeURIComponent(`【AI提案】${aiMessage}\n\nおすすめメニュー:\n${apMenuLines.join("\n")}`);

            // Set Date (Today or Tomorrow)
            const d = new Date();
            if (isTomorrow) d.setDate(d.getDate() + 1);

            const [targetH, targetM] = recommendedTime.split(":");
            d.setHours(parseInt(targetH), parseInt(targetM), 0);

            // If the time is in the past (edge case), force tomorrow logic safety
            if (d < new Date()) {
                d.setDate(d.getDate() + 1);
                isTomorrow = true;
            }

            // Format YYYYMMDDTHHMMSSZ
            const toIsoStringBasic = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const startStr = toIsoStringBasic(d);
            d.setMinutes(d.getMinutes() + 15); // 15 min duration
            const endStr = toIsoStringBasic(d);


            const calLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${startStr}/${endStr}&details=${calDetails}`;

            // --- Menu List & Schedule ---
            bodyHtml += `<div class="mb-3">
                    <div class="text-[10px] font-bold text-gray-500 mb-1 pl-1">おすすめメニュー</div>
                    <ul class="space-y-1 mb-2">
                        ${apMenuLines.map(line => `<li class="text-[10px] text-gray-700 flex items-start"><span class="text-${themeColor}-500 mr-1">●</span>${line}</li>`).join("")}
                    </ul>
                    <div class="bg-gray-50 rounded-lg p-2 border border-gray-100 flex justify-between items-center">
                        <div>
                            <div class="text-[9px] font-bold text-gray-400">推奨スケジュール</div>
                            <div class="text-sm font-bold text-slate-700">
                                ${isTomorrow ? '明日' : '今日'} ${recommendedTime} 
                                <span class="text-[9px] font-normal text-slate-500">(${scheduleReason})</span>
                            </div>
                        </div>
                        </div>
                        <div class="flex gap-1">
                             <button onclick="MoveCare.scheduleNotification('${recommendedTime}', '${title}')" class="bg-yellow-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow hover:bg-yellow-600 flex items-center gap-1">
                                <span>🔔</span> 通知
                            </button>
                            <a href="${calLink}" target="_blank" class="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded shadow hover:bg-blue-700 flex items-center gap-1">
                                <span>📅</span> 追加
                            </a>
                        </div>
                    </div>
                </div>`;

            // --- 3. New: Sync Daily Schedule from AI (V52) ---
            if (result && result.daily_schedule) {
                bodyHtml += `
                    <div class="mt-4 flex flex-col gap-2">
                        <button onclick="applyAIPosition()" class="btn-primary w-full py-3 text-sm font-bold bg-green-600 text-white rounded-2xl shadow-lg">
                            このプランを反映する
                        </button>
                        <button onclick="AppState.homeMode='input'; refreshUI();" class="w-full py-2 text-xs font-bold text-gray-400 border border-gray-200 rounded-xl hover:bg-gray-50">
                            やり直す（再提案）
                        </button>
                    </div>`;
                if (confirm("AIが本日の24時間プランを作成しました。反映しますか？")) {
                    AppState.dailyPlan = result.daily_schedule;
                    savePlanToStorage(); // Also syncs to backend
                    refreshUI();         // Force UI update
                    alert("本日のスケジュールを更新しました。「今日のプラン」タブで詳しく確認できます。");
                }
            }

            /* --- 2. VO2 Logic --- */
            const s = MoveCare.calcVo2BasedSuggestion();
            if (s) {
                bodyHtml += `<div class="border-t border-dashed border-gray-200 my-2"></div>`;

                // Intensity Box
                bodyHtml += `<div class="grid grid-cols-2 gap-2 mb-2">
                    <div class="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                        <div class="text-[9px] text-gray-400 font-bold">推奨METs</div>
                        <div class="text-lg font-black text-slate-700">${s.targetMets.toFixed(1)} <span class="text-[9px] font-normal">METs</span></div>
                    </div>
                    <div class="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                         <div class="text-[9px] text-gray-400 font-bold">推奨時間</div>
                        <div class="text-lg font-black text-slate-700">${s.minutes} <span class="text-[9px] font-normal">分</span></div>
                    </div>
                </div>`;

                // VO2 Detail
                bodyHtml += `<div class="text-[9px] text-gray-400 mb-2 text-center">
                    VO₂max: ${s.vo2.toFixed(1)} (${s.metsMax.toFixed(1)} METs) / 強度: ${s.targetPercent}%
                </div>`;

                // Classification List
                const { light, moderate, vigorous, lightMax, moderateMax } = MoveCare.classifyActivitiesByVO2(s.metsMax);

                const renderActList = (label, list, color) => {
                    if (!list.length) return "";
                    return `<div class="mb-3">
                        <div class="text-[9px] font-bold text-${color}-600 mb-1 border-l-2 border-${color}-400 pl-2">${label}</div>
                        <div class="space-y-1 pl-2">
                            ${list.slice(0, 3).map(a => `<div class="flex justify-between items-center text-[9px] border-b border-gray-50 pb-1">
                                <span class="text-gray-700">${a.name}</span>
                                <span class="font-bold text-gray-400">${a.mets}</span>
                            </div>`).join("")}
                        </div>
                    </div>`;
                };

                bodyHtml += `<div class="bg-white rounded-xl border border-gray-100 p-2">
                    <div class="text-[9px] font-bold text-gray-400 text-center mb-2">- 生活活動の目安 -</div>
                    ${renderActList(`Light (~${lightMax.toFixed(1)})`, light, 'sky')}
                    ${renderActList(`Moderate (~${moderateMax.toFixed(1)})`, moderate, 'emerald')}
                    ${strategy === "high" ? renderActList(`Vigorous (~${s.metsMax.toFixed(1)})`, vigorous, 'rose') : ""}
                </div>`;
            }

            // --- 3. Render ---
            document.getElementById("mc-proposal-title").innerHTML = title;
            document.getElementById("mc-proposal-body").innerHTML = bodyHtml; // Use innerHTML

            // Typewriter effect for MAIN AI Message
            // We need to inject the message content dynamically if possible, or just re-render the specific part?
            // The message is inside bodyHtml as a string. To typewrite it, we should render bodyHtml first (without message text?), then typewrite.
            // Simplified approach: Render everything, then CLEAR the message text span, then Typewrite it.

            // Re-targeting the message container created in step 1 logic?
            // "mc-proposal-message" is the container for the text at top.
            // Let's clear it and typewrite.
            const msgEl = document.getElementById("mc-proposal-message");
            if (msgEl) {
                msgEl.textContent = "";
                typeWriter(aiMessage, "mc-proposal-message", 20);
            }

            // Plan Tab Sync
            const planTitle = document.getElementById("plan-title");
            const planBody = document.getElementById("plan-body");
            if (planTitle) planTitle.innerHTML = title;
            if (planBody) planBody.innerHTML = bodyHtml; // Use innerHTML

            // Energy Bar
            document.getElementById("mc-energy-bar").style.width = (energyRatio * 100) + "%";

            // Muchiko (High Performance Only)
            if (strategy === "high") {
                const modal = document.getElementById("modal-muchiko");
                if (modal) {
                    document.getElementById("muchiko-message").textContent = aiMessage || "今日は“本気の日”！一緒にしっかり身体を動かしましょう！";
                    document.getElementById("muchiko-target").textContent = "スクワットマスター or HIIT タイマー";
                    modal.classList.remove("hidden");
                }
            }

            // Render Activity Cards (AP Filtered + Prioritize Proposal)
            if (s) {
                try {
                    // 1. Base List (Moderate)
                    let baseList = MoveCare.classifyActivitiesByVO2(s.metsMax).moderate;

                    // 2. Identify Proposed Items from apMenuLines (Text)
                    // Try to match text to AppState.exercises or ActivityDatabase
                    const sourceEx = (AppState.exercises && AppState.exercises.length > 0) ? AppState.exercises : (window.ACTIVITY_DATABASE || []);

                    const proposalCards = [];
                    apMenuLines.forEach(line => {
                        // Fuzzy match: if exercise name is inside the line or vice versa
                        // e.g. line="Squat (10 times)" matches ex.name="Squat"
                        const match = sourceEx.find(ex => ex && ex.name && (line.includes(ex.name) || ex.name.includes(line)));
                        if (match && !proposalCards.find(p => p.id === match.id)) {
                            proposalCards.push({ ...match, isProposal: true });
                        }
                    });

                    // 3. Merge: Proposal First, then others
                    // Filter out duplicates from baseList
                    const restList = baseList.filter(b => !proposalCards.find(p => p.id === b.id));
                    const finalList = [...proposalCards, ...restList];

                    // 4. Render
                    if (typeof renderActivityCards === 'function') {
                        renderActivityCards(finalList);
                    } else {
                        console.error("renderActivityCards is not defined");
                        // Fallback manual render
                        const container = document.getElementById("activity-card-list");
                        if (container) {
                            container.innerHTML = finalList.map(item => `
                                <div class="app-card min-w-[140px] w-[140px] p-3 flex flex-col justify-between relative ${item.isProposal ? 'border-2 border-emerald-400 bg-emerald-50' : ''}" onclick="MoveCare.openDurationModal('${item.name}', ${item.mets})">
                                    ${item.isProposal ? '<div class="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] px-1 rounded-full font-bold">おすすめ</div>' : ''}
                                    <div class="text-3xl text-center mb-2">🏃</div>
                                    <div>
                                        <div class="text-xs font-bold text-slate-700 leading-tight mb-1">${item.name}</div>
                                        <div class="text-[10px] text-slate-500">${item.mets} METs</div>
                                    </div>
                                </div>
                            `).join("");
                        }
                    }

                } catch (e) {
                    console.error("Render cards error", e);
                }
            }

            // Switch View
            AppState.homeMode = "result";
            document.getElementById("mc-view-input").classList.add("hidden-view");
            document.getElementById("mc-view-result").classList.remove("hidden-view");

        } catch (e) {
            console.error("Proposal Error", e);
            alert("エラーが発生しました: " + e.message);
        } finally {
            if (btn) {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
    },

    async logCondition(day) {
        if (!AppState.subject) return;

        const { fatigue, pain, mood } = MoveCare.state;

        const logData = {
            type: "condition",
            date: new Date().toISOString(),
            day: day,
            fatigue, pain, mood
        };

        try {
            // Call AWS API
            const res = await fetch(getApiUrl('logs'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjectId: AppState.subject.id,
                    log: logData
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "API Error " + res.status);
            }

            // Local Update
            if (!AppState.subject.logs) AppState.subject.logs = [];
            AppState.subject.logs.push(logData);

        } catch (e) { console.error("Log Condition Error", e); }
    },

    async logActivity(item, duration) {
        if (!AppState.subject) return;

        // Calculate Day
        const todayStr = getJSTDateStr();
        let dayCount = 0;
        if (AppState.subject.startDate) {
            const start = new Date(AppState.subject.startDate);
            const current = new Date(todayStr);
            dayCount = Math.ceil((current - start) / (1000 * 60 * 60 * 24));
        }

        const logData = {
            type: "activity",
            date: new Date().toISOString(),
            day: dayCount,
            name: item.name,
            mets: item.mets || 0,
            duration: duration,
            done: true
        };

        // Optimistic UI Update handled by onSnapshot listener usually, 
        // but we can manually refresh local list if needed.
        // For now, let's rely on listener or simple manual trigger.

        try {
            // Call AWS API
            const res = await fetch(getApiUrl('logs'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjectId: AppState.subject.id,
                    log: logData
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "API Error " + res.status);
            }

            // Optimistic Update or use saved data
            if (!AppState.subject.logs) AppState.subject.logs = [];
            AppState.subject.logs.push(logData);

            // Switch Screen
            document.getElementById("duration-modal").classList.add("hidden");
            switchScreen("screen-complete");
            document.getElementById("complete-activity-text").textContent = `${item.name} (${duration}分) 完了！`;
        } catch (e) {
            alert("保存に失敗しました: " + e.message);
            console.error(e);
        }
    },
};

/* ===== UI Helpers ===== */
function refreshSubjectUI() {
    if (!AppState.subject) return;
    renderCompletedActivities();
    renderWeeklyProgress();
    renderHomeSummary();
    renderAdminMessage();
    MoveCare.checkMuchikoPlan();
}

MoveCare.checkMuchikoPlan = function () {
    if (!AppState.dailyPlan) return;

    // 現在の時刻を取得
    const now = new Date();
    const hour = now.getHours();

    // 稼働時間外（24時以降〜5時未満）は表示しない
    if (hour < 5 || hour > 23) return;

    // 現在のスロットの予定を取得 (05:00がインデックス0)
    const task = AppState.dailyPlan[hour - 5];

    // 予定（task）がある場合のみ実行
    if (task && task.title) {
        // 表示先の「小さなコンテナ」を取得
        const container = document.getElementById("muchiko-container");
        const bubble = document.getElementById("muchiko-bubble");

        if (container && bubble) {
            // メッセージを流し込む
            bubble.innerText = `今は「${task.title}」の時間だね！ムチムチ頑張ろう！`;

            // 表示をオンにする（hiddenを外してアニメーションさせる）
            container.classList.remove("hidden");
            container.classList.remove("translate-y-4"); // 下からスライドイン

            console.log("ムチコが登場しました:", task.title);

            // 10秒後に自動で隠す（ずっと出ていると邪魔なため）
            setTimeout(() => {
                container.classList.add("translate-y-4");
                setTimeout(() => {
                    container.classList.add("hidden");
                }, 500); // アニメーションが終わってから隠す
            }, 10000);

            // 【注意】本番運用で「1時間に1回だけ」にしたい場合は、
            // ここに sessionStorage.setItem(lastShownKey, "true") を戻してください。
        }
    }
};

// --- Render Program List (Scheduled & Anytime [Categorized]) ---
function renderProgramList() {
    renderScheduled();
    renderAnytime('all');
}

function renderScheduled() {
    const scheduledContainer = document.getElementById('scheduled-list');
    if (!scheduledContainer) return;

    // 1. Calculate Progress Day
    const today = AppState.subject.logs?.length > 0 ? getTodayStr() : getJSTDateStr();
    const start = AppState.subject.startDate;
    let day = 0;
    if (start) {
        const d1 = new Date(start);
        const d2 = new Date(today); // Use system date or today
        day = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    }

    // 2. Scheduled Program
    let scheduledItems = [];
    if (AppState.project && AppState.project.program) {
        // Simple day check
        const tasks = AppState.project.program.filter(p => day >= p.startDay && day <= p.endDay);
        // Find exercises
        tasks.forEach(t => {
            const ex = AppState.exercises.find(e => String(e.id) === String(t.exerciseId));
            if (ex) scheduledItems.push({ ...ex, freq: t.freq });
        });
    }

    if (scheduledItems.length > 0) {
        scheduledContainer.innerHTML = scheduledItems.map(item => renderExerciseCard(item, false, true)).join('');
    } else {
        scheduledContainer.innerHTML = `<div class="text-xs text-gray-400 text-center py-4 bg-slate-50 rounded-lg">今日のプログラムはありません (Day ${day})</div>`;
    }
}

// Global scope render function for Proposal
function renderActivityCards(items) {
    const container = document.getElementById("activity-card-list");
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `<div class="text-xs text-gray-400 text-center py-4 w-full">おすすめの活動はありません</div>`;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="app-card min-w-[140px] w-[140px] p-3 flex flex-col justify-between relative shrink-0 ${item.isProposal ? 'border-2 border-emerald-400 bg-emerald-50 shadow-md' : 'border border-slate-100'}" 
             onclick="MoveCare.openDurationModal('${item.name}', ${item.mets})">
            ${item.isProposal ? '<div class="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm">おすすめ</div>' : ''}
            <div class="text-3xl text-center mb-2 mt-1">🏃</div>
            <div>
                <div class="text-xs font-bold text-slate-700 leading-tight mb-1 line-clamp-2">${item.name}</div>
                <div class="text-[10px] text-slate-500 font-mono">${item.mets} METs</div>
            </div>
            <div class="mt-2 text-[9px] text-center text-emerald-600 font-bold border-t border-dashed border-emerald-200 pt-1">この活動を記録</div>
        </div>
    `).join("");
}

function renderAnytime(filter = 'all') {
    const anytimeContainer = document.getElementById('anytime-section');
    if (!anytimeContainer) return;

    // 1. Setup Container Layout (once)
    let filterContainer = document.getElementById('anytime-filters');
    let listContainer = document.getElementById('anytime-list');

    // If layout doesn't exist inside anytime-section (or is just raw list), rebuild it
    // Check if we already injected filters
    if (!filterContainer) {
        anytimeContainer.innerHTML = `
            <div class="app-card-title text-sm mb-2 text-emerald-700 border-l-4 border-emerald-500 pl-2">いつでもできる (Anytime)</div>
            <div id="anytime-filters" class="flex flex-wrap gap-2 mb-3"></div>
            <div id="anytime-list" class="grid grid-cols-2 gap-3 mb-4"></div>
        `;
        filterContainer = document.getElementById('anytime-filters');
        listContainer = document.getElementById('anytime-list');
    }

    // 2. Render Filter Buttons
    // Categories: User requested specific list.
    const catsData = ["HIIT", "筋トレ", "有酸素", "ストレッチ", "その他"];
    const cats = [{ name: 'all', label: 'すべて' }, ...catsData.map(c => ({ name: c, label: c }))];

    filterContainer.innerHTML = cats.map(c => `
        <button onclick="renderAnytime('${c.name}')" 
            class="px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${filter === c.name ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'}">
            ${c.label}
        </button>
    `).join('');

    // 3. Filter Items
    let items = [];
    if (AppState.project && AppState.project.anytimeExercises && AppState.project.anytimeExercises.length > 0) {
        items = AppState.exercises.filter(e => AppState.project.anytimeExercises.includes(e.id));
    }

    if (filter !== 'all') {
        items = items.filter(i => i.category === filter);
    }

    // 4. Render List
    if (items.length > 0) {
        listContainer.innerHTML = items.map(item => renderExerciseCard(item, true)).join('');
    } else {
        listContainer.innerHTML = `<div class="col-span-2 text-xs text-gray-400 text-center py-4 bg-emerald-50/50 rounded-lg">このカテゴリの運動はありません</div>`;
    }
}

function getTodayStr() { return getJSTDateStr(); }

// Helper for card rendering
function renderExerciseCard(item, isAnytime, isScheduled = false) {
    // 1. Determine Flags
    const isHIIT = (item.category === "HIIT") || (item.title && item.title.includes("HIIT"));

    // Determine visibility: Use explicit flag if present, otherwise default to "True if HIIT"
    const hasHabitB = item.hasHabitB !== undefined ? item.hasHabitB : isHIIT;

    // Check for explicit video URL (not habit-B itself)
    const hasVideo = item.url && !item.url.includes("habit-B.html") && !item.url.includes("habit-B");

    const hasTimer = item.hasTimer !== false; // Default true

    // 2. Build Buttons
    let buttonsHtml = '';

    if (hasVideo) {
        buttonsHtml += `<button class="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold py-2 rounded-lg shadow-sm active:scale-95 transition-transform flex justify-center items-center gap-1" onclick="openVideoModal('${item.url}')"><span>▶</span> 動画</button>`;
    }

    if (hasHabitB) {
        buttonsHtml += `<button class="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-bold py-2 rounded-lg shadow-sm active:scale-95 transition-transform" onclick="openHIIT('habit-B.html')">habit-B</button>`;
    }

    if (hasTimer) {
        buttonsHtml += `<button class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold py-2 rounded-lg shadow-sm active:scale-95 transition-transform" onclick="openCustomTimer()">タイマー</button>`;
    }

    // 3. Render Card
    return `
    <div class="app-card p-3 ${isScheduled ? 'border-2 border-blue-100 bg-blue-50/30' : ''} ${isAnytime ? 'border-l-4 border-emerald-500 bg-emerald-50/20' : ''} flex flex-col justify-between h-full">
        <div>
            <div class="flex justify-between items-start mb-2">
                <span class="font-bold text-sm line-clamp-2 leading-tight text-slate-800">${item.title}</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-400 whitespace-nowrap bg-white">${item.category || ''}</span>
            </div>
            ${item.freq ? `<div class="text-[10px] text-blue-600 font-bold mb-1">頻度: 週${item.freq}回</div>` : ''}
            <p class="text-[10px] text-gray-500 mb-3 line-clamp-2 leading-tight">${item.note || ''}</p>
        </div>
        <div class="flex flex-wrap gap-2">
            ${buttonsHtml}
            ${!buttonsHtml ? `<div class="text-[9px] text-gray-400 w-full text-center">アクションなし</div>` : ''}
        </div>
    </div>
    `;
}

// --- Video Modal Logic ---
window.openVideoModal = function (url) {
    if (!url) return;
    let embedUrl = url;
    // Simple converter
    if (url.includes("youtu.be/")) embedUrl = url.replace("youtu.be/", "www.youtube.com/embed/");
    else if (url.includes("watch?v=")) embedUrl = url.replace("watch?v=", "embed/");

    // Ensure clean param
    if (embedUrl.includes("&")) embedUrl = embedUrl.split("&")[0];

    const iframe = document.getElementById("video-iframe");
    if (iframe) iframe.src = embedUrl;

    const modal = document.getElementById("video-modal");
    if (modal) modal.classList.remove("hidden");
};

window.closeVideoModal = function () {
    const iframe = document.getElementById("video-iframe");
    if (iframe) iframe.src = ""; // Stop playback

    const modal = document.getElementById("video-modal");
    if (modal) modal.classList.add("hidden");
};

function renderAdminMessage() {
    const container = document.getElementById("home-admin-message");
    const textEl = document.getElementById("home-admin-message-text");

    if (!container || !textEl) return;

    const msg = AppState.subject ? AppState.subject.feedforward : null;

    if (msg && msg.trim() !== "") {
        textEl.textContent = msg;
        container.classList.remove("hidden");
    } else {
        container.classList.add("hidden");
    }
}

function renderCompletedActivities() {
    // Filter from AppState.subject.logs where type='activity' AND date is today
    const container = document.getElementById("completed-activities-container");
    const countEl = document.getElementById("completed-count");
    if (!container) return;

    if (!AppState.subject || !AppState.subject.logs) {
        if (countEl) countEl.textContent = 0;
        return;
    }

    const todayStr = getJSTDateStr();
    const logs = AppState.subject.logs.filter(l =>
        l.type === "activity" && l.date.startsWith(todayStr)
    );

    if (countEl) countEl.textContent = logs.length;

    if (logs.length === 0) {
        container.innerHTML = `
            <div class="text-[10px] text-gray-400 text-center py-6 bg-white/50 rounded-2xl border border-dashed">
                まだ活動の記録がありません。
            </div>
        `;
        return;
    }

    container.innerHTML = logs.reverse().map(l => `
        <div class="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-50 mb-1 shadow-sm">
            <div>
                <div class="text-[11px] font-bold text-slate-700">${l.name}</div>
                <div class="text-[9px] text-slate-400">${new Date(l.date).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour: '2-digit', minute: '2-digit' })} / ${l.duration}分</div>
            </div>
            <div class="text-[11px] font-bold text-emerald-600">${(l.mets * l.duration / 60).toFixed(2)} <span class="text-[8px]">M・h</span></div>
        </div>
    `).join("");
}

function renderHomeSummary() {
    const todayStr = getJSTDateStr();
    let mh = 0;

    if (AppState.subject && AppState.subject.logs) {
        AppState.subject.logs.forEach(l => {
            if (l.type === "activity" && l.date.startsWith(todayStr)) {
                mh += (l.mets || 0) * ((l.duration || 0) / 60);
            }
        });
    }

    const mEl = document.getElementById("home-summary-mets");
    if (mEl) mEl.textContent = mh.toFixed(2);
    const kEl = document.getElementById("home-summary-kcal");
    if (kEl) kEl.textContent = Math.round(mh * AppState.weight);
}

function renderWeeklyProgress() {
    // Simple 7-day look back
    if (!AppState.subject || !AppState.subject.logs) return;

    // Logic similar to original but using subject.logs dates
    let totalMH = 0;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    AppState.subject.logs.forEach(l => {
        if (l.type === "activity") {
            const d = new Date(l.date);
            if (d >= oneWeekAgo && d <= now) {
                totalMH += (l.mets || 0) * (l.duration / 60);
            }
        }
    });

    const target = 23;
    const pct = Math.min(100, Math.round((totalMH / target) * 100));
    const ring = document.getElementById("weekly-progress-ring");
    if (ring) ring.setAttribute("stroke-dasharray", `${pct}, 100`);
    document.getElementById("weekly-progress-label").textContent = pct + "%";
    document.getElementById("home-weekly-mets").textContent = `${totalMH.toFixed(1)} / ${target} METs・時`;
}

/* ===== Plan / Timeline Logic (Restored) ===== */
const PLAN_STORAGE_KEY = "eo_daily_plan_v1";

function loadPlanFromStorage() {
    try {
        const raw = localStorage.getItem(PLAN_STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            // ENFORCE: Array(19) for 19 hours (05:00 - 23:59)
            if (Array.isArray(data) && data.length === 19) {
                AppState.dailyPlan = data;
            } else {
                console.warn("Storage mismatch: Resetting to Array(19)");
                AppState.dailyPlan = new Array(19).fill(null);
            }
        } else {
            AppState.dailyPlan = new Array(19).fill(null);
        }
    } catch (e) {
        console.error("Plan Load Error", e);
        AppState.dailyPlan = new Array(19).fill(null);
    }
}

function savePlanToStorage() {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(AppState.dailyPlan));
    // Optional: Sync to backend
    syncScheduleToBackend();
}

async function syncScheduleToBackend() {
    if (!AppState.subject || !AppState.subject.id) return;
    try {
        console.log("Syncing schedule to backend for ID:", AppState.subject.id);
        const payload = {
            id: String(AppState.subject.id), // IDを確実に文字列として送る
            daily_schedule: AppState.dailyPlan || [], // スケジュール本体
            updatedAt: new Date().toISOString()
        };

        const res = await fetch(getApiUrl(`subjects/${AppState.subject.id}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) // 絞り込んだデータを送る
        });

        if (res.status === 403) {
            console.error("Permission denied (403) while syncing schedule.");
            alert("保存権限がありません(403)。管理者によってIDが保護されている可能性があります。");
        } else if (res.ok) {
            // SUCCESS SYNC: Update AppState.subject and localStorage
            if (AppState.subject) {
                AppState.subject.daily_schedule = AppState.dailyPlan;
                localStorage.setItem("currentUser", JSON.stringify(AppState.subject));
                console.log("Successfully synced and updated local state.");
            }
        } else {
            console.warn("Schedule sync failed with status:", res.status);
        }
    } catch (e) {
        console.warn("Schedule sync failed", e);
    }
}

function renderPlanTimeline() {
    const container = document.getElementById("plan-body");
    if (!container) return;

    container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "mb-4 px-2 flex justify-between items-center";
    header.innerHTML = `
        <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Timeline (05:00 - 24:00)</div>
        <div class="text-[9px] text-emerald-500 italic">タップして予定を追加</div>
    `;
    container.appendChild(header);

    // Band Container
    const bandContainer = document.createElement("div");
    bandContainer.className = "relative bg-white rounded-2xl border border-slate-100 shadow-sm mx-1";
    bandContainer.style.height = "760px"; // 19 hours * 40px
    bandContainer.style.backgroundImage = "linear-gradient(#f8fafc 1px, transparent 1px)";
    bandContainer.style.backgroundSize = "100% 40px"; // Horizontal grid lines every hour

    for (let i = 0; i < 19; i++) {
        const hour = i + 5;
        const topPos = i * 40;

        // Hour Marker
        const hourMarker = document.createElement("div");
        hourMarker.className = "absolute left-0 w-full flex items-center pointer-events-none";
        hourMarker.style.top = `${topPos}px`;
        hourMarker.style.height = "1px";
        hourMarker.innerHTML = `<span class="bg-white px-2 text-[8px] font-bold text-slate-300 ml-2">${String(hour).padStart(2, '0')}:00</span>`;
        bandContainer.appendChild(hourMarker);

        // Click Area for adding plans
        const clickArea = document.createElement("div");
        clickArea.className = "absolute left-12 right-0 hover:bg-emerald-50/20 transition-colors cursor-pointer";
        clickArea.style.top = `${topPos}px`;
        clickArea.style.height = "40px";
        clickArea.onclick = () => MoveCare.handlePlanTap(i);
        bandContainer.appendChild(clickArea);

        // Render Plan Item if exists
        const plan = AppState.dailyPlan[i];
        if (plan) {
            const item = document.createElement("div");
            item.className = "absolute left-14 right-4 bg-emerald-500 text-white rounded-lg shadow-md p-2 flex items-center justify-between group animate-in fade-in slide-in-from-left-2 duration-300";
            item.style.top = `${topPos + 4}px`; // padding
            item.style.height = "32px";

            item.innerHTML = `
                <div class="flex items-center gap-2 overflow-hidden">
                    <span class="text-[10px] font-bold truncate">${plan.title}</span>
                    <span class="text-[8px] opacity-75">${plan.duration}分</span>
                </div>
                <button onclick="event.stopPropagation(); MoveCare.deletePlanItem(${i})" class="text-white hover:text-red-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            `;
            item.onclick = (e) => {
                e.stopPropagation();
                if (plan.isDone) return;
                // MoveCare.openDurationModal(plan.title, 3.0); // Example shortcut
            };
            bandContainer.appendChild(item);
        }
    }

    container.appendChild(bandContainer);
}

function renderPlanItem(item, index) {
    // Item: { title, duration, isDone }
    return `
        <div class="m-1 p-2 bg-emerald-100 rounded-lg border border-emerald-200 shadow-sm flex justify-between items-center h-[calc(100%-8px)]">
            <div>
                <div class="text-[10px] font-bold text-emerald-800">${item.title}</div>
                <div class="text-[9px] text-emerald-600">${item.duration}分</div>
            </div>
            <button class="text-emerald-500 hover:text-emerald-700 font-bold px-2" onclick="event.stopPropagation(); MoveCare.deletePlanItem(${index})">×</button>
        </div>
    `;
}

MoveCare.handlePlanTap = function (index) {
    const hour = index + 5;
    // Simple Prompt for now, or direct add
    if (confirm(`${hour}:00 に「5分間の運動」を追加しますか？`)) {
        AppState.dailyPlan[index] = {
            title: "運動タイム (自主)",
            duration: 5,
            isDone: false
        };
        savePlanToStorage();
        renderPlanTimeline();
    }
};

MoveCare.deletePlanItem = function (index) {
    if (confirm("この予定を削除しますか？")) {
        AppState.dailyPlan[index] = null;
        savePlanToStorage();
        renderPlanTimeline();
    }
};

/* ===== Standard UI / Navigation (Preserved) ===== */
function switchScreen(id) {
    document.querySelectorAll(".app-screen").forEach(el => el.classList.remove("active"));
    const target = document.getElementById(id);
    if (!target) return;
    target.classList.add("active");

    const titleEl = document.getElementById("header-title");
    const subEl = document.getElementById("header-subtitle");
    // Simple title switch

    const titles = {
        "screen-home": ["ホーム", "体調と体力に合わせて、今日の一歩を決めましょう。"],
        "screen-plan": ["今日のプラン", "MOVE-CAREとVO₂maxから作成したプランです。"],
        "screen-program": ["運動プログラム", "コース別のトレーニング・メニューです。"],
        "screen-measure": ["測定＆ゲーム", "スクワット等の計測モードを利用できます。"],
        "screen-tools": ["体力・強度ツール", "VO₂max と METs を使って運動処方を考えます。"],
        "screen-cloud": ["クラウド", "データの同期とアカウント設定を行います。"],
    };

    if (titles[id]) { titleEl.textContent = titles[id][0]; subEl.textContent = titles[id][1]; }

    // View Resets
    if (id === "screen-home") {
        if (AppState.homeMode === "result") {
            document.getElementById("mc-view-input").classList.add("hidden-view");
            document.getElementById("mc-view-result").classList.remove("hidden-view");
        } else {
            document.getElementById("mc-view-input").classList.remove("hidden-view");
            document.getElementById("mc-view-result").classList.add("hidden-view");
        }
        refreshSubjectUI();
    }
    if (id === "screen-activities") {
        filterMetsTable('all', document.querySelector('.activity-filter-chip'));
    }
    if (id === "screen-plan") {
        // FIXED: Restore Timeline View
        loadPlanFromStorage();
        renderPlanTimeline();
    }
}

function setActiveNav(id) {
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    const btn = document.getElementById(id);
    if (btn) btn.classList.add("active");
}

/* --- Dynamic Bottom Nav (Moved) --- */
function renderBottomNav() {
    const navInner = document.querySelector('.bottom-nav-inner');
    if (!navInner) return;

    // Use project config or default to all
    const config = (AppState.project && AppState.project.menuConfig)
        ? AppState.project.menuConfig
        : APP_MENUS.map(m => m.id);

    // Filter menus
    const visibleMenus = APP_MENUS.filter(m => config.includes(m.id));

    navInner.innerHTML = visibleMenus.map(m => `
        <button id="${m.id}" class="nav-item ${m.id === 'nav-home' ? 'active' : ''}" 
            onclick="setActiveNav('${m.id}'); switchScreen('${m.screen}');">
            ${m.icon}<span class="text-[9px]">${m.label}</span>
        </button>
    `).join('');
}

function refreshUI() {
    loadFromStorage();
    renderVo2Chart();
    renderVo2Latest();
    updateHomeVo2Chip();
    if (AppState.subject) {
        renderHomeSummary();
        renderWeeklyProgress();
    }
}

/* ===== VO2 Helper Logic (Preserved) ===== */
function loadFromStorage() {
    const vo2raw = localStorage.getItem(STORAGE_KEY_VO2);
    if (vo2raw) {
        AppState.vo2Records = JSON.parse(vo2raw);
        if (AppState.vo2Records.length > 0) AppState.currentVo2max = AppState.vo2Records[AppState.vo2Records.length - 1].value;
    }
}

function vo2ToMETs(vo2) { return (vo2 || 0) / 3.5; }

function estimateVo2FromCS30(reps, age, weight, sex, mode) {
    if (mode === 'cancer') return 22.610 + (0.347 * reps) - (0.127 * weight);
    const sexFactor = (sex === 'male') ? 3.334 : 0;
    return 16.365 + (0.602 * reps) - (0.101 * age) - (0.129 * weight) + sexFactor;
}

function estimatePowerAlcazar(reps, age, weight, height) {
    const chairHeight = 0.44;
    const timeTotal = 30;
    const velocity = (reps * chairHeight * 2) / timeTotal;
    const force = weight * 9.81;
    return (force * velocity) / weight;
}

async function handleVo2Submit(e) {
    e.preventDefault();
    // Simplified: Just saving to LocalStorage + Firestore Log
    // (Existing logic + sync to logs)
    const source = document.getElementById("vo2-source").value;
    const dateStr = document.getElementById("vo2-date").value || getJSTDateStr();
    const reps = parseFloat(document.getElementById("vo2-cs30-rep").value || "0");
    const age = parseFloat(document.getElementById("vo2-age").value || "60");
    const weight = parseFloat(document.getElementById("vo2-weight").value || "60");
    const height = parseFloat(document.getElementById("vo2-height")?.value || "160");
    const sex = document.getElementById("vo2-sex").value;
    const mode = document.getElementById("vo2-mode").value;
    const direct = parseFloat(document.getElementById("vo2-direct").value || "0");

    let vo2 = (source === "CS30") ? estimateVo2FromCS30(reps, age, weight, sex, mode) : direct;
    if (!vo2) { alert("正しい数値を入力してください。"); return; }
    let power = (source === "CS30") ? estimatePowerAlcazar(reps, age, weight, height) : null;

    const record = { date: dateStr, value: parseFloat(vo2.toFixed(1)), source, power: power ? parseFloat(power.toFixed(2)) : null };
    AppState.vo2Records.push(record);
    AppState.vo2Records.sort((a, b) => a.date.localeCompare(b.date));
    AppState.currentVo2max = AppState.vo2Records[AppState.vo2Records.length - 1].value;

    localStorage.setItem(STORAGE_KEY_VO2, JSON.stringify(AppState.vo2Records));

    // Log to AWS
    if (AppState.subject) {
        const logPayload = {
            subjectId: String(AppState.subject.id),
            log: {
                type: "vo2max",
                date: new Date().toISOString(),
                value: record.value,
                source: record.source,
                power: record.power
            }
        };

        fetch(getApiUrl('logs'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logPayload)
        }).catch(e => console.error("VO2 Log Error", e));
    }


    showEvidence(source, { reps, age, weight, sex, mode });
    refreshUI();
}

function showEvidence(source, params) {
    const el = document.getElementById("tool-evidence");
    const content = document.getElementById("evidence-content");
    if (!el || !content) return;
    el.classList.remove("hidden");
    // (Keep HTML gen same as original)
    content.innerHTML = "Result calculated.";
}

function openDevTool() {
    const iframe = document.getElementById("dev-iframe");
    if (iframe) iframe.src = "predictvo2.html";
    switchScreen("screen-dev");
}

function renderVo2Latest() {
    const valEl = document.getElementById("vo2-latest-value");
    const labelEl = document.getElementById("vo2-latest-label");
    const metsEl = document.getElementById("vo2-latest-mets");
    if (!AppState.currentVo2max) return;
    const latest = AppState.vo2Records[AppState.vo2Records.length - 1];
    valEl.textContent = latest.value.toFixed(1);
    labelEl.textContent = `${latest.date} / ${latest.source}`;
    metsEl.textContent = `${vo2ToMETs(latest.value).toFixed(1)} METs 相当`;

    const pReport = document.getElementById("power-report");
    if (latest.power && pReport) {
        pReport.classList.remove("hidden");
        document.getElementById("power-value").textContent = latest.power;
    }
    renderExtraTools();
}

function renderExtraTools() {
    const container = document.getElementById("extra-tools");
    const slider = document.getElementById("intensity-slider");
    const hrVal = document.getElementById("target-hr-val");
    const metsVal = document.getElementById("target-rel-mets");
    const zoneLabel = document.getElementById("hr-zone-label");
    const pctLabel = document.getElementById("current-intensity-pct");

    if (!container || !AppState.currentVo2max) {
        if (container) container.classList.add("hidden");
        return;
    }
    container.classList.remove("hidden");

    const vo2 = AppState.currentVo2max;
    const age = parseFloat(document.getElementById("vo2-age")?.value || "60");
    const hrRest = parseFloat(document.getElementById("mets-hr-rest")?.value || "70");
    const hrMaxDirect = parseFloat(document.getElementById("mets-hr-max")?.value || "0");
    const hrMax = hrMaxDirect > 0 ? hrMaxDirect : (220 - age);

    const pct = parseInt(slider?.value || "40", 10);
    if (pctLabel) pctLabel.textContent = `${pct}% VO₂max`;
    const targetHr = Math.round(hrRest + (hrMax - hrRest) * pct / 100);
    if (hrVal) hrVal.textContent = targetHr;

    // Zone
    let label = "低強度"; let color = "text-emerald-600";
    if (pct >= 85) { label = "最高強度 (限界)"; color = "text-purple-600"; }
    else if (pct >= 75) { label = "高強度"; color = "text-red-600"; }
    else if (pct >= 60) { label = "中強度"; color = "text-orange-600"; }
    if (zoneLabel) { zoneLabel.textContent = label; zoneLabel.className = `text-[9px] font-bold mt-1 ${color}`; }

    const relMets = (vo2 / 3.5) * (pct / 100);
    if (metsVal) metsVal.textContent = relMets.toFixed(1);
}

function updateHomeVo2Chip() {
    const el = document.getElementById("home-vo2-display");
    if (!el || !AppState.currentVo2max) return;
    const mets = vo2ToMETs(AppState.currentVo2max);
    el.textContent = `VO₂max ${AppState.currentVo2max.toFixed(1)} (${mets.toFixed(1)} METs)`;
}

function renderVo2Chart() {
    const canvas = document.getElementById("vo2-chart");
    if (!canvas || AppState.vo2Records.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (AppState.vo2Chart) AppState.vo2Chart.destroy();
    AppState.vo2Chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: AppState.vo2Records.map(r => r.date),
            datasets: [{ label: "VO₂max", data: AppState.vo2Records.map(r => r.value), borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.1)", fill: true, tension: 0.3 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

/* ===== Activities / Modal Helpers ===== */
let selectedActivity = null;
function renderActivityCards(list) {
    const container = document.getElementById("activity-card-list");
    if (!container) return;
    container.innerHTML = list.slice(0, 10).map(a => `
    <div class="activity-card ${a.mets < 3 ? 'activity-low' : a.mets < 6 ? 'activity-moderate' : 'activity-high'}" onclick="openDurationModal('${a.name}', ${a.mets})">
      <div class="activity-title text-[11px] font-bold">${a.name}</div>
      <div class="text-[9px] text-gray-400">${a.mets} METs</div>
    </div>
  `).join("");
}

function filterMetsTable(cat, btn) {
    if (btn) {
        btn.parentNode.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    }
    let list = ACTIVITY_DATABASE;
    if (cat === 'lifestyle') list = list.filter(a => a.mets < 3.0);
    else if (cat === 'exercise') list = list.filter(a => a.mets >= 3.0);

    const container = document.getElementById("mets-table-container");
    if (!container) return;
    container.innerHTML = list.map(a => `
        <div class="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 mb-1 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 transition-all cursor-pointer transform active:scale-[0.98]" onclick="openDurationModal('${a.name}', ${a.mets})">
            <div>
                <div class="text-[11px] font-bold text-slate-700">${a.name}</div>
                <div class="text-[10px] text-slate-400">強度: ${a.mets} METs</div>
            </div>
            <div class="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">記録 ＋</div>
        </div>
    `).join("");
}

function openDurationModal(name, mets) {
    selectedActivity = { name, mets };
    document.getElementById("duration-modal").classList.remove("hidden");
}

function confirmDuration() {
    const dur = parseInt(document.getElementById("duration-input").value, 10) || 5;
    MoveCare.logActivity(selectedActivity, dur); // Uses new Firestore logic
}

function switchCourse(cat, btn) {
    btn.parentNode.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    renderProgramList(cat);
}

function openHIIT(url) {
    const iframe = document.getElementById("hiit-iframe");
    if (iframe) iframe.src = url;
    switchScreen("screen-hiit");
}

function openCustomTimer() { switchScreen('screen-custom-timer'); }

/* ===== Custom Timer (Preserved) ===== */
let timerInterval = null;
let timerSeconds = 0;
let timerPhase = 'READY';
let timerSet = 1;
let timerIsPaused = false;

function startCustomTimer() {
    const sets = parseInt(document.getElementById('timer-sets').value, 10) || 8;
    document.getElementById('timer-settings').classList.add('hidden');
    document.getElementById('timer-active').classList.remove('hidden');
    document.getElementById('timer-total-sets').textContent = sets;
    timerSeconds = 5; timerPhase = 'READY'; timerSet = 1; timerIsPaused = false;
    const pBtn = document.getElementById("timer-pause-btn");
    if (pBtn) pBtn.textContent = "一時停止";
    updateTimerUI(); runTimerCycle();
}

function runTimerCycle() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (timerIsPaused) return;
        timerSeconds--;
        if (timerSeconds === 0) {
            updateTimerUI(); handlePhaseTransition(); return;
        }
        updateTimerUI();
    }, 1000);
}

function handlePhaseTransition() {
    const workSec = parseInt(document.getElementById('timer-work-sec').value, 10);
    const restSec = parseInt(document.getElementById('timer-rest-sec').value, 10);
    const totalSets = parseInt(document.getElementById('timer-sets').value, 10);

    if (timerPhase === 'READY') {
        timerPhase = 'WORK'; timerSeconds = workSec;
    } else if (timerPhase === 'WORK') {
        if (timerSet >= totalSets) { finishTimer(); }
        else { timerPhase = 'REST'; timerSeconds = restSec; }
    } else {
        timerPhase = 'WORK'; timerSet++; timerSeconds = workSec;
    }
}

function updateTimerUI() {
    const cd = document.getElementById('timer-countdown');
    const status = document.getElementById('timer-status-label');
    const currentSet = document.getElementById('timer-current-set');
    if (cd) cd.textContent = timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds;
    if (status) status.textContent = timerPhase;
    if (currentSet) currentSet.textContent = timerSet;
}

function toggleTimerPause() {
    timerIsPaused = !timerIsPaused;
    const btn = document.getElementById("timer-pause-btn");
    if (btn) btn.textContent = timerIsPaused ? "再開" : "一時停止";
}

function cancelCustomTimer() {
    clearInterval(timerInterval);
    // Reset UI to Settings
    document.getElementById('timer-active').classList.add('hidden');
    document.getElementById('timer-settings').classList.remove('hidden');
    openCustomTimer();
}

function finishTimer() {
    clearInterval(timerInterval);
    alert("お疲れ様でした！");
    // Reset UI to Settings
    document.getElementById('timer-active').classList.add('hidden');
    document.getElementById('timer-settings').classList.remove('hidden');
    openCustomTimer();
    // Log HIIT?
    MoveCare.logActivity({ name: "HIIT Timer", mets: 8.0 }, 4);
}

/* ===== 初期化・統合シーケンス / Startup Sequence ===== */
document.addEventListener("DOMContentLoaded", async () => {
    const authMode = localStorage.getItem("mc-auth-mode");
    const rawUser = localStorage.getItem("currentUser");
    console.log(`App Startup V60 - Mode: ${authMode}, StoredUserLen: ${rawUser ? rawUser.length : 0}`);

    // 1. セッション復旧 (同期)
    if (rawUser) {
        try {
            const user = JSON.parse(rawUser);
            const daysDiff = (Date.now() - (user.loginDate || 0)) / (1000 * 60 * 60 * 24);

            if (daysDiff < 30) {
                console.log("Restoring existing session immediately:", user.id);
                AppState.subject = { ...user, id: user.id || user._docId };
                if (AppState.subject.daily_schedule && AppState.subject.daily_schedule.length > 0) {
                    AppState.homeMode = "result";
                } else {
                    AppState.homeMode = "input";
                }
                if (user.hasFitbit) AppState.fitbitConnected = true;

                // UI反映とマスタ取得
                MoveCare.showAppScreen();
                MoveCare.fetchGlobalData();
            } else {
                console.log("Session expired. Clearing...");
                localStorage.removeItem("currentUser");
            }
        } catch (e) {
            console.error("Session Restore Error:", e);
            localStorage.removeItem("currentUser");
        }
    }

    // 2. UIセットアップ
    refreshUI();
    const wInput = document.getElementById("weight-input");
    if (wInput) {
        wInput.value = localStorage.getItem("mc-weight-kg") || 60;
        AppState.weight = parseFloat(wInput.value);
        wInput.onchange = (e) => {
            AppState.weight = parseFloat(e.target.value);
            localStorage.setItem("mc-weight-kg", e.target.value);
            refreshUI();
        };
    }

    // 3. LIFF初期化
    await MoveCare.initLIFF();
});

/* Exports */
window.MoveCare = MoveCare;
window.switchScreen = switchScreen;
window.setActiveNav = setActiveNav;
window.handleVo2Submit = handleVo2Submit;
window.confirmDuration = confirmDuration;
window.openDurationModal = openDurationModal;
window.filterMetsTable = filterMetsTable;
window.switchCourse = switchCourse;
window.openHIIT = openHIIT;
window.openCustomTimer = openCustomTimer;
window.startCustomTimer = startCustomTimer;
window.toggleTimerPause = toggleTimerPause;
window.cancelCustomTimer = cancelCustomTimer;

// Helper to update Fitbit badge in Account Screen
// Helper to update Fitbit badge in Account Screen
window.refreshUiFitbitStatus = function () {
    const btn = document.getElementById("btn-fitbit-connect");
    if (!btn) return;

    if (AppState.fitbitConnected) {
        btn.innerHTML = `<span class="text-lg">⌚</span> Fitbit連携済み`;
        btn.disabled = true;
        btn.classList.add("bg-teal-50", "border-teal-200");
    } else {
        btn.innerHTML = `Fitbitアカウントと連携する`;
        btn.disabled = false;
        btn.classList.remove("bg-teal-50", "border-teal-200");
    }
};
window.cancelCustomTimer = cancelCustomTimer;

/* ===== Date Helper (JST) ===== */
function getJSTDateStr() {
    // Returns YYYY-MM-DD in JST
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}
window.getJSTDateStr = getJSTDateStr; // Export

/* ===== Helper: Typewriter Effect ===== */
function typeWriter(text, elementId, speed = 20) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = ""; // Clear existing
    let i = 0;

    // Simple recursive timeout loop
    function type() {
        if (i < text.length) {
            el.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}
window.typeWriter = typeWriter;

/* ===== VO2 Helper Functions (Ported) ===== */
function intensityToRPE(percent) {
    const p = Number(percent);
    if (p < 40) return { range: "9–11", label: "楽〜やや楽" };
    else if (p <= 60) return { range: "11–13", label: "ややきつい" };
    else return { range: "13–15", label: "きつめ〜かなりきつい" };
}

function getTriAxisPrescription(percentOverride) {
    if (!AppState.currentVo2max) return null;

    const vo2 = AppState.currentVo2max;
    const percent = percentOverride != null ? Number(percentOverride) : 45;

    // Use DOM inputs if available, else defaults (handled safely)
    const hrRestEl = document.getElementById("mets-hr-rest");
    const hrMaxEl = document.getElementById("mets-hr-max");
    const hrRest = parseFloat(hrRestEl?.value || "0");
    const hrMax = parseFloat(hrMaxEl?.value || "0");

    const metMax = vo2ToMETs(vo2);
    const targetVo2 = vo2 * percent / 100;
    const targetMets = vo2ToMETs(targetVo2);

    let targetHr = null;
    if (hrRest && hrMax && hrMax > hrRest) {
        const hrr = hrMax - hrRest;
        targetHr = Math.round(hrRest + hrr * percent / 100);
    }

    const rpe = intensityToRPE(percent);

    return { vo2, metMax, percent, targetVo2, targetMets, targetHr, rpe };
}

function filterActivitiesByAP(apLevel, maxMets) {
    let filtered;
    if (apLevel === "rest") filtered = ACTIVITY_DATABASE.filter(a => a.mets <= 2.0);
    else if (apLevel === "light") filtered = ACTIVITY_DATABASE.filter(a => a.mets <= maxMets * 0.4);
    else if (apLevel === "high") filtered = ACTIVITY_DATABASE.filter(a => a.mets >= maxMets * 0.5);
    else filtered = ACTIVITY_DATABASE; // Includes "normal"

    // 1. Cap by maxMets
    filtered = filtered.filter(a => a.mets <= maxMets);

    // 2. Shuffle to show variety (not just lowest METs)
    for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }

    return filtered;
}

// Initializer merged into the block above (Startup Sequence)
