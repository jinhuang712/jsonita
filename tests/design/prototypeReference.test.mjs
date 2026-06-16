import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

function styleBlock(html) {
  const match = html.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(match, 'expected an inline style block');
  return match[1];
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

test('prototype opens to a polished default branch with centered actual-size canvas', () => {
  const html = read('design/prototype/index.html');

  assert.match(html, /class="prototype-inspector"/);
  assert.match(html, /class="canvas-stage"/);
  assert.match(html, /<details class="sidebar-section" data-advanced>/);
  assert.match(html, /justify-content:\s*center/);
  assert.match(html, /align-items:\s*flex-start/);
  assert.match(html, /page:\s*'main'/);
  assert.match(html, /chrome:\s*'idle'/);
  assert.match(html, /pane:\s*'dual'/);
  assert.match(html, /input:\s*'valid'/);
  assert.match(html, /tab:\s*'format'/);
  assert.match(html, /Reset View/);
  assert.match(html, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(html, /gear: '<svg/);
  assert.match(html, /format: '<svg/);
  assert.doesNotMatch(html, /id="state-key"/);
  assert.doesNotMatch(html, /Object\.entries\(state\)\.map/);
  assert.doesNotMatch(html, />⚙</);
});

test('prototype style block has balanced CSS braces', () => {
  const css = styleBlock(read('design/prototype/index.html'));
  let depth = 0;

  for (const char of css) {
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    assert.ok(depth >= 0, 'CSS closed more braces than it opened');
  }

  assert.equal(depth, 0, 'CSS has unclosed braces');
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
