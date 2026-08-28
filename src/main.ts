import './styles.css';
import { correctReserve, createItem, finishOne, makeEvent, markBought, validateExport, type PantryExport, type PantryItem } from './domain';
import { createStore } from './storage';

const appNode = document.querySelector<HTMLDivElement>('#app');
if (!appNode) throw new Error('App container was not found.');
const app: HTMLDivElement = appNode;

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
const plural = (count: number, singular: string, pluralForm = `${singular}s`) => `${count} ${count === 1 ? singular : pluralForm}`;
const byName = (a: PantryItem, b: PantryItem) => a.name.localeCompare(b.name);

function legalPage(kind: 'privacy' | 'terms') {
  const isPrivacy = kind === 'privacy';
  app.innerHTML = `
    <header class="site-header compact"><a class="brand-link" href="/" aria-label="Finish One Pantry home"><span class="brand-mark" aria-hidden="true">✓</span><span>Finish One Pantry</span></a></header>
    <main id="main" class="legal-sheet">
      <p class="eyebrow">Notebook fine print · effective 27 August 2026</p>
      <h1>${isPrivacy ? 'Your pantry stays yours.' : 'A small, honest utility.'}</h1>
      ${isPrivacy ? `
        <p class="lede">Finish One Pantry stores your shelf, shopping list, and finish history in this browser. There is no account, cloud sync, advertising, analytics, or tracking.</p>
        <h2>What is stored</h2><p>Item names, approximate package counts, list thresholds, and a local history of finish, correction, and purchase events are saved in IndexedDB on your device.</p>
        <h2>Where it goes</h2><p>Nowhere unless you choose <strong>Export backup</strong>. That action downloads a JSON file directly to your device. Import reads only the file you select. We do not receive either file.</p>
        <h2>Your controls</h2><p>You can edit or delete an item, erase the entire notebook, or clear browser storage. Uninstalling the app may not remove browser data; use “Erase this notebook” first if that matters.</p>
        <h2>Network access</h2><p>The app checks its own files for updates and caches them for offline use. It loads no third-party scripts, fonts, pixels, or services.</p>` : `
        <p class="lede">Finish One Pantry is free software for keeping an approximate local replacement signal. It is not an exact inventory, safety, expiry, or purchasing system.</p>
        <h2>Use of the app</h2><p>You may use the app for personal or household purposes. You are responsible for checking what is actually in your pantry before relying on the list.</p>
        <h2>No warranty</h2><p>The software is provided “as is,” without warranties. Counts can be wrong if events are missed, local browser data can be cleared, and offline availability depends on a successful first load.</p>
        <h2>Ownership</h2><p>Your pantry data is yours. The source code is available under the MIT License. The original generated notebook illustration is disclosed in the app footer.</p>`}
      <p><a class="text-link" href="/">← Back to your pantry</a></p>
    </main>
    <footer class="site-footer"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><span>Local-first · no account</span></footer>`;
}

const path = window.location.pathname.replace(/\/+$/, '');
if (path === '/privacy' || path === '/terms') {
  legalPage(path.slice(1) as 'privacy' | 'terms');
} else {
  void startApp();
}

type View = 'shelf' | 'list' | 'more';

async function startApp() {
  const store = await createStore();
  let { items, events } = await store.load();
  let view: View = new URLSearchParams(location.search).get('view') === 'list' ? 'list' : 'shelf';
  let toastTimer = 0;

  const persistError = (error: unknown) => {
    console.error(error);
    showToast('That change could not be saved. Try again.', undefined, true);
  };

  function render() {
    const listCount = items.filter((item) => item.onList).length;
    const storageNote = store.persistent ? '' : `<div class="state-banner warning" role="alert"><strong>Temporary notebook:</strong> this browser blocked local storage. Keep this tab open or export after making changes.</div>`;
    app.innerHTML = `
      <header class="site-header">
        <div class="brand-block"><span class="brand-mark" aria-hidden="true">✓</span><div><p class="kicker">the cupboard notebook</p><h1>Finish One Pantry</h1></div></div>
        <p class="tagline">Finish a package now. Remember its replacement later.</p>
      </header>
      <div id="connection-state" class="state-banner offline" role="status" ${navigator.onLine ? 'hidden' : ''}><strong>Offline.</strong> Your notebook still works and saves on this device.</div>
      ${storageNote}
      <nav class="notebook-tabs" aria-label="Pantry sections">
        <button type="button" data-view="shelf" ${view === 'shelf' ? 'aria-current="page"' : ''}><span aria-hidden="true">▤</span> Shelf</button>
        <button type="button" data-view="list" ${view === 'list' ? 'aria-current="page"' : ''}><span aria-hidden="true">✓</span> List${listCount ? `<span class="count-badge" aria-label="${plural(listCount, 'item')} on list">${listCount}</span>` : ''}</button>
        <button type="button" data-view="more" ${view === 'more' ? 'aria-current="page"' : ''}><span aria-hidden="true">•••</span> Data & help</button>
      </nav>
      <main id="main" tabindex="-1">${view === 'shelf' ? renderShelf() : view === 'list' ? renderList() : renderMore()}</main>
      <footer class="site-footer"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><span>Local-first · no account</span><span>Original AI-generated illustration</span></footer>
      <div id="toast" class="toast" role="status" aria-live="polite" hidden></div>`;
    bindEvents();
  }

  function renderShelf() {
    if (!items.length) return `
      <section class="empty-layout" aria-labelledby="empty-title">
        <div class="empty-copy"><p class="eyebrow">A deliberately approximate pantry</p><h2 id="empty-title">Track the packages you finish on repeat.</h2><p>Pin milk, rice, detergent—or anything you buy again. One tap lowers the rough count and adds it to your list at the point you choose.</p><button class="primary-button" type="button" data-action="add">Add your first item <span aria-hidden="true">→</span></button><p class="quiet-note"><span aria-hidden="true">≈</span> Missed a tap? Correct the count whenever you notice. This is a reminder, not an audit.</p></div>
        <picture class="hero-picture"><source srcset="/images/notebook-pantry-640.avif 640w, /images/notebook-pantry-960.avif 960w" type="image/avif"><source srcset="/images/notebook-pantry-640.webp 640w, /images/notebook-pantry-960.webp 960w" type="image/webp"><img src="/images/notebook-pantry-960.jpg" width="960" height="640" fetchpriority="high" decoding="async" alt="Plain pantry packages and an empty carton arranged on a graph-paper notebook beside a pencilled checklist."></picture>
      </section>`;

    const recent = [...events].filter((event) => event.kind === 'finished').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
    return `
      <section class="shelf-heading"><div><p class="eyebrow">Pinned packages</p><h2>Your shelf</h2><p>Counts are rough by design. Tap the stamp when a package is finished.</p></div><button class="secondary-button" type="button" data-action="add"><span aria-hidden="true">＋</span> Add item</button></section>
      <ul class="pantry-list" aria-label="Pinned pantry packages">${[...items].sort(byName).map(renderItem).join('')}</ul>
      ${recent.length ? `<section class="recent-marks" aria-labelledby="recent-title"><h2 id="recent-title">Recent pencil marks</h2><ol>${recent.map((event) => `<li><span>${escapeHtml(event.itemName)}</span><time datetime="${event.at}">${formatRelative(event.at)}</time></li>`).join('')}</ol></section>` : ''}`;
  }

  function renderItem(item: PantryItem) {
    const status = item.onList ? '<span class="status-mark on-list">On the list</span>' : item.reserve <= item.threshold + 1 ? '<span class="status-mark soon">Nearly list time</span>' : '<span class="status-mark steady">Plenty noted</span>';
    return `<li class="pantry-row" data-item-id="${item.id}">
      <div class="item-identity"><div class="package-doodle" aria-hidden="true"><span></span></div><div><h3>${escapeHtml(item.name)}</h3>${status}<p>Add to list at ${plural(item.threshold, 'package')} left</p></div></div>
      <div class="reserve-control"><span class="reserve-label">about</span><strong aria-label="About ${plural(item.reserve, 'sealed package')} left">${item.reserve}</strong><span class="reserve-label">left</span><div class="correction-buttons" aria-label="Correct ${escapeHtml(item.name)} count"><button type="button" data-action="decrease" data-id="${item.id}" aria-label="Subtract one ${escapeHtml(item.name)} package" ${item.reserve === 0 ? 'disabled' : ''}>−</button><button type="button" data-action="increase" data-id="${item.id}" aria-label="Add one ${escapeHtml(item.name)} package">＋</button></div></div>
      <div class="row-actions"><button class="finish-button" type="button" data-action="finish" data-id="${item.id}" ${item.reserve === 0 ? 'disabled aria-describedby="zero-' + item.id + '"' : ''}><span class="stamp-icon" aria-hidden="true">✓</span>${item.reserve === 0 ? 'At zero' : 'Finish one'}</button><button class="edit-button" type="button" data-action="edit" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.name)}">Edit</button>${item.reserve === 0 ? `<span id="zero-${item.id}" class="sr-only">The count is already zero and this item is on the shopping list.</span>` : ''}</div>
    </li>`;
  }

  function renderList() {
    const listed = items.filter((item) => item.onList).sort(byName);
    if (!listed.length) return `<section class="list-empty"><div class="large-check" aria-hidden="true">✓</div><p class="eyebrow">Shopping list</p><h2>Nothing needs replacing.</h2><p>When a shelf count reaches its chosen line, the package will appear here automatically.</p><button class="secondary-button" type="button" data-view="shelf">Back to shelf</button></section>`;
    return `<section class="list-heading"><p class="eyebrow">Tear-off shopping note</p><h2>${plural(listed.length, 'replacement')}</h2><p>Mark an item bought, then note how many packages came home.</p></section><ul class="shopping-list">${listed.map((item) => `<li><button type="button" data-action="bought" data-id="${item.id}" aria-label="Mark ${escapeHtml(item.name)} as bought"><span class="open-check" aria-hidden="true"></span><span><strong>${escapeHtml(item.name)}</strong><small>about ${plural(item.reserve, 'package')} left now</small></span><span class="bought-label">Mark bought</span></button></li>`).join('')}</ul><p class="quiet-note list-note">One item appears only once, even if you finish another before shopping.</p>`;
  }

  function renderMore() {
    return `<section class="more-heading"><p class="eyebrow">Back pocket</p><h2>Data & help</h2><p>Your notebook lives only in this browser. Make a backup before changing devices or clearing site data.</p></section>
      <div class="utility-grid">
        <section><h3>Keep a copy</h3><p>Export every item and recent pencil mark as readable JSON.</p><button class="secondary-button" type="button" data-action="export" ${items.length ? '' : 'disabled'}>Export backup</button><button class="secondary-button" type="button" data-action="choose-import">Import backup</button><input hidden id="import-file" type="file" accept="application/json,.json"></section>
        <section><h3>How the signal works</h3><ol class="how-list"><li><span>1</span>Set a rough package count and the line where shopping should begin.</li><li><span>2</span>Tap <strong>Finish one</strong> when a package empties.</li><li><span>3</span>At the line, it appears once on your shopping list.</li></ol></section>
        <section><h3>Storage</h3><p>${store.persistent ? 'Saved locally in this browser and available offline after the first successful load.' : 'Local persistence is blocked. Changes last only while this page remains open.'}</p><p class="data-summary">${plural(items.length, 'item')} · ${plural(events.length, 'pencil mark')}</p>${items.length ? '<button class="danger-button" type="button" data-action="erase">Erase this notebook</button>' : ''}</section>
        <section><h3>What this does not do</h3><p>No expiry dates, barcode scanning, recipes, retailer data, accounts, or claims of exact inventory. That is the point.</p></section>
      </div>`;
  }

  function bindEvents() {
    app.querySelectorAll<HTMLElement>('[data-view]').forEach((control) => control.addEventListener('click', () => {
      view = control.dataset.view as View;
      history.replaceState(null, '', view === 'shelf' ? '/' : `/?view=${view}`);
      render();
      document.querySelector<HTMLElement>('#main')?.focus();
    }));
    app.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => button.addEventListener('click', () => void handleAction(button.dataset.action ?? '', button.dataset.id)));
    app.querySelector<HTMLInputElement>('#import-file')?.addEventListener('change', (event) => void importFile((event.currentTarget as HTMLInputElement).files?.[0]));
  }

  async function handleAction(action: string, id?: string) {
    const item = id ? items.find((value) => value.id === id) : undefined;
    try {
      if (action === 'add') return openItemDialog();
      if (action === 'edit' && item) return openItemDialog(item);
      if (action === 'finish' && item) return void await finish(item);
      if (action === 'increase' && item) return void await correct(item, 1);
      if (action === 'decrease' && item) return void await correct(item, -1);
      if (action === 'bought' && item) return openBoughtDialog(item);
      if (action === 'export') return exportData();
      if (action === 'choose-import') return app.querySelector<HTMLInputElement>('#import-file')?.click();
      if (action === 'erase') return confirmErase();
    } catch (error) { persistError(error); }
  }

  async function finish(item: PantryItem) {
    if (item.reserve === 0) return;
    const before = structuredClone(item);
    const updated = finishOne(item);
    const event = makeEvent(item, 'finished', -1);
    await Promise.all([store.saveItem(updated), store.addEvent(event)]);
    items = items.map((value) => value.id === item.id ? updated : value);
    events.push(event);
    render();
    const listMessage = !before.onList && updated.onList ? ' Added to the shopping list.' : '';
    showToast(`${item.name}: about ${updated.reserve} left.${listMessage}`, async () => {
      await Promise.all([store.saveItem(before), store.deleteEvent(event.id)]);
      items = items.map((value) => value.id === before.id ? before : value);
      events = events.filter((value) => value.id !== event.id);
      render();
      showToast(`Undid the ${item.name} finish mark.`);
    });
  }

  async function correct(item: PantryItem, delta: number) {
    const updated = correctReserve(item, delta);
    const event = makeEvent(item, 'corrected', delta);
    await Promise.all([store.saveItem(updated), store.addEvent(event)]);
    items = items.map((value) => value.id === item.id ? updated : value);
    events.push(event);
    render();
    showToast(`${item.name} corrected to about ${updated.reserve}.`);
  }

  function openItemDialog(item?: PantryItem) {
    const dialog = createDialog(`
      <form method="dialog" class="paper-form" id="item-form">
        <button class="dialog-close" value="cancel" aria-label="Close without saving">×</button>
        <p class="eyebrow">${item ? 'Adjust this note' : 'Pin a repeat package'}</p><h2>${item ? `Edit ${escapeHtml(item.name)}` : 'What do you finish often?'}</h2>
        <label for="item-name">Item name</label><input id="item-name" name="name" required maxlength="60" autocomplete="off" autofocus value="${item ? escapeHtml(item.name) : ''}" placeholder="e.g. Oat milk">
        <div class="number-fields"><div><label for="item-reserve">About how many are left?</label><input id="item-reserve" name="reserve" type="number" inputmode="numeric" min="0" max="99" required value="${item?.reserve ?? 2}"></div><div><label for="item-threshold">Add to list when this many are left</label><input id="item-threshold" name="threshold" type="number" inputmode="numeric" min="0" max="20" required value="${item?.threshold ?? 1}"></div></div>
        <p class="form-hint">Use a rough count. You can correct it from the shelf in one tap.</p><p id="form-error" class="form-error" role="alert"></p>
        <div class="dialog-actions">${item ? '<button type="button" class="danger-link" id="delete-item">Delete item</button>' : '<span></span>'}<button class="primary-button" value="save">${item ? 'Save changes' : 'Pin to shelf'}</button></div>
      </form>`);
    const form = dialog.querySelector<HTMLFormElement>('#item-form')!;
    dialog.querySelector<HTMLButtonElement>('#delete-item')?.addEventListener('click', () => { dialog.close(); dialog.remove(); confirmDelete(item!); });
    form.addEventListener('submit', async (event) => {
      const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
      if (submitter?.value !== 'save') return;
      event.preventDefault();
      const data = new FormData(form);
      try {
        const now = new Date().toISOString();
        const next = item ? { ...item, name: String(data.get('name')).trim().replace(/\s+/g, ' '), reserve: Number(data.get('reserve')), threshold: Number(data.get('threshold')), updatedAt: now } : createItem(String(data.get('name')), Number(data.get('reserve')), Number(data.get('threshold')));
        if (!next.name || next.name.length > 60 || !Number.isInteger(next.reserve) || next.reserve < 0 || next.reserve > 99 || !Number.isInteger(next.threshold) || next.threshold < 0 || next.threshold > 20) throw new Error('Check the name and use whole numbers in the shown ranges.');
        next.onList = next.onList || next.reserve <= next.threshold;
        await store.saveItem(next);
        items = [...items.filter((value) => value.id !== next.id), next];
        dialog.close(); dialog.remove(); render(); showToast(`${next.name} ${item ? 'updated' : 'pinned to the shelf'}.`);
      } catch (error) { dialog.querySelector<HTMLElement>('#form-error')!.textContent = error instanceof Error ? error.message : 'That item could not be saved.'; }
    });
  }

  function openBoughtDialog(item: PantryItem) {
    const dialog = createDialog(`<form method="dialog" class="paper-form" id="bought-form"><button class="dialog-close" value="cancel" aria-label="Close without saving">×</button><p class="eyebrow">Back from the shop</p><h2>How many ${escapeHtml(item.name)} packages came home?</h2><label for="bought-quantity">Packages bought</label><input id="bought-quantity" name="quantity" type="number" min="1" max="99" inputmode="numeric" value="1" required><p class="form-hint">We’ll add these to the rough count and take ${escapeHtml(item.name)} off the list.</p><p id="form-error" class="form-error" role="alert"></p><div class="dialog-actions"><button class="text-button" value="cancel">Not yet</button><button class="primary-button" value="save">Save as bought</button></div></form>`);
    const form = dialog.querySelector<HTMLFormElement>('#bought-form')!;
    form.addEventListener('submit', async (event) => {
      const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
      if (submitter?.value !== 'save') return;
      event.preventDefault();
      try {
        const quantity = Number(new FormData(form).get('quantity'));
        const updated = markBought(item, quantity);
        const log = makeEvent(item, 'bought', quantity);
        await Promise.all([store.saveItem(updated), store.addEvent(log)]);
        items = items.map((value) => value.id === item.id ? updated : value); events.push(log);
        dialog.close(); dialog.remove(); render(); showToast(`${item.name}: added ${plural(quantity, 'package')} and cleared from the list.`);
      } catch (error) { dialog.querySelector<HTMLElement>('#form-error')!.textContent = error instanceof Error ? error.message : 'That purchase could not be saved.'; }
    });
  }

  function confirmDelete(item: PantryItem) {
    const dialog = createDialog(`<form method="dialog" class="paper-form"><p class="eyebrow">Remove a pinned package</p><h2>Delete ${escapeHtml(item.name)}?</h2><p>This removes it from the shelf, list, and local history. This cannot be undone.</p><div class="dialog-actions"><button class="text-button" value="cancel">Keep item</button><button class="danger-button" value="delete">Delete ${escapeHtml(item.name)}</button></div></form>`);
    dialog.addEventListener('close', async () => { if (dialog.returnValue === 'delete') { await store.deleteItem(item.id); items = items.filter((value) => value.id !== item.id); events = events.filter((value) => value.itemId !== item.id); render(); showToast(`${item.name} deleted.`); } dialog.remove(); });
  }

  function confirmErase() {
    const dialog = createDialog(`<form method="dialog" class="paper-form"><p class="eyebrow">Permanent action</p><h2>Erase this whole notebook?</h2><p>All ${plural(items.length, 'item')} and ${plural(events.length, 'pencil mark')} will be deleted from this browser. Export first if you want a copy.</p><div class="dialog-actions"><button class="text-button" value="cancel">Keep notebook</button><button class="danger-button" value="erase">Erase everything</button></div></form>`);
    dialog.addEventListener('close', async () => { if (dialog.returnValue === 'erase') { await store.clear(); items = []; events = []; view = 'shelf'; render(); showToast('The local notebook was erased.'); } dialog.remove(); });
  }

  function createDialog(markup: string) {
    document.querySelector('dialog')?.remove();
    const dialog = document.createElement('dialog');
    dialog.innerHTML = markup;
    document.body.append(dialog);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close('cancel'); });
    dialog.addEventListener('close', () => { if (dialog.isConnected) dialog.remove(); }, { once: true });
    dialog.showModal();
    requestAnimationFrame(() => (dialog.querySelector<HTMLElement>('[autofocus]') ?? dialog.querySelector<HTMLElement>('input, button'))?.focus());
    return dialog;
  }

  function exportData() {
    const payload: PantryExport = { product: 'finish-one-pantry', version: 1, exportedAt: new Date().toISOString(), items, events };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `finish-one-pantry-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
    showToast('Backup downloaded. Keep it somewhere safe.');
  }

  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('That file is too large. Choose a Finish One Pantry JSON backup under 2 MB.');
      const data = validateExport(JSON.parse(await file.text()));
      const dialog = createDialog(`<form method="dialog" class="paper-form"><p class="eyebrow">Import checked</p><h2>Replace this notebook?</h2><p>The backup contains ${plural(data.items.length, 'item')} and ${plural(data.events.length, 'pencil mark')}. Importing replaces everything currently stored here.</p><div class="dialog-actions"><button class="text-button" value="cancel">Keep current data</button><button class="primary-button" value="import">Replace and import</button></div></form>`);
      dialog.addEventListener('close', async () => { if (dialog.returnValue === 'import') { await store.replace(data); items = data.items; events = data.events; view = 'shelf'; render(); showToast(`Imported ${plural(items.length, 'item')}.`); } dialog.remove(); });
    } catch (error) { showToast(error instanceof Error ? error.message : 'That backup could not be read.', undefined, true); }
  }

  function showToast(message: string, undo?: () => Promise<void>, error = false) {
    window.clearTimeout(toastTimer);
    const toast = app.querySelector<HTMLDivElement>('#toast');
    if (!toast) return;
    toast.className = `toast${error ? ' toast-error' : ''}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>${undo ? '<button type="button">Undo</button>' : ''}`;
    toast.hidden = false;
    toast.querySelector('button')?.addEventListener('click', () => void undo?.().catch(persistError));
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 8000);
  }

  function connectionChanged() {
    const banner = app.querySelector<HTMLElement>('#connection-state');
    if (banner) banner.hidden = navigator.onLine;
  }
  window.addEventListener('online', connectionChanged);
  window.addEventListener('offline', connectionChanged);
  render();
  registerServiceWorker(showToast);
}

function formatRelative(date: string) {
  const difference = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(difference / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(date));
}

function registerServiceWorker(notify: (message: string) => void) {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').then((registration) => {
    if (registration.waiting) showUpdate(registration);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(registration); });
    });
  }).catch(() => notify('Offline setup did not finish. Reconnect and reload to try again.'));
  let hadController = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !refreshing) { refreshing = true; location.reload(); }
    hadController = true;
  });
}

function showUpdate(registration: ServiceWorkerRegistration) {
  const toast = document.querySelector<HTMLDivElement>('#toast');
  if (!toast) return;
  toast.innerHTML = '<span>A fresh notebook version is ready.</span><button type="button">Update now</button>';
  toast.hidden = false;
  toast.querySelector('button')?.addEventListener('click', () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' }));
}
