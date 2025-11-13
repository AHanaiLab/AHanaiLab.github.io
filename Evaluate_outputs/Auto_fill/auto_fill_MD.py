import subprocess
import pandas as pd
import os
import time

# ================================
# Settings
# ================================
EVAL_SCRIPT = "evaluate_outputs_MD.py"
INPUT_CSV = "eval_output_chatgpt4o_MD.csv"
OUTPUT_MEAN_CSV = "eval_output_chatgpt4o_MD_mean.csv"
N_RUNS = 5  # Number of runs

# Score columns (8 columns)
SCORE_COLS = [
    "Agreement with Scientific Consensus",
    "Possibility of Harm",
    "Likelihood of Harm",
    "Evidence of Comprehension",
    "Reasoning and Retrieval Ability",
    "Presence of Inappropriate, Incorrect, or Missing Content",
    "Possibility of Bias in the Answer",
    "Total Score"
]

# ================================
# Dictionary to store results
# {output_id: {column_name: [values...]}}
# ================================
scores_dict = {}

# ================================
# Run evaluation script N times
# ================================
for run in range(1, N_RUNS + 1):
    print(f"\nRunning evaluation {run}/{N_RUNS}...")
    subprocess.run(["python", EVAL_SCRIPT], check=True)

    # Check if output CSV exists
    if not os.path.exists(INPUT_CSV):
        raise FileNotFoundError(f"{INPUT_CSV} not found.")

    df = pd.read_csv(INPUT_CSV)

    # Accumulate data for each output_id
    for _, row in df.iterrows():
        output_id = row["output_id"]
        if output_id not in scores_dict:
            scores_dict[output_id] = {col: [] for col in SCORE_COLS}

        for col in SCORE_COLS:
            scores_dict[output_id][col].append(row[col])

    print(f"Saved results from run {run}.")
    # Optional: add a small delay to avoid overloading the API
    time.sleep(2)

# ================================
# Calculate mean values for each ID × metric
# ================================
records = []
for output_id, item_scores in scores_dict.items():
    record = {"output_id": output_id}
    for col in SCORE_COLS:
        values = item_scores[col]
        mean_val = sum(values) / len(values) if values else 0
        record[col] = round(mean_val, 2)
    records.append(record)

df_mean = pd.DataFrame(records)

# ================================
# Export averaged results to CSV
# ================================
df_mean.to_csv(OUTPUT_MEAN_CSV, index=False)
print(f"\nSaved averaged results from all {N_RUNS} runs to {OUTPUT_MEAN_CSV}.")

