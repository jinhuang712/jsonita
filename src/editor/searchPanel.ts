import {
  SearchQuery,
  closeSearchPanel,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceAll,
  replaceNext,
  selectMatches,
  setSearchQuery,
} from '@codemirror/search';
import { runScopeHandlers, type EditorView, type Panel, type ViewUpdate } from '@codemirror/view';
import i18n from '../i18n';

const MATCH_COUNT_LIMIT = 1000;

export function createJsonitaSearchPanel(view: EditorView): Panel {
  return new JsonitaSearchPanel(view);
}

class JsonitaSearchPanel implements Panel {
  readonly top = true;
  readonly dom: HTMLElement;

  private query: SearchQuery;
  private readonly searchField: HTMLInputElement;
  private readonly replaceField: HTMLInputElement;
  private readonly replaceRow: HTMLElement;
  private readonly countLabel: HTMLSpanElement;
  private readonly caseButton: HTMLButtonElement;
  private readonly regexpButton: HTMLButtonElement;
  private readonly wordButton: HTMLButtonElement;

  constructor(private readonly view: EditorView) {
    this.query = getSearchQuery(view.state);

    this.searchField = input(t('field.find'), 'jsonita-search-input');
    this.searchField.setAttribute('main-field', 'true');
    this.searchField.value = this.query.search;
    this.searchField.addEventListener('input', () => this.commit());

    this.replaceField = input(t('field.replace'), 'jsonita-search-input jsonita-search-replace-input');
    this.replaceField.value = this.query.replace;
    this.replaceField.addEventListener('input', () => this.commit());

    this.countLabel = elt('span', 'jsonita-search-count');

    this.caseButton = toggleButton('Aa', t('actions.matchCase'), () => this.toggle('caseSensitive'));
    this.regexpButton = toggleButton('.*', t('actions.regexp'), () => this.toggle('regexp'));
    this.wordButton = toggleButton(t('actions.wordChip'), t('actions.wholeWord'), () =>
      this.toggle('wholeWord'),
    );

    this.replaceRow = elt('div', 'jsonita-search-row jsonita-search-replace-row', [
      elt('span', 'jsonita-search-label', [t('label.replace')]),
      this.replaceField,
      iconButton(t('actions.replace'), t('actions.replaceCurrent'), () => replaceNext(this.view)),
      iconButton(t('actions.all'), t('actions.replaceAll'), () => replaceAll(this.view)),
    ]);

    this.dom = elt('div', 'jsonita-search-panel');
    this.dom.addEventListener('keydown', (event) => this.keydown(event));
    this.dom.append(
      elt('div', 'jsonita-search-row', [
        elt('span', 'jsonita-search-label', [t('label.find')]),
        this.searchField,
        this.countLabel,
        iconButton('↑', t('actions.previous'), () => findPrevious(this.view)),
        iconButton('↓', t('actions.next'), () => findNext(this.view)),
        this.caseButton,
        this.regexpButton,
        this.wordButton,
        iconButton(t('actions.all'), t('actions.selectAll'), () => selectMatches(this.view)),
        iconButton('×', t('actions.close'), () => closeSearchPanel(this.view), 'jsonita-search-close'),
      ]),
      this.replaceRow,
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
      replaceNext(this.view);
    }
  }

  private syncDom() {
    this.caseButton.classList.toggle('jsonita-search-toggle-active', this.query.caseSensitive);
    this.regexpButton.classList.toggle('jsonita-search-toggle-active', this.query.regexp);
    this.wordButton.classList.toggle('jsonita-search-toggle-active', this.query.wholeWord);
    this.caseButton.setAttribute('aria-pressed', String(this.query.caseSensitive));
    this.regexpButton.setAttribute('aria-pressed', String(this.query.regexp));
    this.wordButton.setAttribute('aria-pressed', String(this.query.wholeWord));
    this.countLabel.textContent = getMatchCountLabel(this.view, this.query);
    this.replaceRow.hidden = this.view.state.readOnly;
  }
}

function getMatchCountLabel(view: EditorView, query: SearchQuery): string {
  if (!query.valid) return t('status.noQuery');
  const matches: Array<{ from: number; to: number }> = [];
  const cursor = query.getCursor(view.state, 0, view.state.doc.length);
  let next = cursor.next();
  while (!next.done) {
    matches.push(next.value);
    if (matches.length > MATCH_COUNT_LIMIT) return `${MATCH_COUNT_LIMIT}+`;
    next = cursor.next();
  }
  if (matches.length === 0) return t('status.noMatches');

  const selectedIndex = matches.findIndex((match) =>
    view.state.selection.ranges.some(
      (range) => range.from === match.from && range.to === match.to,
    ),
  );
  const current = selectedIndex >= 0 ? selectedIndex + 1 : 1;
  return `${current} / ${matches.length}`;
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

function iconButton(
  text: string,
  label: string,
  onClick: () => void,
  extraClass = '',
): HTMLButtonElement {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = `jsonita-search-button ${extraClass}`.trim();
  node.textContent = text;
  node.title = label;
  node.setAttribute('aria-label', label);
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
