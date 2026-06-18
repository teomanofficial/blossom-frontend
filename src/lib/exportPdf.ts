/**
 * Dependency-free "Export as PDF" — opens a clean, print-optimized document in
 * a new window and triggers the browser's print dialog (Save as PDF). Used by
 * the Content Playbook and the Analysis Detail pages.
 */

export interface PdfBlock {
  heading?: string
  paragraphs?: string[]
  bullets?: string[]
  keyValues?: [string, string][]
  /** Numbered items, each with a title and lines (e.g. shots). */
  numbered?: { title?: string; lines: string[] }[]
  /** Verbatim/preformatted text (e.g. the script). */
  pre?: string
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderBlock(b: PdfBlock): string {
  const parts: string[] = []
  if (b.heading) parts.push(`<h2>${esc(b.heading)}</h2>`)
  for (const p of b.paragraphs ?? []) parts.push(`<p>${esc(p)}</p>`)
  if (b.keyValues?.length) {
    parts.push(
      `<table>${b.keyValues
        .map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`)
        .join('')}</table>`
    )
  }
  if (b.bullets?.length) {
    parts.push(`<ul>${b.bullets.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`)
  }
  if (b.numbered?.length) {
    parts.push(
      `<ol>${b.numbered
        .map(
          (n) =>
            `<li>${n.title ? `<strong>${esc(n.title)}</strong><br/>` : ''}${n.lines
              .map((l) => esc(l))
              .join('<br/>')}</li>`
        )
        .join('')}</ol>`
    )
  }
  if (b.pre) parts.push(`<pre>${esc(b.pre)}</pre>`)
  return `<section>${parts.join('\n')}</section>`
}

export function exportPdf(opts: { title: string; subtitle?: string; blocks: PdfBlock[] }): void {
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>${esc(opts.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 40px; line-height: 1.5; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  .sub { color: #666; font-size: 13px; margin: 0 0 24px; }
  section { margin: 0 0 18px; page-break-inside: avoid; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .06em; color: #a21caf; border-bottom: 1px solid #eee; padding-bottom: 4px; margin: 18px 0 8px; }
  p { margin: 4px 0; font-size: 13px; }
  ul, ol { margin: 6px 0; padding-left: 20px; font-size: 13px; }
  li { margin: 4px 0; }
  table { border-collapse: collapse; font-size: 13px; margin: 4px 0; }
  td { padding: 2px 10px 2px 0; vertical-align: top; }
  td.k { color: #666; white-space: nowrap; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 13px; background: #f7f7f8; padding: 12px; border-radius: 8px; }
  @media print { body { margin: 0.6in; } a { color: inherit; text-decoration: none; } }
</style></head>
<body>
  <h1>${esc(opts.title)}</h1>
  ${opts.subtitle ? `<p class="sub">${esc(opts.subtitle)}</p>` : ''}
  ${opts.blocks.map(renderBlock).join('\n')}
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) {
    alert('Please allow pop-ups to export the PDF.')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
}
