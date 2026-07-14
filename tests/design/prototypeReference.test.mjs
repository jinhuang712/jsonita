import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

test('design prototype is a low-fidelity interaction-flow companion', () => {
  const html = read('design/prototype/index.html');

  assert.match(html, /data-prototype="low-fidelity-flow"/);
  assert.match(html, /Low fidelity/);
  assert.match(html, /data-page="editor"/);
  assert.match(html, /data-page="settings"/);
  assert.match(html, /data-page="history"/);
  assert.match(html, /data-page="ai-fix"/);
  assert.match(html, /const showPage/);
  assert.doesNotMatch(html, /Hi-fi Prototype Canvas/);
  assert.doesNotMatch(html, /data-prototype-sot="frontend-ui"/);
});

test('prototype starts at the editor and offers the main decision paths', () => {
  const html = read('design/prototype/index.html');

  assert.match(html, /showPage\('editor'\)/);
  assert.match(html, /preview never replaces input/);
  assert.match(html, /only Accept replaces editor input/);
  assert.match(html, /data-page-button="settings"/);
  assert.match(html, /data-page-button="history"/);
});

test('design docs describe the prototype as a companion, not visual authority', () => {
  const designReadme = read('design/README.md');
  const workflow = read('WORKFLOW.md');
  const readme = read('README.md');

  assert.match(designReadme, /design\/prototype\/index\.html/);
  assert.match(designReadme, /low fidelity/i);
  assert.match(designReadme, /not a full-size canvas or a pixel-level source of truth/i);
  assert.match(workflow, /design\/prototype\/index\.html/);
  assert.match(workflow, /低保真流程/);
  assert.match(readme, /design\/prototype\/index\.html/);
  assert.match(readme, /低保真/);
});
