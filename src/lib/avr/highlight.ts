import { AVR_MNEMONICS } from './isa';

const OPS = `\\b(${[...AVR_MNEMONICS, 'lo8', 'hi8', 'asciz', 'byte', 'db', 'dw', 'space', 'section', 'global', 'end'].join('|')})\\b`;
const REGS = String.raw`\b(r\d{1,2}|ddrb|portb|pinb)\b`;
const NUMS = String.raw`\b(0x[0-9a-f]+|\$[0-9a-f]+|\d+)\b`;
const LBL = String.raw`(^|[\s])([A-Za-z_]\w*):`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function highlightAvr(code: string): string {
  return code.split('\n').map((line) => {
    const cut = line.indexOf(';');
    const body = cut >= 0 ? line.slice(0, cut) : line;
    const cmt = cut >= 0 ? line.slice(cut) : '';
    let html = escapeHtml(body)
      .replace(new RegExp(LBL, 'g'), '$1<span class="avr-lbl">$2</span>:')
      .replace(new RegExp(OPS, 'gi'), '<span class="avr-op">$1</span>')
      .replace(new RegExp(REGS, 'gi'), '<span class="avr-reg">$1</span>')
      .replace(new RegExp(NUMS, 'gi'), '<span class="avr-num">$1</span>');
    if (cmt) html += `<span class="avr-cmt">${escapeHtml(cmt)}</span>`;
    return html || ' ';
  }).join('\n');
}
