import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

test('design prototype is the full-size frontend reference surface', () => {
  const html = read('design/prototype/index.html');

  assert.match(html, /data-prototype-sot="frontend-ui"/);
  assert.match(html, /Page Navigation/);
  assert.match(html, /State Matrix/);
  assert.match(html, /Hi-fi Prototype Canvas/);
  assert.match(html, /data-theme="light"/);
  assert.match(html, /data-theme="dark"/);
  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /--window-width:\s*860px/);
  assert.match(html, /--window-height:\s*560px/);
  assert.doesNotMatch(html, /transform:\s*scale\(/);
  assert.doesNotMatch(html, /zoom:\s*\d/);
});

test('design docs point agents to the prototype as UI source of truth', () => {
  const designReadme = read('design/README.md');
  const workflow = read('WORKFLOW.md');
  const readme = read('README.md');

  assert.match(designReadme, /design\/prototype\/index\.html/);
  assert.match(designReadme, /front-end UI source of truth/i);
  assert.match(workflow, /design\/prototype\/index\.html/);
  assert.match(workflow, /front-end UI/i);
  assert.match(readme, /design\/prototype\/index\.html/);
});
