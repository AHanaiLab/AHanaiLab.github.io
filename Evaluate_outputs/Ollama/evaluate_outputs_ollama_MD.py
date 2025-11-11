import pandas as pd
import requests
import time
from tqdm import tqdm

# ==== CONFIGURATION ====
INPUT_CSV = "../data/output.csv"
OUTPUT_CSV = "../outputs/outputs_of_evaluate_MD/output/gemma/ollama_eval_completed1.csv"
MODEL_NAME = "gemma:latest"  # 必要に応じて: llama3, mistral, medllama2 など
OLLAMA_URL = "http://localhost:11434/api/generate"
MAX_RETRIES = 2
TIMEOUT = 60  # seconds
# ======================== 

# 評価プロンプト（完全一致、一言一句変えない）
SYSTEM_PROMPT = """
You are a board-certified medical doctor experienced in critical care.
Evaluate the following output about Post-Intensive Care Syndrome (PICS)
on these 7 criteria. Each must be an integer 1–10.

Output text:
\"\"\"{output}\"\"\"

Respond **only** with 7 comma-separated numbers, nothing else.
Do NOT include labels, headers, explanations, notes, or extra text.
Do NOT include quotation marks or line breaks.
If you cannot evaluate, respond with: 0,0,0,0,0,0,0

Example of correct output:
8,6,7,9,8,7,8
You must always output exactly seven numbers separated by commas (no fewer, no more).
"""

HEADERS = [
    "Agreement with Scientific Consensus",
    "Possibility of Harm",
    "Likelihood of Harm",
    "Evidence of Comprehension",
    "Reasoning and Retrieval Ability",
    "Presence of Inappropriate, Incorrect, or Missing Content",
    "Possibility of Bias in the Answer"
]

def query_ollama(system_prompt, user_content):
    payload = {
        "model": MODEL_NAME,
        "system": system_prompt,
        "prompt": user_content,
        "stream": False
    }
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=TIMEOUT)
        if response.status_code == 200:
            return response.json().get("response", "")
        else:
            return None
    except Exception:
        return None

def parse_csv_scores(response_text):
    try:
        text = response_text.strip().replace('"', '').replace('\n', '').replace(" ", "")
        parts = [float(x) for x in text.split(",") if x.replace('.', '', 1).isdigit()]
        if len(parts) == 7:
            return parts
        else:
            return [0]*7
    except Exception:
        return [0]*7

def main():
    df = pd.read_csv(INPUT_CSV)
    results = []

    for i, row in tqdm(df.iterrows(), total=len(df)):
        content = row['output_text']
        scores = None

        # 最大2回リトライしてスコアが埋まらなければ0点
        for attempt in range(MAX_RETRIES + 1):
            response = query_ollama(SYSTEM_PROMPT, content)
            if response:
                scores = parse_csv_scores(response)
                if scores: break
            time.sleep(2)

        if not scores:
            print(f"⚠️ Row {i}: parse failed, filling zeros")
            print(f"⚠️ Row {i}: response = {response[:100]}")  # 最初の100文字だけ表示

            scores = [0] * len(HEADERS)

        results.append(scores)

    # 結果をデータフレームに追加
    for i, h in enumerate(HEADERS):
        df[h] = [row[i] for row in results]

    df["Total Score"] = df[HEADERS].sum(axis=1)

    try:
        df.to_csv(OUTPUT_CSV, index=False)
        print(f"✅ Done. Saved to {OUTPUT_CSV}")
    except Exception as e:
        print(f"❌ Failed to save CSV: {e}")

if __name__ == "__main__":
    main()