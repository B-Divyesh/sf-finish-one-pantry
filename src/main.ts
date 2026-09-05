import './styles.css';
import { correctReserve, createItem, finishOne, makeEvent, markBought, validateExport, type PantryExport, type PantryItem } from './domain';
import { createSamplePantry } from './sample';
import { createStore } from './storage';

const appNode = document.querySelector<HTMLDivElement>('#app');
if (!appNode) throw new Error('App container was not found.');
const app: HTMLDivElement = appNode;
const productName = 'Finish One Pantry';
const baseTitle = 'Finish One Pantry — track pantry replacements';

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
const plural = (count: number, singular: string, pluralForm = `${singular}s`) => `${count} ${count === 1 ? singular : pluralForm}`;
const byName = (a: PantryItem, b: PantryItem) => a.name.localeCompare(b.name);
const routePath = window.location.pathname.replace(/\/+$/, '') || '/';
const demoQuery = new URLSearchParams(window.location.search).get('demo') === '1';

function siteHeader() {
  return `<header class="site-header product-header">
    <a class="brand-link" href="/" aria-label="Finish One Pantry home"><span class="brand-mark" aria-hidden="true">✓</span><span>${productName}</span></a>
    <nav class="site-nav" aria-label="Site"><a href="/demo/">Demo</a><a href="/?view=list">Shopping list</a><a href="/privacy/">Privacy</a></nav>
  </header>`;
}

function siteFooter() {
  return `<footer class="site-footer"><span>Local pantry replacement list</span><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><span>Built by Param Factory</span><span>v1.1.0</span></footer>`;
}

function legalPage(kind: 'privacy' | 'terms') {
  const isPrivacy = kind === 'privacy';
  document.title = `${isPrivacy ? 'Privacy' : 'Terms'} — ${productName}`;
  app.innerHTML = `${siteHeader()}
    <main id="main" class="legal-sheet" tabindex="-1">
      <p class="eyebrow">Effective 5 September 2026</p>
      <h1>${isPrivacy ? 'Privacy' : 'Terms'}</h1>
      ${isPrivacy ? `
        <p class="lede">Finish One Pantry keeps your pantry data in this browser. It has no account and sends no pantry records to a server.</p>
        <h2>Data stored in this browser</h2><p>Item names, rough package counts, list thresholds, and finish, correction, and purchase events are stored in this browser’s IndexedDB.</p>
        <h2>Backups you choose</h2><p>Export creates a JSON file on your device. Import reads only the file you select. We do not receive either file.</p>
        <h2>Your controls</h2><p>You can edit or delete an item, erase the notebook, or clear browser storage. Export a backup before clearing browser data or changing devices.</p>
        <h2>Network requests</h2><p>The app fetches its own files to load and update. It does not load third-party scripts, fonts, analytics, or advertising.</p>` : `
        <p class="lede">Finish One Pantry is a local tool for a rough replacement signal. It is not exact inventory, an expiry tracker, or a purchasing system.</p>
        <h2>Using the app</h2><p>Use it for personal or household pantry notes. Check your actual pantry before relying on the shopping list.</p>
        <h2>No warranty</h2><p>The software is provided as is. Counts can be wrong when finish events are missed, and offline use requires one successful visit first.</p>
        <h2>Ownership</h2><p>Your pantry data is yours. The source code is available under the MIT License. The notebook illustration is original generated artwork for this product.</p>`}
      <p><a class="text-link" href="/">Back to pantry</a></p>
    </main>${siteFooter()}`;
}

function notFoundPage() {
  document.title = `Page not found — ${productName}`;
  app.innerHTML = `${siteHeader()}<main id="main" class="legal-sheet not-found" tabindex="-1"><p class="eyebrow">404</p><h1>Page not found</h1><p class="lede">That address does not point to a pantry page.</p><p><a class="primary-button" href="/">Open your pantry</a></p></main>${siteFooter()}`;
}

if (routePath === '/privacy' || routePath === '/terms') {
  legalPage(routePath.slice(1) as 'privacy' | 'terms');
} else if (routePath !== '/' && routePath !== '/demo') {
  notFoundPage();
} else {
  void startApp(routePath === '/demo' || demoQuery);
}

type View = 'shelf' | 'list' | 'more';

async function startApp(isDemo: boolean) {
  const store = await createStore(isDemo ? 'demo:finish-one-pantry' : 'finish-one-pantry');
  let { items, events } = await store.load();
  if (isDemo && items.length === 0 && events.length === 0) {
    const sample = createSamplePantry();
    await store.replace({ product: 'finish-one-pantry', version: 1, exportedAt: new Date().toISOString(), ...sample });
    ({ items, events } = await store.load());
  }
  let view: View = new URLSearchParams(location.search).get('view') === 'list' ? 'list' : new URLSearchParams(location.search).get('view') === 'more' ? 'more' : 'shelf';
  let toastTimer = 0;

  function titleForView() {
    if (isDemo) return `Demo — ${productName}`;
    if (view === 'list') return `Shopping list — ${productName}`;
    if (view === 'more') return `Data and help — ${productName}`;
    return baseTitle;
  }

  function headingForView() {
    if (view === 'list') return 'Shopping list';
    if (view === 'more') return 'Data and help';
    return 'Track finished packages for your shopping list';
  }

  function persistError() {
    showToast('That change could not be saved. Try again.', undefined, true);
  }

  function render() {
    document.title = titleForView();
    const listCount = items.filter((item) => item.onList).length;
    const storageNote = store.persistent ? '' : `<div class="state-banner warning" role="alert"><strong>Temporary notebook:</strong> this browser blocked local storage. Keep this tab open or export after making changes.</div>`;
    app.classList.toggle('is-demo', isDemo);
    app.innerHTML = `${siteHeader()}
      ${isDemo ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved</strong><span>Try the shelf without changing your pantry.</span><div><button class="text-button" type="button" data-action="reset-demo">Reset demo</button><button class="secondary-button" type="button" data-action="start-real">Start for real</button></div></aside>` : ''}
      <div id="connection-state" class="state-banner offline" role="status" ${navigator.onLine ? 'hidden' : ''}><strong>Offline.</strong> Your notebook still works on this device.</div>
      ${storageNote}
      <nav class="notebook-tabs" aria-label="Pantry views">
        <button type="button" data-view="shelf" ${view === 'shelf' ? 'aria-current="page"' : ''}>Shelf</button>
        <button type="button" data-view="list" ${view === 'list' ? 'aria-current="page"' : ''}>Shopping list${listCount ? `<span class="count-badge" aria-label="${plural(listCount, 'item')} on list">${listCount}</span>` : ''}</button>
        <button type="button" data-view="more" ${view === 'more' ? 'aria-current="page"' : ''}>Data and help</button>
      </nav>
      <main id="main" tabindex="-1">
        ${renderIntro()}
        ${view === 'shelf' ? renderShelf() : view === 'list' ? renderList() : renderMore()}
      </main>
      ${siteFooter()}
      <div id="route-announcement" class="sr-only" aria-live="polite"></div>
      <div id="toast" class="toast" role="status" aria-live="polite" hidden></div>`;
    bindEvents();
  }

  function renderIntro() {
    if (view === 'list' || view === 'more') return `<section class="page-intro"><p class="eyebrow">${productName}</p><h1 id="page-title" tabindex="-1">${headingForView()}</h1></section>`;
    if (isDemo) return `<section class="demo-intro" aria-labelledby="page-title"><p class="eyebrow">${productName}</p><h1 id="page-title" tabindex="-1">Sample pantry</h1><p>The sample begins with four repeat packages and one item ready to buy.</p></section>`;
    const actions = isDemo ? `<p class="demo-summary">The sample begins with four repeat packages and one item ready to buy.</p>` : `<div class="first-actions"><a class="primary-button" href="/demo/">Try it with sample data</a><span>Loads four common pantry packages.</span><button class="secondary-button" type="button" data-action="add">Add your first package</button></div>`;
    return `<section class="product-intro" aria-labelledby="page-title"><p class="eyebrow">${productName}</p><h1 id="page-title" tabindex="-1">${headingForView()}</h1><p class="lede">For households buying milk, rice, or detergent again, so replacements reach a local list before they run out.</p>${actions}${isDemo ? '' : '<ul class="fact-list"><li>No account needed</li><li>Data stays in this browser</li><li>Works offline after the first visit</li></ul>'}</section>`;
  }

  function renderShelf() {
    const shelf = !items.length ? `
      <section class="empty-layout" aria-labelledby="empty-title">
        <div class="empty-copy"><p class="eyebrow">Your shelf is empty</p><h2 id="empty-title">Add a package you buy again</h2><p>Set a rough count and the point where it should reach your shopping list.</p><button class="primary-button" type="button" data-action="add">Add a package</button><p class="quiet-note">Missed a finish? Correct the count whenever you notice.</p></div>
        <picture class="hero-picture"><source srcset="/images/notebook-pantry-640.avif 640w, /images/notebook-pantry-960.avif 960w" type="image/avif"><source srcset="/images/notebook-pantry-640.webp 640w, /images/notebook-pantry-960.webp 960w" type="image/webp"><img src="/images/notebook-pantry-960.jpg" width="960" height="640" fetchpriority="high" decoding="async" alt="Plain pantry packages and an empty carton on a graph-paper notebook beside a checklist."></picture>
      </section>` : `
      <section class="shelf-heading"><div><p class="eyebrow">Pinned packages</p><h2>Your shelf</h2><p>Counts are rough. Finish a package when it empties.</p></div><button class="secondary-button" type="button" data-action="add">Add package</button></section>
      <ul class="pantry-list" aria-label="Pinned pantry packages">${[...items].sort(byName).map(renderItem).join('')}</ul>
      ${renderRecentMarks()}`;
    return `${shelf}${renderHowItWorks()}`;
  }

  function renderRecentMarks() {
    const recent = [...events].filter((event) => event.kind === 'finished').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
    return recent.length ? `<section class="recent-marks" aria-labelledby="recent-title"><h2 id="recent-title">Recent finish marks</h2><ol>${recent.map((event) => `<li><span>${escapeHtml(event.itemName)}</span><time datetime="${event.at}">${formatRelative(event.at)}</time></li>`).join('')}</ol></section>` : '';
  }

  function renderHowItWorks() {
    return `<section class="how-it-works" aria-labelledby="how-title"><h2 id="how-title">How it works</h2><ol><li><strong>Set a rough count.</strong> Choose the point where you want a replacement listed.</li><li><strong>Finish one package.</strong> Tap once when it empties.</li><li><strong>Buy and update.</strong> Mark it bought and add the packages that came home.</li></ol><h2>Privacy and limits</h2><p>Counts are reminders, not exact inventory. You can correct them any time. Pantry data stays in this browser unless you download a backup.</p></section>`;
  }

  function renderItem(item: PantryItem) {
    const status = item.onList ? '<span class="status-mark on-list">On the shopping list</span>' : item.reserve <= item.threshold + 1 ? '<span class="status-mark soon">Nearly list time</span>' : '<span class="status-mark steady">Enough noted</span>';
    return `<li class="pantry-row" data-item-id="${item.id}">
      <div class="item-identity"><div class="package-doodle" aria-hidden="true"><span></span></div><div><h3>${escapeHtml(item.name)}</h3>${status}<p>Add to list at ${plural(item.threshold, 'package')} left</p></div></div>
      <div class="reserve-control"><span class="reserve-label">about</span><strong aria-label="${escapeHtml(item.name)}: about ${plural(item.reserve, 'sealed package')} left">${item.reserve}</strong><span class="reserve-label">left</span><div class="correction-buttons" aria-label="Correct ${escapeHtml(item.name)} count"><button type="button" data-action="decrease" data-id="${item.id}" aria-label="Subtract one ${escapeHtml(item.name)} package" ${item.reserve === 0 ? 'disabled' : ''}>−</button><button type="button" data-action="increase" data-id="${item.id}" aria-label="Add one ${escapeHtml(item.name)} package">＋</button></div></div>
      <div class="row-actions"><button class="finish-button" type="button" data-action="finish" data-id="${item.id}" aria-label="${item.reserve === 0 ? `${escapeHtml(item.name)} is at zero` : `Finish one ${escapeHtml(item.name)}`}" ${item.reserve === 0 ? 'disabled aria-describedby="zero-' + item.id + '"' : ''}><span class="stamp-icon" aria-hidden="true">✓</span>${item.reserve === 0 ? 'At zero' : 'Finish one'}</button><button class="edit-button" type="button" data-action="edit" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.name)}">Edit</button>${item.reserve === 0 ? `<span id="zero-${item.id}" class="sr-only">The count is already zero and this item is on the shopping list.</span>` : ''}</div>
    </li>`;
  }

  function renderList() {
    const listed = items.filter((item) => item.onList).sort(byName);
    if (!listed.length) return `<section class="list-empty"><div class="large-check" aria-hidden="true">✓</div><h2>Nothing needs replacing</h2><p>When a shelf count reaches its chosen point, the package appears here.</p><button class="secondary-button" type="button" data-view="shelf">Back to shelf</button></section>`;
    return `<section class="list-heading"><h2>${plural(listed.length, 'replacement')}</h2><p>Mark an item bought, then record how many packages came home.</p></section><ul class="shopping-list">${listed.map((item) => `<li><button type="button" data-action="bought" data-id="${item.id}" aria-label="Mark ${escapeHtml(item.name)} as bought"><span class="open-check" aria-hidden="true"></span><span><strong>${escapeHtml(item.name)}</strong><small>about ${plural(item.reserve, 'package')} left now</small></span><span class="bought-label">Mark bought</span></button></li>`).join('')}</ul><p class="quiet-note list-note">Each package appears once, even if you finish another before shopping.</p>`;
  }

  function renderMore() {
    return `<section class="more-heading"><p>Your pantry data stays in this browser. Export a backup before changing devices or clearing site data.</p></section>
      <div class="utility-grid">
        <section><h2>Back up your pantry</h2><p>Export a JSON backup of your items and history.</p><button class="secondary-button" type="button" data-action="export" ${items.length ? '' : 'disabled'}>Export JSON backup</button><button class="secondary-button" type="button" data-action="choose-import">Import JSON backup</button><input hidden id="import-file" type="file" accept="application/json,.json"></section>
        <section><h2>Correct a missed finish</h2><p>Use the plus and minus controls beside a package. The shopping list stays until you mark the package bought.</p></section>
        <section><h2>Storage</h2><p>${store.persistent ? 'Saved in this browser. It works offline after the first successful visit.' : 'Local storage is blocked. Changes last only while this page remains open.'}</p><p class="data-summary">${plural(items.length, 'item')} · ${plural(events.length, 'event')}</p>${items.length ? '<button class="danger-button" type="button" data-action="erase">Erase this notebook</button>' : ''}</section>
        <section><h2>What it does not do</h2><p>It does not track expiry dates, barcodes, recipes, retailers, or exact inventory.</p></section>
      </div>`;
  }

  function bindEvents() {
    app.querySelectorAll<HTMLElement>('[data-view]').forEach((control) => control.addEventListener('click', () => navigate(control.dataset.view as View)));
    app.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => button.addEventListener('click', () => void handleAction(button.dataset.action ?? '', button.dataset.id)));
    app.querySelector<HTMLInputElement>('#import-file')?.addEventListener('change', (event) => void importFile((event.currentTarget as HTMLInputElement).files?.[0]));
  }

  function navigate(nextView: View, replace = false) {
    view = nextView;
    const query = new URLSearchParams();
    if (view !== 'shelf') query.set('view', view);
    const next = `${isDemo ? '/demo/' : '/'}${query.size ? `?${query}` : ''}`;
    history[replace ? 'replaceState' : 'pushState'](null, '', next);
    render();
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('#page-title')?.focus();
      const announcement = document.querySelector<HTMLElement>('#route-announcement');
      if (announcement) announcement.textContent = headingForView();
    });
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
      if (action === 'reset-demo' && isDemo) return void await resetDemo();
      if (action === 'start-real' && isDemo) return void await startForReal();
    } catch { persistError(); }
  }

  async function resetDemo() {
    const sample = createSamplePantry();
    await store.replace({ product: 'finish-one-pantry', version: 1, exportedAt: new Date().toISOString(), ...sample });
    ({ items, events } = await store.load());
    view = 'shelf';
    render();
    showToast('Demo reset to its sample packages.');
  }

  async function startForReal() {
    await store.clear();
    location.assign('/');
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
        <p class="eyebrow">${item ? 'Edit package' : 'Add a repeat package'}</p><h2>${item ? `Edit ${escapeHtml(item.name)}` : 'What do you finish often?'}</h2>
        <label for="item-name">Item name</label><input id="item-name" name="name" required maxlength="60" autocomplete="off" autofocus value="${item ? escapeHtml(item.name) : ''}" placeholder="For example, oat milk">
        <div class="number-fields"><div><label for="item-reserve">About how many are left?</label><input id="item-reserve" name="reserve" type="number" inputmode="numeric" min="0" max="99" required value="${item?.reserve ?? 2}"></div><div><label for="item-threshold">Add to list when this many are left</label><input id="item-threshold" name="threshold" type="number" inputmode="numeric" min="0" max="20" required value="${item?.threshold ?? 1}"></div></div>
        <p class="form-hint">Use a rough count. You can correct it from the shelf.</p><p id="form-error" class="form-error" role="alert"></p>
        <div class="dialog-actions">${item ? '<button type="button" class="danger-link" id="delete-item">Delete package</button>' : '<span></span>'}<button class="primary-button" value="save">${item ? 'Save changes' : 'Add to shelf'}</button></div>
      </form>`);
    const form = dialog.querySelector<HTMLFormElement>('#item-form')!;
    dialog.querySelector<HTMLButtonElement>('#delete-item')?.addEventListener('click', () => { dialog.close(); confirmDelete(item!); });
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
        dialog.close(); render(); showToast(`${next.name} ${item ? 'updated' : 'added to the shelf'}.`);
      } catch (error) { dialog.querySelector<HTMLElement>('#form-error')!.textContent = error instanceof Error ? error.message : 'That package could not be saved.'; }
    });
  }

  function openBoughtDialog(item: PantryItem) {
    const dialog = createDialog(`<form method="dialog" class="paper-form" id="bought-form"><button class="dialog-close" value="cancel" aria-label="Close without saving">×</button><p class="eyebrow">Record a purchase</p><h2>How many ${escapeHtml(item.name)} packages came home?</h2><label for="bought-quantity">Packages bought</label><input id="bought-quantity" name="quantity" type="number" min="1" max="99" inputmode="numeric" value="1" required><p class="form-hint">This adds to the rough count and removes ${escapeHtml(item.name)} from the shopping list.</p><p id="form-error" class="form-error" role="alert"></p><div class="dialog-actions"><button class="text-button" value="cancel">Not yet</button><button class="primary-button" value="save">Save as bought</button></div></form>`);
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
        dialog.close(); render(); showToast(`${item.name}: added ${plural(quantity, 'package')} and cleared from the list.`);
      } catch (error) { dialog.querySelector<HTMLElement>('#form-error')!.textContent = error instanceof Error ? error.message : 'That purchase could not be saved.'; }
    });
  }

  function confirmDelete(item: PantryItem) {
    const dialog = createDialog(`<form method="dialog" class="paper-form"><p class="eyebrow">Delete package</p><h2>Delete ${escapeHtml(item.name)}?</h2><p>This removes the package from the shelf, shopping list, and local history.</p><div class="dialog-actions"><button class="text-button" value="cancel">Keep package</button><button class="danger-button" value="delete">Delete ${escapeHtml(item.name)}</button></div></form>`);
    dialog.addEventListener('close', async () => { if (dialog.returnValue === 'delete') { await store.deleteItem(item.id); items = items.filter((value) => value.id !== item.id); events = events.filter((value) => value.itemId !== item.id); render(); showToast(`${item.name} deleted.`); } });
  }

  function confirmErase() {
    const dialog = createDialog(`<form method="dialog" class="paper-form"><p class="eyebrow">Erase local data</p><h2>Erase this whole notebook?</h2><p>All ${plural(items.length, 'item')} and ${plural(events.length, 'event')} will be deleted from this browser. Export first if you want a copy.</p><div class="dialog-actions"><button class="text-button" value="cancel">Keep notebook</button><button class="danger-button" value="erase">Erase everything</button></div></form>`);
    dialog.addEventListener('close', async () => { if (dialog.returnValue === 'erase') { await store.clear(); items = []; events = []; navigate('shelf', true); showToast('The local notebook was erased.'); } });
  }

  function createDialog(markup: string) {
    document.querySelector('dialog')?.remove();
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = document.createElement('dialog');
    dialog.innerHTML = markup;
    document.body.append(dialog);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close('cancel'); });
    dialog.addEventListener('close', () => { dialog.remove(); requestAnimationFrame(() => returnFocus?.focus()); }, { once: true });
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
      const dialog = createDialog(`<form method="dialog" class="paper-form"><p class="eyebrow">Backup checked</p><h2>Replace this notebook?</h2><p>The backup contains ${plural(data.items.length, 'item')} and ${plural(data.events.length, 'event')}. Importing replaces everything currently stored here.</p><div class="dialog-actions"><button class="text-button" value="cancel">Keep current data</button><button class="primary-button" value="import">Replace and import</button></div></form>`);
      dialog.addEventListener('close', async () => { if (dialog.returnValue === 'import') { await store.replace(data); items = data.items; events = data.events; navigate('shelf', true); showToast(`Imported ${plural(items.length, 'item')}.`); } });
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
  window.addEventListener('popstate', () => {
    const query = new URLSearchParams(location.search);
    view = query.get('view') === 'list' ? 'list' : query.get('view') === 'more' ? 'more' : 'shelf';
    render();
    requestAnimationFrame(() => document.querySelector<HTMLElement>('#page-title')?.focus());
  });
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
  toast.innerHTML = '<span>An update is ready.</span><button type="button">Update now</button>';
  toast.hidden = false;
  toast.querySelector('button')?.addEventListener('click', () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' }));
}
