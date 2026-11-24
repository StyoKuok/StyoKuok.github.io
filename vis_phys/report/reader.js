const byId = id => document.getElementById(id);
let report;
let current = 1;
const sectionEntries = () => [{title: 'Title, abstract & permissions', page: 1}, {title: 'Contents', page: 2}, ...report.contents];

function requestedPage() {
  const match = window.location.hash.match(/^#page=(\d+)$/);
  return match ? Number(match[1]) : 1;
}

function showPage(number, updateAddress = true, scrollToPage = false) {
  if (!report) return;
  current = Math.min(report.pages.length, Math.max(1, Math.trunc(number) || 1));
  const page = report.pages[current - 1];
  byId('previous').disabled = current === 1;
  byId('next').disabled = current === report.pages.length;
  byId('page-number').value = String(current);
  byId('page-total').textContent = `/ ${report.pages.length}`;
  byId('page-caption').textContent = `Project report · Page ${current} of ${report.pages.length}`;
  byId('page-text').textContent = page.text;
  byId('text-version').open = false;
  byId('report-page').alt = `Project report, page ${current} of ${report.pages.length}. Use “Text of this page” for accessible text.`;
  byId('report-page').width = page.width;
  byId('report-page').height = page.height;
  byId('reader-status').textContent = `Loading page ${current}…`;
  byId('report-page').src = page.image;
  byId('page-stage').scrollLeft = 0;
  if (updateAddress) history.replaceState(null, '', `#page=${current}`);
  const active = sectionEntries().reverse().find(item => item.page <= current);
  document.querySelectorAll('#contents-links a').forEach(link => {
    link.setAttribute('aria-current', String(link.dataset.section === active?.title));
  });
  if (scrollToPage) byId('page-stage').scrollIntoView({block:'start', behavior:'instant'});
  // Preload just one adjacent page; the complete report is not loaded at once.
  const adjacent = report.pages[current];
  if (adjacent) { const image = new Image(); image.src = adjacent.image; }
}

byId('report-page').addEventListener('load', () => {
  byId('reader-status').textContent = `Page ${current} of ${report.pages.length} · Online reading`;
});
byId('report-page').addEventListener('error', () => {
  byId('reader-status').textContent = 'This page could not be loaded. Please reload the reader.';
});
byId('previous').addEventListener('click', () => showPage(current - 1, true, true));
byId('next').addEventListener('click', () => showPage(current + 1, true, true));
byId('page-number').addEventListener('change', event => showPage(Number(event.target.value), true, true));
byId('zoom').addEventListener('change', event => {
  document.querySelector('.paper').style.width = event.target.value === 'fit' ? '100%' : `${794 * Number(event.target.value) / 100}px`;
});
byId('contents-toggle').addEventListener('click', () => {
  const open = byId('contents').classList.toggle('is-open');
  byId('contents-toggle').setAttribute('aria-expanded', String(open));
});
byId('share').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    byId('reader-status').textContent = `Link to page ${current} copied.`;
  } catch {
    byId('reader-status').textContent = 'Copy the address in your browser to share this page.';
  }
});
window.addEventListener('hashchange', () => showPage(requestedPage(), false, true));
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    showPage(current + (event.key === 'ArrowRight' ? 1 : -1), true, true);
  }
});

fetch('report.json').then(response => {
  if (!response.ok) throw Error('Report metadata unavailable');
  return response.json();
}).then(data => {
  report = data;
  byId('page-number').max = String(report.pages.length);
  byId('rights').textContent = report.rights;
  for (const item of sectionEntries()) {
    const link = document.createElement('a');
    link.href = `#page=${item.page}`;
    link.dataset.page = String(item.page);
    link.dataset.section = item.title;
    const title = document.createElement('span'); title.textContent = item.title;
    const page = document.createElement('span'); page.textContent = String(item.page);
    link.append(title, page);
    link.addEventListener('click', event => {
      event.preventDefault();
      byId('contents').classList.remove('is-open');
      byId('contents-toggle').setAttribute('aria-expanded', 'false');
      showPage(item.page, true, true);
    });
    byId('contents-links').append(link);
  }
  showPage(requestedPage());
}).catch(() => {
  byId('reader-status').textContent = 'The report could not be loaded. Please reload this page.';
  byId('report-page').hidden = true;
});
