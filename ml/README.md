# ml/

- `TernakKu_PoC_Risiko.ipynb`: pelatihan dan evaluasi (jalankan di Colab atau lokal; butuh file CSV Kaggle, tidak disertakan).
- `risk_model_logreg.joblib`, `risk_model_meta.json`: model hasil notebook (data sintetis).
- `export_model.py`: ekspor model ke TypeScript untuk Edge Function `risk-score`.
- `parity_test.mjs`, `pedigree_test.mjs`: uji kesamaan dengan Python dan uji logika kekerabatan (`npm run test:ml` dari akar repo).

Ambang level: Sedang 0,389 (recall 85%) dan Tinggi 0,631 (precision minimal 65%).
