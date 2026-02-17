import os
import json
import datetime
import functions_framework
from linebot.v3.messaging import (
    Configuration,
    ApiClient,
    MessagingApi,
    TextMessage,
    PushMessageRequest
)

# Global variables for lazy initialization
_db = None

def get_db():
    """Lazily initialize and return the Firestore client."""
    global _db
    if _db is None:
        import firebase_admin
        from firebase_admin import firestore
        
        # Initialize Firebase App if not already initialized
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        _db = firestore.client()
    return _db

def init_vertex():
    """Lazily initialize Vertex AI."""
    import vertexai
    
    # Project ID should be set in environment or auto-detected
    project_id = os.environ.get("GCP_PROJECT", "activity-pacing")
    location = "us-central1" # or "asia-northeast1" depending on your region choice
    try:
        vertexai.init(project=project_id, location=location)
    except Exception as e:
        print(f"Warning: Vertex AI init failed: {e}")

@functions_framework.http
def get_activity_proposal(request):
    """
    HTTP Cloud Function to determine mode and generate advice.
    Request Body:
    {
        "subjectId": "1",
        "currentCondition": { "fatigue": 5, "pain": 2, "mood": "mid", "sleep": "good", "hrv": "normal" }
    }
    """
    # CORS Headers
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {'Access-Control-Allow-Origin': '*'}

    try:
        req_json = request.get_json(silent=True)
        if not req_json:
            return (json.dumps({"error": "Invalid JSON"}), 400, headers)

        subject_id = req_json.get("subjectId")
        current_cond = req_json.get("currentCondition")

        if not subject_id or not current_cond:
            return (json.dumps({"error": "Missing subjectId or currentCondition"}), 400, headers)

        # 1. Fetch User Data
        user_data, history_logs = analyze_user_data(subject_id)
        
        # 2. Determine Mode
        mode, reason = determine_mode(history_logs, current_cond)
        
        # 3. Generate Message via AI
        message = generate_message(mode, reason, current_cond)

        result = {
            "mode": mode,
            "reason": reason,
            "message": message,
            "timestamp": datetime.datetime.now().isoformat()
        }

        return (json.dumps(result, ensure_ascii=False), 200, headers)

    except Exception as e:
        print(f"Error: {e}")
        return (json.dumps({"error": str(e)}), 500, headers)


def analyze_user_data(subject_id):
    """
    Fetches user logs from Firestore and returns DataFrame.
    """
    import pandas as pd
    
    db = get_db()
    doc_ref = db.collection("data").document("v1").collection("subjects").document(str(subject_id))
    doc = doc_ref.get()
    
    if not doc.exists:
        raise ValueError(f"Subject {subject_id} not found")
        
    data = doc.to_dict()
    logs = data.get("logs", [])
    
    # Convert to DataFrame for analysis
    if not logs:
        return data, pd.DataFrame()

    df = pd.DataFrame(logs)
    
    # Ensure date is datetime
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
        
    return data, df


def determine_mode(df_logs, current_cond):
    """
    4.2 Mode Determination Logic
    """
    import pandas as pd
    
    # Unpack current condition
    # Defaults in case of missing keys
    fatigue = int(current_cond.get("fatigue", 5))
    pain = int(current_cond.get("pain", 0))
    mood = current_cond.get("mood", "mid")
    hrv = current_cond.get("hrv", "normal") # normal, low, high
    sleep_quality = current_cond.get("sleep", "ok") 

    # --- 1. Pattern Analysis (Failure Detection) ---
    failure_pattern_found = False
    failure_reason = ""
    
    if not df_logs.empty and 'pain' in df_logs.columns and 'date' in df_logs.columns:
        # Sort by date
        df_logs = df_logs.sort_values('date')
        
        # Identify "Failure Days" in history (Pain worsened >= 2 or Mood worsened)
        # Note: This requires pre-post activity data. 
        # Assuming 'logs' contains 'activity' type with potential 'pain_after' or separate 'condition' logs.
        # For simplicity based on current app.js structure: 
        # We might look for days where Pain was high AFTER activity.
        # However, app.js creates 'condition' logs and 'activity' logs separately.
        # We need to correlate them by day.
        
        # Simple heuristic for this implementation:
        # Check if there are recent days (last 7 days) where high pain (>=2) was recorded.
        recent_logs = df_logs[df_logs['date'] >= (pd.Timestamp.now() - pd.Timedelta(days=30))]
        
        # Filter for similar condition days (Fatigue +/- 1)
        similar_days = recent_logs[
            (recent_logs['type'] == 'condition') & 
            (recent_logs['fatigue'].between(fatigue - 1, fatigue + 1))
        ]
        
        # Check if those days had "bad outcomes" (e.g., Pain >= 2 recorded later that day? or Next day fatigue high?)
        # As specification says "Failure Pattern: Activity -> Pain worsened"
        # Since we might not have explicit "Pain After", we check if specific high pain logs exist on similar days.
        high_pain_days = similar_days[similar_days['pain'] >= 2]
        
        if not high_pain_days.empty:
            failure_pattern_found = True
            failure_reason = "過去に似た体調の日に痛みが強くなった記録があります。"

    # --- 2. Logic Tree ---

    # Priority 1: Warning Mode
    # Trigger 1: Failure Pattern
    if failure_pattern_found:
        return "Warning", f"失敗パターン検知: {failure_reason}"
    
    # Trigger 2: HRV Low (Sign of fatigue)
    if hrv == "low":
        return "Warning", "HRVデータが低下しており、疲労の蓄積が示唆されます。"
        
    # Trigger 3: High Pain
    if pain >= 2: # Assuming threshold is 2 based on "worsened >= 2" context or spec default. Spec says "threshold". Let's say 2 is warning.
        return "Warning", f"現在の痛みレベル({pain})が高い状態です。"


    # Priority 2: Challenge Mode
    # Trigger: All Good
    # Condition score calculation: Simple mapping or existing value.
    # Spec: "Constitution Score >= 80" -> Let's map (10-Fatigue)*10 approx? 
    # Or assume client sends a score. Let's infer from fatigue (0-10, lower is better usually, check app.js).
    # In app.js: fatigue 0-10. 
    # Let's assume Fatigue <= 2 is "Good" (Score ~80+ equivalent).
    
    is_condition_good = fatigue <= 2
    is_pain_low = pain <= 1
    is_recovery_ok = (sleep_quality in ["good", "ok"]) and (hrv in ["normal", "high"])
    
    if is_condition_good and is_pain_low and is_recovery_ok:
        return "Challenge", "体調・痛み・リカバリー状態がすべて良好です。"


    # Priority 3: Normal Mode
    return "Normal", "特筆すべきリスクや絶好調要因が見当たらないため、通常運転を推奨します。"


def generate_message(mode, reason, current_cond):
    """
    5. AI Prompt Engineering
    """
    from vertexai.generative_models import GenerativeModel, SafetySetting
    
    # Lazy init Vertex AI
    init_vertex()
    
    model = GenerativeModel("gemini-1.5-flash") # Use a fast model
    
    persona = """
    あなたは運動腫瘍学の専門知識を持ち、ユーザーの痛みと辛さに寄り添うパートナーです。
    無理強いはせず、データに基づいた客観的なアドバイスを行います。
    ユーザーはがんサバイバーであり、「動きたいけど痛みが怖い」あるいは「頑張りすぎてしまう」傾向があります。
    """
    
    context = f"""
    【ユーザー状態】
    - 疲労感: {current_cond.get('fatigue')} (0-10)
    - 痛み: {current_cond.get('pain')} (0-10)
    - 気分: {current_cond.get('mood')}
    - HRV(自律神経): {current_cond.get('hrv')}
    - 睡眠: {current_cond.get('sleep')}
    
    【システム判定】
    - 判定モード: {mode} (Warning / Challenge / Normal)
    - 判定根拠: {reason}
    
    【指示】
    モードに応じたメッセージを、100文字以内で作成してください。
    
    [Warningの場合]
    過去の失敗データや身体指標を引用し、「休むことが正解（良い判断）」だと肯定してください。罪悪感を持たせないように。
    「また明日頑張ればいい」「今日はチャージの日」といったニュアンスで。
    
    [Challengeの場合]
    データを根拠に、自信を持たせるよう鼓舞してください。「今日は体が動く日です」「貯金を作るチャンス」など。
    ただし、無茶はさせない一言を添えて。
    
    [Normalの場合]
    現状維持を褒めつつ、座りすぎないよう軽く促してください。
    """
    
    try:
        response = model.generate_content(
            [persona, context],
            generation_config={"max_output_tokens": 150, "temperature": 0.7}
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini generation error: {e}")
        # Fallback messages if AI fails
        if mode == "Warning": return "今日は体を休めることが最優先です。無理せずリラックスしましょう。"
        if mode == "Challenge": return "コンディションは良好です！少し負荷をかけた運動に挑戦してみましょう。"
        return "いつものペースで活動しましょう。座りすぎに注意して、適度に動いてください。"


@functions_framework.http
def send_notification_to_user(request):
    """
    HTTP Function to send push notification to a specific user via LINE Messaging API.
    Request Body: { "subjectId": "LINE_USER_ID", "message": "Notification Body" }
    """
    # CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {'Access-Control-Allow-Origin': '*'}

    # LINE Channel Access Token
    CHANNEL_ACCESS_TOKEN = "/DdFkNBp8X3Zj/+ta1eKv5NAKuTCunBmGg4T8qlu3JlrPfQvBGckKM4mX2ah4aEV7ESbB/r0D8TvWFXzvnKtilhCVFm/Jd9f4LihWx2NkH7E+92JtZa2KyuN4+C5pWn6VcIaluGxMXasf/6s7MYAegdB04t89/1O/w1cDnyilFU="

    try:
        req_json = request.get_json(silent=True)
        if not req_json:
            return (json.dumps({"error": "Invalid JSON"}), 400, headers)
            
        subject_id = req_json.get("subjectId")
        message_body = req_json.get("message")
        
        if not subject_id or not message_body:
            return (json.dumps({"error": "Missing subjectId or message"}), 400, headers)
            
        # Initialize LINE Messaging API
        configuration = Configuration(access_token=CHANNEL_ACCESS_TOKEN)
        api_client = ApiClient(configuration)
        line_bot_api = MessagingApi(api_client)
        
        # Send Push Message
        # We assume subject_id IS the LINE User ID.
        push_request = PushMessageRequest(
            to=subject_id,
            messages=[TextMessage(text=message_body)]
        )
        line_bot_api.push_message(push_request)
        
        return (json.dumps({"status": "success"}), 200, headers)

    except Exception as e:
        print(f"Notification Error: {e}")
        return (json.dumps({"error": str(e)}), 500, headers)
