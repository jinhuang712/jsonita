import {
  closeSearchPanel,
  openSearchPanel,
  searchKeymap as codeMirrorSearchKeymap,
  searchPanelOpen,
} from '@codemirror/search';
import type { KeyBinding } from '@codemirror/view';

export type SearchPanelToggleAction = 'open' | 'close';

export function searchPanelToggleAction(panelOpen: boolean): SearchPanelToggleAction {
  return panelOpen ? 'close' : 'open';
}

export function withoutDefaultSearchOpenBinding(bindings: readonly KeyBinding[]): KeyBinding[] {
  return bindings.filter((binding) => binding.key !== 'Mod-f');
}

export const toggleSearchPanel: KeyBinding['run'] = (view) => {
  return searchPanelToggleAction(searchPanelOpen(view.state)) === 'close'
    ? closeSearchPanel(view)
    : openSearchPanel(view);
};

export const jsonitaSearchKeymap: KeyBinding[] = [
  { key: 'Mod-f', run: toggleSearchPanel, scope: 'editor search-panel', preventDefault: true },
  ...withoutDefaultSearchOpenBinding(codeMirrorSearchKeymap),
];
