import {
  SearchQuery,
  closeSearchPanel,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceAll,
  replaceNext,
  setSearchQuery,
} from '@codemirror/search';
import { runScopeHandlers, type EditorView, type Panel, type ViewUpdate } from '@codemirror/view';
import i18n from '../i18n';

const MATCH_COUNT_LIMIT = 1000;
const nonEmptyMatch = (match: string) => match.length > 0;

export function createJsonitaSearchPanel(view: EditorView): Panel {
  return new JsonitaSearchPanel(view);
}

class JsonitaSearchPanel implements Panel {
  readonly top = true;
  readonly dom: HTMLElement;

  private query: SearchQuery;
  private readonly searchField: HTMLInputElement;
  private readonly replaceField: HTMLInputElement;
  private readonly countLabel: HTMLSpanElement;
  private readonly navActions: HTMLSpanElement;
  private readonly previousButton: HTMLButtonElement;
  private readonly nextButton: HTMLButtonElement;
  private readonly caseButton: HTMLButtonElement;
  private readonly regexpButton: HTMLButtonElement;
  private readonly wordButton: HTMLButtonElement;
  private readonly replaceRegexpButton: HTMLButtonElement;
  private readonly replaceNextButton: HTMLButtonElement;
  private replaceRegexp = true;
  private readonly replaceAllButton: HTMLButtonElement;

  constructor(private readonly view: EditorView) {
    this.query = getSearchQuery(view.state);

    this.searchField = input(t('field.find'), 'jsonita-search-input');
    this.searchField.setAttribute('main-field', 'true');
    this.searchField.value = this.query.search;
    this.searchField.addEventListener('input', () => this.commit());

    this.replaceField = input(t('field.replace'), 'jsonita-search-input jsonita-search-replace-input');
    this.replaceField.setAttribute('data-role', 'replace-input');
    this.replaceField.value = this.query.replace;
    this.replaceField.addEventListener('input', () => this.commit());

    this.countLabel = elt('span', 'jsonita-search-count');
    this.previousButton = iconButton('↑', t('actions.previous'), () => findPrevious(this.view));
    this.nextButton = iconButton('↓', t('actions.next'), () => findNext(this.view));
    this.navActions = elt('span', 'jsonita-search-nav-actions', [
      this.previousButton,
      this.nextButton,
    ]);

    this.caseButton = toggleButton('Aa', t('actions.matchCase'), () => this.toggle('caseSensitive'));
    this.regexpButton = toggleButton('.*', t('actions.regexp'), () => this.toggle('regexp'));
    this.wordButton = toggleButton(t('actions.wordChip'), t('actions.wholeWord'), () =>
      this.toggle('wholeWord'),
    );
    this.replaceRegexpButton = iconButton('.*', t('actions.replaceRegexp'), () => {
      this.replaceRegexp = !this.replaceRegexp;
      this.syncDom();
    }, 'jsonita-search-replace-regexp');
    this.replaceRegexpButton.setAttribute('aria-pressed', 'true');
    this.replaceNextButton = iconButton(
      t('actions.replace'),
      t('actions.replaceNext'),
      () => this.replaceNext(),
      'jsonita-search-replace-action jsonita-search-replace-current',
      'replace-next',
    );
    this.replaceAllButton = iconButton(
      t('actions.all'),
      t('actions.replaceAll'),
      () => this.replaceAll(),
      'jsonita-search-replace-action jsonita-search-replace-all',
      'replace-all',
    );

    this.dom = elt('div', 'jsonita-search-panel');
    this.dom.addEventListener('keydown', (event) => this.keydown(event));
    this.dom.append(
      elt('div', 'jsonita-search-row', [
        elt('span', 'jsonita-search-label', [t('label.find')]),
        this.searchField,
      ]),
      elt('div', 'jsonita-search-row jsonita-search-replace-row', [
        elt('span', 'jsonita-search-label', [t('label.replace')]),
        this.replaceField,
      ]),
      elt('div', 'jsonita-search-row jsonita-search-toolbar-row', [
        this.countLabel,
        this.navActions,
        elt('span', 'jsonita-search-find-options', [
          this.caseButton,
          this.regexpButton,
          this.wordButton,
        ]),
        elt('span', 'jsonita-search-toolbar-spacer'),
        elt('span', 'jsonita-search-replace-actions', [
          this.replaceNextButton,
          this.replaceAllButton,
          this.replaceRegexpButton,
          iconButton('×', t('actions.close'), () => closeSearchPanel(this.view), 'jsonita-search-close'),
        ]),
      ]),
    );

    this.syncDom();
  }

  mount() {
    this.searchField.select();
  }

  update(update: ViewUpdate) {
    const nextQuery = getSearchQuery(update.state);
    const queryChanged = !nextQuery.eq(this.query);
    if (queryChanged) {
      this.query = nextQuery;
      this.searchField.value = nextQuery.search;
      this.replaceField.value = nextQuery.replace;
    }

    if (update.docChanged || update.selectionSet || update.viewportChanged || queryChanged) {
      this.syncDom();
    }
  }

  private commit() {
    const query = new SearchQuery({
      search: this.searchField.value,
      replace: this.replaceField.value,
      caseSensitive: this.query.caseSensitive,
      regexp: this.query.regexp,
      wholeWord: this.query.wholeWord,
      literal: this.query.literal,
      test: nonEmptyMatch,
    });
    if (!query.eq(this.query)) {
      this.query = query;
      this.view.dispatch({ effects: setSearchQuery.of(query) });
    }
    this.syncDom();
  }

  private toggle(key: 'caseSensitive' | 'regexp' | 'wholeWord') {
    const query = new SearchQuery({
      search: this.searchField.value,
      replace: this.replaceField.value,
      caseSensitive: key === 'caseSensitive' ? !this.query.caseSensitive : this.query.caseSensitive,
      regexp: key === 'regexp' ? !this.query.regexp : this.query.regexp,
      wholeWord: key === 'wholeWord' ? !this.query.wholeWord : this.query.wholeWord,
      literal: this.query.literal,
      test: nonEmptyMatch,
    });
    this.query = query;
    this.view.dispatch({ effects: setSearchQuery.of(query) });
    this.syncDom();
  }

  private keydown(event: KeyboardEvent) {
    if (runScopeHandlers(this.view, event, 'search-panel')) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter' && event.target === this.searchField) {
      event.preventDefault();
      (event.shiftKey ? findPrevious : findNext)(this.view);
      return;
    }

    if (event.key === 'Enter' && event.target === this.replaceField) {
      event.preventDefault();
      this.replaceNext();
      return;
    }
  }

  private replaceNext() {
    this.runReplaceCommand(() => replaceNext(this.view));
  }

  private replaceAll() {
    this.runReplaceCommand(() => replaceAll(this.view));
  }

  private runReplaceCommand(command: () => boolean) {
    if (this.replaceRegexp) {
      command();
      return;
    }

    const original = this.query;
    const literalQuery = new SearchQuery({
      search: original.search,
      replace: literalReplacementText(this.replaceField.value),
      caseSensitive: original.caseSensitive,
      regexp: original.regexp,
      wholeWord: original.wholeWord,
      literal: original.literal,
      test: nonEmptyMatch,
    });

    this.view.dispatch({ effects: setSearchQuery.of(literalQuery) });
    command();
    this.query = original;
    this.view.dispatch({ effects: setSearchQuery.of(original) });
    this.syncDom();
  }

  private syncDom() {
    this.caseButton.classList.toggle('jsonita-search-toggle-active', this.query.caseSensitive);
    this.regexpButton.classList.toggle('jsonita-search-toggle-active', this.query.regexp);
    this.replaceRegexpButton.classList.toggle('jsonita-search-toggle-active', this.replaceRegexp);
    this.wordButton.classList.toggle('jsonita-search-toggle-active', this.query.wholeWord);
    this.caseButton.setAttribute('aria-pressed', String(this.query.caseSensitive));
    this.regexpButton.setAttribute('aria-pressed', String(this.query.regexp));
    this.replaceRegexpButton.setAttribute('aria-pressed', String(this.replaceRegexp));
    this.wordButton.setAttribute('aria-pressed', String(this.query.wholeWord));

    const status = getMatchStatus(this.view, this.query);
    this.countLabel.textContent = status.label;
    this.countLabel.classList.toggle('jsonita-search-count-active', status.hasMatches);
    this.countLabel.classList.toggle('jsonita-search-count-error', status.isError);
    this.navActions.hidden = !status.hasMatches;
    this.replaceNextButton.disabled = !status.hasMatches;
    this.replaceAllButton.disabled = !status.hasMatches;
  }
}

function getMatchStatus(
  view: EditorView,
  query: SearchQuery,
): { label: string; hasMatches: boolean; isError: boolean } {
  if (!query.search) return { label: t('status.noQuery'), hasMatches: false, isError: false };
  if (!query.valid) return { label: t('status.invalidRegexp'), hasMatches: false, isError: true };

  const matches: Array<{ from: number; to: number }> = [];
  const cursor = query.getCursor(view.state, 0, view.state.doc.length);
  let next = cursor.next();
  while (!next.done) {
    if (next.value.from !== next.value.to) {
      matches.push(next.value);
      if (matches.length > MATCH_COUNT_LIMIT) {
        return { label: `${MATCH_COUNT_LIMIT}+`, hasMatches: true, isError: false };
      }
    }
    next = cursor.next();
  }
  if (matches.length === 0) return { label: t('status.noMatches'), hasMatches: false, isError: false };

  const selectedIndex = matches.findIndex((match) =>
    view.state.selection.ranges.some(
      (range) => range.from === match.from && range.to === match.to,
    ),
  );
  const current = selectedIndex >= 0 ? selectedIndex + 1 : 1;
  return { label: `${current} / ${matches.length}`, hasMatches: true, isError: false };
}

function t(key: string): string {
  return i18n.t(`panes:search.${key}`);
}

function input(placeholder: string, className: string): HTMLInputElement {
  const node = document.createElement('input');
  node.className = className;
  node.placeholder = placeholder;
  node.autocomplete = 'off';
  node.spellcheck = false;
  return node;
}

function literalReplacementText(value: string): string {
  return value.replace(/[\\$]/g, (match) => `${match}${match}`);
}

function iconButton(
  text: string,
  label: string,
  onClick: () => void,
  extraClass = '',
  role?: string,
): HTMLButtonElement {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = `jsonita-search-button ${extraClass}`.trim();
  node.textContent = text;
  node.title = label;
  node.setAttribute('aria-label', label);
  if (role) node.setAttribute('data-role', role);
  node.addEventListener('click', onClick);
  return node;
}

function toggleButton(
  text: string,
  label: string,
  onClick: () => void,
): HTMLButtonElement {
  const node = iconButton(text, label, onClick, 'jsonita-search-toggle');
  node.setAttribute('aria-pressed', 'false');
  return node;
}

function elt<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.append(...children);
  return node;
}
