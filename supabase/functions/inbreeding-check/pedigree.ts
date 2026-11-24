// Inbreeding Alert (rule-based). Sama dengan backend/app/pedigree.py (prototipe FastAPI).
export type Ped = Record<string, [string | null, string | null]>;

export type InbreedingResult = {
  is_related: boolean;
  relation: string;
  common_ancestor_generations: number | null;
  kinship: number;
  message: string;
};

export const MAX_GEN = 4;

/** {leluhur: jumlah generasi di atas animal} */
export function ancestors(animal: string, ped: Ped, maxgen = MAX_GEN): Map<string, number> {
  const out = new Map<string, number>();
  const frontier: [string, number][] = [[animal, 0]];
  while (frontier.length) {
    const [x, g] = frontier.shift()!;
    if (g >= maxgen) continue;
    for (const parent of ped[x] ?? [null, null]) {
      if (parent && (!out.has(parent) || g + 1 < out.get(parent)!)) {
        out.set(parent, g + 1);
        frontier.push([parent, g + 1]);
      }
    }
  }
  return out;
}

export function inbreedingCheck(sire: string, dam: string, ped: Ped, maxgen = MAX_GEN): InbreedingResult {
  const A = new Map<string, number>([[sire, 0], ...ancestors(sire, ped, maxgen)]);
  const B = new Map<string, number>([[dam, 0], ...ancestors(dam, ped, maxgen)]);
  const common = [...A.keys()].filter((k) => B.has(k));
  if (common.length === 0) {
    return {
      is_related: false,
      relation: `tidak sekerabat (dalam ${maxgen} generasi)`,
      common_ancestor_generations: null,
      kinship: 0,
      message: "Tidak ditemukan hubungan kekerabatan dekat.",
    };
  }
  // hanya leluhur bersama terdekat yang dihitung, agar leluhur yang lewat leluhur bersama lain tidak dobel
  const anc = new Map(common.map((c) => [c, new Set(ancestors(c, ped, maxgen).keys())]));
  const direct = common.filter((c) => !common.some((o) => o !== c && anc.get(o)!.has(c)));
  const kin = direct.reduce((s, c) => s + 0.5 ** (A.get(c)! + B.get(c)! + 1), 0);
  const nearest = common.reduce((best, c) => (A.get(c)! + B.get(c)! < A.get(best)! + B.get(best)! ? c : best));
  const a = A.get(nearest)!;
  const b = B.get(nearest)!;
  const parentsInCommon = direct.filter((c) => A.get(c) === 1 && B.get(c) === 1).length;

  let relation: string;
  if ((a === 0 && b === 1) || (a === 1 && b === 0)) relation = "orang tua dan anak";
  else if (parentsInCommon >= 2) relation = "saudara kandung";
  else if (a === 1 && b === 1) relation = "saudara tiri";
  else relation = `kerabat (leluhur bersama ${a} dan ${b} generasi)`;

  return {
    is_related: true,
    relation,
    common_ancestor_generations: Math.max(a, b),
    kinship: Math.round(kin * 10000) / 10000,
    message: "Pejantan dan induk masih sekerabat.",
  };
}
