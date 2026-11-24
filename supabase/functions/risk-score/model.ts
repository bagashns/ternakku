// DIHASILKAN oleh ml/export_model.py. Jangan diedit manual.
// Model dilatih pada data sintetis Kaggle; bukan bukti performa lapangan.
export const MODEL = {
  "version": "logreg-v1-kaggle-synthetic-250k",
  "numeric": [
    {
      "name": "Age_Months",
      "mean": 83.4908284714119,
      "scale": 34.64382734859573
    },
    {
      "name": "Parity",
      "mean": 3.5001166861143522,
      "scale": 1.7058810015312276
    },
    {
      "name": "Days_in_Milk",
      "mean": 182.50969161526922,
      "scale": 105.04486369318413
    },
    {
      "name": "Body_Condition_Score",
      "mean": 3.3949424904150693,
      "scale": 0.6330889032775
    },
    {
      "name": "Milk_Yield_L",
      "mean": 8.708413668944825,
      "scale": 5.76072647694978
    },
    {
      "name": "Previous_Week_Avg_Yield",
      "mean": 8.741353758959827,
      "scale": 5.903351259156979
    },
    {
      "name": "yield_drop_ratio",
      "mean": -0.04834462236237655,
      "scale": 0.34712873020861823
    },
    {
      "name": "vaccine_count",
      "mean": 4.796219369894983,
      "scale": 1.3833917273607252
    },
    {
      "name": "Feed_Quantity_kg",
      "mean": 12.024064010668445,
      "scale": 3.9673102237710864
    },
    {
      "name": "Water_Intake_L",
      "mean": 65.0633852308718,
      "scale": 19.711570205899857
    },
    {
      "name": "Housing_Score",
      "mean": 0.6494776462743791,
      "scale": 0.20223707828033444
    }
  ],
  "categorical": [
    {
      "name": "Lactation_Stage",
      "categories": [
        "Early",
        "Late",
        "Mid"
      ]
    },
    {
      "name": "Season",
      "categories": [
        "Autumn",
        "Monsoon",
        "Spring",
        "Summer",
        "Winter"
      ]
    },
    {
      "name": "Management_System",
      "categories": [
        "Extensive",
        "Intensive",
        "Mixed",
        "Pastoral",
        "Semi_Intensive"
      ]
    }
  ],
  "coef": [
    -0.004681064529824667,
    0.0009952147748339944,
    -0.10532233951960833,
    -1.5283007969720386e-05,
    -0.7141775585834768,
    -0.12728241730982615,
    0.049813613198600226,
    -0.008493119023764251,
    0.032500766327828216,
    -0.006550568081630195,
    0.08194522722687721,
    0.153235668385309,
    -0.2121213957239171,
    0.02802722049239125,
    -0.009845301771516327,
    -0.02209527702970956,
    0.005717373421255523,
    -0.000201592329545484,
    -0.004433709136700979,
    -0.0028115006684797305,
    -0.013112743198392797,
    -0.009459744224687072,
    -0.008213819704073396,
    0.0027393009494152388
  ],
  "intercept": -0.030947510976597307,
  "thresholds": {
    "sedang": 0.3891175302997054,
    "tinggi": 0.63050952269564
  }
} as const;
