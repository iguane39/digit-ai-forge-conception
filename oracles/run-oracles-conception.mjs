#!/usr/bin/env node
// run-oracles-conception — point d'entrée unique des oracles de la Forge Conception
// (D-C1 du contrat d'interface pilot, soldée le 14/08 : « pas de manifeste ni runner »).
//
// Un seul chemin à connaître pour le pilot et les runs, au lieu de huit. Lance chaque
// oracle du dossier sur le référentiel fourni, agrège les verdicts, et DÉCLARE ceux qui
// n'ont pas pu juger (exit 2 : mauvais type de référentiel, argument manquant) — jamais
// PASS par défaut, jamais de silence (modèle : run-oracles-design.mjs de forge-design).
//
// Contrat : JSON sur stdout — { runner, cible, verdict, oracles: [{oracle, verdict,
// exit, resume}], non_juge } ; exit 0 = tous PASS, 1 = au moins un FAIL,
// 2 = aucun oracle n'a pu juger.
// Usage :
//   node run-oracles-conception.mjs <EXIGENCES.json> [--json-only]
//   node run-oracles-conception.mjs <EXIGENCES.json> --seulement exigences,ears
// Le manifeste des verbes (skills → oracles) : oracles\manifeste.json.

import { readdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ICI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const cible = args.find((a) => !a.startsWith("--"));
const jsonOnly = args.includes("--json-only");
const seulement = (args.find((a) => a.startsWith("--seulement")) || "")
  .split("=")[1]?.split(",").map((s) => s.trim()).filter(Boolean);

if (!cible) {
  console.log(JSON.stringify({ runner: "run-oracles-conception", verdict: "ERREUR",
    message: "usage : node run-oracles-conception.mjs <EXIGENCES.json> [--json-only] [--seulement=a,b]" }));
  process.exit(2);
}

const oracles = readdirSync(ICI)
  .filter((f) => /^oracle-[\w-]+\.mjs$/.test(f))
  .filter((f) => !seulement || seulement.some((s) => f.includes(s)))
  .sort();

const resultats = [];
let unFail = false;
let unPass = false;
for (const oracle of oracles) {
  const r = spawnSync(process.execPath, [join(ICI, oracle), cible], { encoding: "utf8" });
  let corps = null;
  try { corps = JSON.parse(r.stdout); } catch { /* sortie non-JSON : déclarée telle quelle */ }
  const verdict = r.status === 0 ? "PASS" : r.status === 1 ? "FAIL" : "NON_JUGE";
  if (verdict === "FAIL") unFail = true;
  if (verdict === "PASS") unPass = true;
  resultats.push({
    oracle: basename(oracle, ".mjs"),
    verdict,
    exit: r.status,
    // NON_JUGE n'est pas un échec : l'oracle dit pourquoi il n'a pas pu juger (référentiel
    // d'un autre verbe, argument propre manquant) — le déclarer vaut mieux que le taire.
    resume: (() => {
      if (verdict === "PASS") return "aucune règle en échec";
      const fautes = (corps?.findings || corps?.constats || []).filter(
        (f) => f.statut === "FAIL" || f.sev === "bloquant" || f.severite === "bloquant"
      );
      if (fautes.length) {
        return fautes.slice(0, 3).map((f) => f.message || f.msg || f.regle).join(" · ")
          + (fautes.length > 3 ? ` (+${fautes.length - 3})` : "");
      }
      return corps?.message || corps?.verdict
        || (r.stderr || r.stdout || "").trim().slice(0, 160);
    })(),
  });
}

const verdict = unFail ? "FAIL" : unPass ? "PASS" : "NON_JUGE";
const rapport = {
  runner: "run-oracles-conception",
  version: "1.0.0",
  cible,
  verdict,
  oracles: resultats,
  non_juge: [
    "un oracle en NON_JUGE (exit 2) n'a pas pu juger cette cible — son motif est déclaré, il ne compte ni PASS ni FAIL",
    "la pertinence métier des exigences (revue humaine, 4 verbes de la méthode)",
  ],
};
console.log(JSON.stringify(rapport, null, jsonOnly ? 0 : 1));
process.exit(unFail ? 1 : unPass ? 0 : 2);
