"""Ekspor model Logistic Regression (risk_model_logreg.joblib) menjadi TypeScript untuk Supabase Edge Function.

Jalankan dari folder ml/:  python export_model.py
Hasil: ../supabase/functions/risk-score/model.ts  dan  parity_cases.json (kasus uji perbandingan dengan Python).
"""
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
pipe = joblib.load(HERE / "risk_model_logreg.joblib")
meta = json.loads((HERE / "risk_model_meta.json").read_text())
pre, clf = pipe.named_steps["pre"], pipe.named_steps["clf"]

scaler = pre.named_transformers_["num"]
encoder = pre.named_transformers_["cat"]
num_names = list(meta["features_num"])
cat_names = list(meta["features_cat"])

model = {
    "version": "logreg-v1-kaggle-synthetic-250k",
    "numeric": [{"name": n, "mean": float(m), "scale": float(s)} for n, m, s in zip(num_names, scaler.mean_, scaler.scale_)],
    "categorical": [{"name": n, "categories": [str(c) for c in cats]} for n, cats in zip(cat_names, encoder.categories_)],
    "coef": [float(c) for c in clf.coef_[0]],
    "intercept": float(clf.intercept_[0]),
    "thresholds": {"sedang": float(meta["threshold_mid"]), "tinggi": float(meta["threshold_high_logreg"])},
}
assert len(model["coef"]) == len(num_names) + sum(len(c["categories"]) for c in model["categorical"])

out = HERE.parent / "supabase" / "functions" / "risk-score" / "model.ts"
out.write_text(
    "// DIHASILKAN oleh ml/export_model.py. Jangan diedit manual.\n"
    "// Model dilatih pada data sintetis Kaggle; bukan bukti performa lapangan.\n"
    "export const MODEL = " + json.dumps(model, indent=2) + " as const;\n",
    encoding="utf8",
)

# kasus uji: bandingkan keluaran Python dengan implementasi TypeScript
rng = np.random.default_rng(7)
cases = []
for _ in range(25):
    row = {
        "Age_Months": float(rng.integers(24, 144)), "Parity": int(rng.integers(1, 7)),
        "Days_in_Milk": int(rng.integers(1, 365)), "Body_Condition_Score": float(rng.choice([2, 2.5, 3, 3.5, 4])),
        "Milk_Yield_L": float(np.round(rng.uniform(0, 30), 2)), "Previous_Week_Avg_Yield": float(np.round(rng.uniform(0, 30), 2)),
        "vaccine_count": int(rng.integers(0, 9)), "Feed_Quantity_kg": float(np.round(rng.uniform(3, 25), 1)),
        "Water_Intake_L": float(np.round(rng.uniform(20, 120), 1)), "Housing_Score": float(np.round(rng.uniform(0.3, 1), 2)),
        "Lactation_Stage": str(rng.choice(["Early", "Mid", "Late"])), "Season": str(rng.choice(["Autumn", "Monsoon", "Spring", "Summer", "Winter"])),
        "Management_System": str(rng.choice(["Extensive", "Intensive", "Mixed", "Pastoral", "Semi_Intensive"])),
    }
    prev = max(row["Previous_Week_Avg_Yield"], 0.1)
    row["yield_drop_ratio"] = float(np.clip((row["Previous_Week_Avg_Yield"] - row["Milk_Yield_L"]) / prev, -1, 1))
    X = pd.DataFrame([row])[num_names + cat_names]
    p = float(pipe.predict_proba(X)[0, 1])
    cases.append({"input": row, "prob": p})
(HERE / "parity_cases.json").write_text(json.dumps(cases, indent=1), encoding="utf8")
print("OK", out, len(cases), "kasus")
