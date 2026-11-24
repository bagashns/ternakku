// Uji logika Inbreeding Alert (sama dengan 5 kasus di notebook dan tes backend).  node ml/pedigree_test.mjs
import assert from "node:assert/strict";
import { inbreedingCheck } from "../supabase/functions/inbreeding-check/pedigree.ts";

const ped = {
  "SPI-001": [null, null], "SPI-002": [null, null], "SPI-005": [null, null], "SPI-030": [null, null], "SPI-031": [null, null], "SPI-060": [null, null],
  "SPI-003": ["SPI-001", "SPI-002"], "SPI-012": ["SPI-001", "SPI-005"], "SPI-020": ["SPI-030", "SPI-031"],
  "SPI-040": ["SPI-003", "SPI-020"], "SPI-041": ["SPI-003", "SPI-020"], "SPI-050": ["SPI-040", "SPI-060"],
};
const t = (s, d) => inbreedingCheck(s, d, ped);

let r = t("SPI-003", "SPI-012"); assert.deepEqual([r.is_related, r.relation, r.common_ancestor_generations, r.kinship], [true, "saudara tiri", 1, 0.125]);
r = t("SPI-040", "SPI-041"); assert.deepEqual([r.relation, r.kinship], ["saudara kandung", 0.25]);
r = t("SPI-001", "SPI-003"); assert.deepEqual([r.relation, r.kinship], ["orang tua dan anak", 0.25]);
r = t("SPI-050", "SPI-012"); assert.deepEqual([r.relation, r.common_ancestor_generations, r.kinship], ["kerabat (leluhur bersama 3 dan 1 generasi)", 3, 0.0313]);
r = t("SPI-020", "SPI-012"); assert.equal(r.is_related, false);
console.log("LOLOS: 5 kasus kekerabatan");
