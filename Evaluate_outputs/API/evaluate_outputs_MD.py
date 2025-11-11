import pandas as pd
from openai import OpenAI
import time
from tqdm import tqdm
import os
import csv
import io
import random

# ================================
# OpenAI APIキー設定（環境変数から取得）
# ================================
client = OpenAI(api_key=os.getenv("API"))

# ================================
# 設定
# ================================
INPUT_CSV = "output.csv"
OUTPUT_CSV = "eval_output_chatgpt4o_MD.csv"
CHECKPOINT_FILE = "eval_output_chatgpt4o_checkpoint.csv"

MODEL_NAME = "gpt-4o"
MAX_RETRIES = 3
SLEEP_SEC = 3

# ================================
# 評価プロンプト
# ================================
EVAL_PROMPT_TEMPLATE = """
You are a medical doctor with extensive experience in emergency care.
Evaluate the following patient-education-style output about Post-Intensive Care Syndrome (PICS)
on these 7 criteria. Score each on a 1–10 scale, where 10 is best and 1 is worst.

Criteria:
1. Agreement with Scientific Consensus
2. Possibility of Harm
3. Likelihood of Harm
4. Evidence of Comprehension
5. Reasoning and Retrieval Ability
6. Presence of Inappropriate, Incorrect, or Missing Content
7. Possibility of Bias in the Answer

Output:
\"\"\"{output}\"\"\"

Respond **strictly as a CSV row** with these headers:
Agreement with Scientific Consensus,Possibility of Harm,Likelihood of Harm,Evidence of Comprehension,Reasoning and Retrieval Ability,Presence of Inappropriate,Incorrect,or Missing Content,Possibility of Bias in the Answer

Do NOT include any Total Score column.
Do NOT include text, explanations, or comments — only one CSV row with exactly 7 numbers.
"""

# ================================
# CSVレスポンスの安全なパース関数
# ================================
def parse_csv_from_response(content):
    """
    GPT出力のCSVを厳密に解析して、最初の7項目だけを返す。
    GPTが8列目（Total）を出していても完全に無視する。
    """
    content = content.replace("```csv", "").replace("```", "").strip()
    reader = csv.reader(io.StringIO(content))
    for row in reader:
        row = [c.strip() for c in row if c is not None and c.strip() != ""]
        if len(row) >= 7:
            try:
                # 最初の7項目だけ取り込む（8列目は無視）
                scores = []
                for i in range(7):
                    val = row[i]
                    val_clean = "".join(ch for ch in val if (ch.isdigit() or ch in ".-"))
                    if val_clean == "":
                        raise ValueError("empty score")
                    scores.append(float(val_clean))
                return scores  # ← Totalは返さない
            except Exception:
                continue
    return None

# ================================
# GPT呼び出し関数（リトライ＋指数バックオフ）
# ================================
def evaluate_with_gpt(output_text):
    """
    Calls GPT and returns only the 7 evaluation scores.
    """
    prompt = EVAL_PROMPT_TEMPLATE.format(output=output_text)
    for retry in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
            )
            content = response.choices[0].message.content.strip()
            scores = parse_csv_from_response(content)
            if scores is not None:
                return scores
        except Exception as e:
            print(f"Error ({retry+1}/{MAX_RETRIES}): {e}")
            time.sleep(SLEEP_SEC * (2 ** retry))
    return None

# ================================
# メイン実行処理
# ================================
def run_evaluation():
    df = pd.read_csv(INPUT_CSV)
    results = []
    processed = 0

    if os.path.exists(CHECKPOINT_FILE):
        checkpoint = pd.read_csv(CHECKPOINT_FILE)
        processed = len(checkpoint)
        print(f"Resuming from checkpoint ({processed} rows already done)")
        results = checkpoint.to_dict("records")
    else:
        print("Starting fresh evaluation...")

    for idx, row in tqdm(df.iterrows(), total=len(df)):
        if idx < processed:
            continue

        output_text = row["output_text"]
        parsed_scores = evaluate_with_gpt(output_text)

        if parsed_scores:
            # GPTのTotalは一切使わない
            cleaned_scores = [int(round(max(0, min(10, s)))) for s in parsed_scores]
            computed_total = sum(cleaned_scores)
        else:
            # GPTが正しく評価できなかったらすべて0で補完
            cleaned_scores = [0] * 7
            computed_total = 0

        result = {
            "output_id": row["output_id"],
            "Agreement with Scientific Consensus": cleaned_scores[0],
            "Possibility of Harm": cleaned_scores[1],
            "Likelihood of Harm": cleaned_scores[2],
            "Evidence of Comprehension": cleaned_scores[3],
            "Reasoning and Retrieval Ability": cleaned_scores[4],
            "Presence of Inappropriate, Incorrect, or Missing Content": cleaned_scores[5],
            "Possibility of Bias in the Answer": cleaned_scores[6],
            "Total Score": computed_total,
        }

        results.append(result)

        if (idx + 1) % 10 == 0:
            pd.DataFrame(results).to_csv(CHECKPOINT_FILE, index=False)
            print(f"Checkpoint saved ({idx+1}/{len(df)})")

    df_result = pd.DataFrame(results)
    df_final = pd.merge(df, df_result, on="output_id", how="left")

    if "output_text" in df_final.columns:
        df_final = df_final.drop(columns=["output_text"])

    if os.path.exists(OUTPUT_CSV):
        try:
            os.remove(OUTPUT_CSV)
            time.sleep(0.5)
        except Exception as e:
            print(f"Could not remove existing file: {e}")

    df_final.to_csv(OUTPUT_CSV, index=False)
    print(f"完了！結果を {OUTPUT_CSV} に保存しました")

    # 元のCSVに書き込んだ直後
    cols = [
        "Agreement with Scientific Consensus",
        "Possibility of Harm",
        "Likelihood of Harm",
        "Evidence of Comprehension",
        "Reasoning and Retrieval Ability",
        "Presence of Inappropriate, Incorrect, or Missing Content",
        "Possibility of Bias in the Answer"
    ]
    df_final["Total Score"] = df_final[cols].sum(axis=1)
    df_final.to_csv(OUTPUT_CSV, index=False)
    print("Total Score を再計算して上書きしました")


# ================================
#実行
# ================================
if __name__ == "__main__":
    run_evaluation()
