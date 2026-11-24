export type Livestock = {
  id: string;
  name: string | null;
  species: string;
  sex: "J" | "B" | null;
  sire_id: string | null;
  dam_id: string | null;
};

export type LactationStage = "Early" | "Mid" | "Late";

export type HealthInput = {
  age_months: number;
  parity: number;
  lactation_stage: LactationStage;
  days_in_milk: number;
  body_condition_score: number;
  milk_yield_l: number;
  previous_week_avg_yield: number;
  vaccine_count: number;
};

export type RiskLevel = "Rendah" | "Sedang" | "Tinggi";

export type RiskResult = {
  livestock_id: string;
  risk_level: RiskLevel;
  confidence: number;
  prob_sakit: number;
  top_factors: { faktor: string; kontribusi: number }[];
  recommended_actions: string;
  is_estimate: boolean;
  disclaimer: string;
};

export type StoredRisk = RiskResult & { at: string };

export type InbreedingResult = {
  is_related: boolean;
  relation: string;
  common_ancestor_generations: number | null;
  kinship: number;
  message: string;
};

export type Mating = {
  id: string;
  sire_id: string;
  dam_id: string;
  date: string;
  related: boolean;
  relation: string;
  note: string;
};
