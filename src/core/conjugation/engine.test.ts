import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TENSES, acceptedForms, conjugate } from './engine.ts';
import type { Tense } from './engine.ts';
import { VERBS } from './verbs.ts';

const v = (inf: string) => {
  const verb = VERBS.find((x) => x.inf === inf);
  if (!verb) throw new Error(inf);
  return verb;
};
const forms = (inf: string, tense: Tense) => conjugate(v(inf), tense).join(' ');

test('présent régulier, -care, -giare, -iare, -isc', () => {
  assert.equal(forms('parlare', 'presente'), 'parlo parli parla parliamo parlate parlano');
  assert.equal(forms('cercare', 'presente'), 'cerco cerchi cerca cerchiamo cercate cercano');
  assert.equal(forms('mangiare', 'presente'), 'mangio mangi mangia mangiamo mangiate mangiano');
  assert.equal(forms('studiare', 'presente'), 'studio studi studia studiamo studiate studiano');
  assert.equal(forms('prendere', 'presente'), 'prendo prendi prende prendiamo prendete prendono');
  assert.equal(forms('dormire', 'presente'), 'dormo dormi dorme dormiamo dormite dormono');
  assert.equal(forms('capire', 'presente'), 'capisco capisci capisce capiamo capite capiscono');
});

test('futur et conditionnel', () => {
  assert.equal(forms('parlare', 'futuro'), 'parlerò parlerai parlerà parleremo parlerete parleranno');
  assert.equal(forms('mangiare', 'futuro'), 'mangerò mangerai mangerà mangeremo mangerete mangeranno');
  assert.equal(forms('cercare', 'futuro'), 'cercherò cercherai cercherà cercheremo cercherete cercheranno');
  assert.equal(forms('pagare', 'condizionale'), 'pagherei pagheresti pagherebbe pagheremmo paghereste pagherebbero');
  assert.equal(forms('studiare', 'futuro'), 'studierò studierai studierà studieremo studierete studieranno');
  assert.equal(forms('prendere', 'futuro'), 'prenderò prenderai prenderà prenderemo prenderete prenderanno');
  assert.equal(forms('andare', 'condizionale'), 'andrei andresti andrebbe andremmo andreste andrebbero');
  assert.equal(forms('essere', 'futuro'), 'sarò sarai sarà saremo sarete saranno');
});

test('imparfait', () => {
  assert.equal(forms('parlare', 'imperfetto'), 'parlavo parlavi parlava parlavamo parlavate parlavano');
  assert.equal(forms('fare', 'imperfetto'), 'facevo facevi faceva facevamo facevate facevano');
  assert.equal(forms('essere', 'imperfetto'), 'ero eri era eravamo eravate erano');
  assert.equal(forms('dire', 'imperfetto'), 'dicevo dicevi diceva dicevamo dicevate dicevano');
});

test('subjonctif présent', () => {
  assert.equal(forms('parlare', 'congiuntivo'), 'parli parli parli parliamo parliate parlino');
  assert.equal(forms('cercare', 'congiuntivo'), 'cerchi cerchi cerchi cerchiamo cerchiate cerchino');
  assert.equal(forms('mangiare', 'congiuntivo'), 'mangi mangi mangi mangiamo mangiate mangino');
  assert.equal(forms('prendere', 'congiuntivo'), 'prenda prenda prenda prendiamo prendiate prendano');
  assert.equal(forms('finire', 'congiuntivo'), 'finisca finisca finisca finiamo finiate finiscano');
});

test('passé composé avec avere et essere', () => {
  assert.equal(forms('parlare', 'passato'), 'ho parlato hai parlato ha parlato abbiamo parlato avete parlato hanno parlato');
  assert.equal(forms('andare', 'passato'), 'sono andato sei andato è andato siamo andati siete andati sono andati');
  assert.equal(conjugate(v('fare'), 'passato')[0], 'ho fatto');
  assert.equal(conjugate(v('dormire'), 'passato')[3], 'abbiamo dormito');
  assert.deepEqual(acceptedForms(v('partire'), 'passato', 1), ['sei partito', 'sei partita']);
  assert.deepEqual(acceptedForms(v('partire'), 'passato', 4), ['siete partiti', 'siete partite']);
});

test('chaque verbe a six formes non vides à chaque temps', () => {
  for (const verb of VERBS) {
    for (const tense of TENSES) {
      const six = conjugate(verb, tense);
      assert.equal(six.length, 6, `${verb.inf} ${tense}`);
      assert.ok(six.every((f) => f.trim().length > 0), `${verb.inf} ${tense}`);
    }
  }
  assert.equal(new Set(VERBS.map((x) => x.inf)).size, VERBS.length);
});
