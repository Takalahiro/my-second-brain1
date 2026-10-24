<script lang="ts">
  import { onMount } from 'svelte';
  import type { AvrFlow, AvrTraceStep } from '../../lib/avr/engine';
  import {
    controlSignals,
    hotSet,
    loadDatapathPrefs,
    pointerAddr,
    saveDatapathPrefs,
    type ArchId,
    type DatapathPrefs,
    type Hot,
    type PartId,
  } from '../../lib/avr/datapath';
  import {
    SPECS,
    beatsFor,
    changedRegs,
    cyclesUpTo,
    estimateCpi,
    lodBlend,
    mixUpTo,
    partDoing,
    PART_COPY,
    provenance,
    regPressure,
    storyLine,
    tickStride,
  } from '../../lib/avr/spec';
  import AvrPartOverlay from './AvrPartOverlay.svelte';

  interface Props {
    steps?: AvrTraceStep[];
    activeStep?: number;
  }

  let { steps = [], activeStep = $bindable(0) }: Props = $props();

  let prefs = $state<DatapathPrefs>(loadDatapathPrefs());
  let hover = $state<string | null>(null);
  let partHover = $state<PartId | null>(null);
  let tipX = $state(0);
  let tipY = $state(0);
  let wrap = $state<HTMLDivElement | null>(null);
  let phase = $state(0);
  let pinned = $state<number | null>(null);
  let query = $state('');
  let storyTimer: ReturnType<typeof setInterval> | null = null;
  let storyOn = $state(false);
  let customs = $state<{ name: string; kind: 'alu' | 'ld' | 'st' | 'branch' }[]>([]);
  let assumed = $state<string | null>(null);
  let tracked = 0;

  const ANCHOR: Record<PartId, { x: number; y: number }> = {
    pc: { x: 2, y: 22 },
    pmem: { x: 34, y: 2 },
    ir: { x: 36, y: 24 },
    decode: { x: 38, y: 36 },
    regs: { x: 2, y: 46 },
    alu: { x: 34, y: 48 },
    sreg: { x: 34, y: 64 },
    dmem: { x: 52, y: 44 },
  };

  onMount(() => {
    prefs = loadDatapathPrefs();
    try {
      const raw = localStorage.getItem('second-brain:avr-isa');
      if (raw) customs = JSON.parse(raw);
    } catch { /* ignore */ }
  });

  $effect(() => {
    saveDatapathPrefs(prefs);
  });

  $effect(() => {
    if (activeStep !== tracked) {
      phase = 0;
      tracked = activeStep;
    }
  });

  const step = $derived(steps[activeStep] ?? null);
  const prev = $derived(activeStep > 0 ? steps[activeStep - 1] : null);
  const arch = $derived(prefs.arch);
  const lod = $derived(lodBlend(prefs.scale));
  const detailOn = $derived(lod.layer >= 1);
  const innerOn = $derived(lod.layer >= 2);
  const spec = $derived(SPECS[arch]);
  const assumedFlow = $derived.by((): AvrFlow | undefined => {
    const row = customs.find((c) => c.name === assumed);
    if (!row) return step?.flow;
    if (row.kind === 'alu') return { op: 'add', rd: 16, rr: 17 };
    if (row.kind === 'ld') return { op: 'ld', rd: 16, ptr: 'x', post: true };
    if (row.kind === 'st') return { op: 'st', rr: 16, ptr: 'z', post: true };
    return { op: 'breq' };
  });
  const hot = $derived(hotSet(assumedFlow, arch));
  const addr = $derived(step ? pointerAddr(step) : null);
  const xPtr = $derived(step ? (step.snap.regs[26] | (step.snap.regs[27] << 8)) : 0);
  const zPtr = $derived(step ? (step.snap.regs[30] | (step.snap.regs[31] << 8)) : 0);
  const dirty = $derived(changedRegs(step, prev));
  const seek = $derived.by(() => {
    const m = /^r(\d{1,2})$/i.exec(query.trim());
    if (m) return Math.min(31, Number(m[1]));
    return pinned;
  });
  const chain = $derived(seek != null ? provenance(steps, activeStep, seek) : []);
  const perf = $derived(estimateCpi(steps, activeStep, arch, prefs.sandbox));
  const mix = $derived(mixUpTo(steps, activeStep));
  const compare = $derived({
    harvard: cyclesUpTo(steps, activeStep, 'harvard'),
    modified: cyclesUpTo(steps, activeStep, 'modified'),
    vonNeumann: cyclesUpTo(steps, activeStep, 'vonNeumann'),
  });
  const stride = $derived(tickStride(prefs.scale, prefs.grain));
  const beats = $derived(beatsFor(step ?? undefined, arch));
  const signals = $derived(controlSignals(assumedFlow));

  function on(id: Hot) {
    return hot.has(id);
  }

  function hex(n: number, width = 2) {
    return (n >>> 0).toString(16).toUpperCase().padStart(width, '0');
  }

  function place(e: MouseEvent | FocusEvent) {
    const bounds = wrap?.getBoundingClientRect();
    const el = e.currentTarget;
    if (!bounds || !(el instanceof Element)) return;
    if (e instanceof MouseEvent && e.clientX) {
      tipX = Math.min(bounds.width - 180, e.clientX - bounds.left + 14);
      tipY = Math.min(bounds.height - 96, e.clientY - bounds.top + 16);
      return;
    }
    const box = el.getBoundingClientRect();
    tipX = box.left - bounds.left + 16;
    tipY = box.bottom - bounds.top + 8;
  }

  function enter(id: string, e: MouseEvent | FocusEvent) {
    hover = id;
    partHover = null;
    place(e);
  }

  function enterPart(id: PartId, e: MouseEvent) {
    partHover = id;
    hover = null;
    place(e);
  }

  function togglePart(id: PartId) {
    prefs.openParts = prefs.openParts.includes(id)
      ? prefs.openParts.filter((p) => p !== id)
      : [...prefs.openParts, id];
  }

  function setArch(id: ArchId) {
    prefs.arch = id;
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const next = prefs.scale + (e.deltaY > 0 ? -0.08 : 0.08);
    prefs.scale = Math.min(2.4, Math.max(0.5, Math.round(next * 100) / 100));
  }

  function bump(dir: number) {
    if (prefs.grain === 'cycle') {
      const next = phase + dir;
      if (next >= 0 && next < beats) {
        phase = next;
        return;
      }
    }
    const i = activeStep + dir;
    if (i >= 0 && i < steps.length) activeStep = i;
  }

  function toggleBreak(index: number) {
    prefs.breakpoints = prefs.breakpoints.includes(index)
      ? prefs.breakpoints.filter((n) => n !== index)
      : [...prefs.breakpoints, index];
  }

  function stopStory() {
    if (storyTimer) clearInterval(storyTimer);
    storyTimer = null;
    storyOn = false;
  }

  function playStory() {
    stopStory();
    if (!steps.length) return;
    storyOn = true;
    prefs.scale = 1.25;
    storyTimer = setInterval(() => {
      if (activeStep >= steps.length - 1 && phase >= beats - 1) {
        stopStory();
        return;
      }
      bump(1);
      if (prefs.breakpoints.includes(activeStep) && phase === 0) stopStory();
    }, 800);
  }

  function exportSvg() {
    const svg = wrap?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avr-step-${activeStep}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyLink() {
    const url = new URL(location.href);
    url.searchParams.set('step', String(activeStep));
    await navigator.clipboard.writeText(url.toString());
  }

  function addCustom(name: string, kind: 'alu' | 'ld' | 'st' | 'branch') {
    const clean = name.trim().toLowerCase();
    if (!clean) return;
    customs = [...customs.filter((c) => c.name !== clean), { name: clean, kind }];
    localStorage.setItem('second-brain:avr-isa', JSON.stringify(customs));
    assumed = clean;
  }

  const wireTip = $derived.by(() => {
    if (!hover) return null;
    const op = step?.flow?.op ?? '';
    const mem = op === 'ld' || op === 'st';
    const table: Record<string, { title: string; carry: string; logic: string }> = {
      pc: { title: 'PC → Program Memory', carry: '只送指令字地址。', logic: step ? `PC=#${step.pc} ${step.source}` : '等待指令' },
      fetch: { title: '16-bit 指令总线', carry: '程序字，不和数据总线混用。', logic: op ? `IR ← ${op.toUpperCase()}` : '空闲' },
      decode: { title: 'IR → Decoder', carry: '拆 opcode / Rd / Rr / K。', logic: op ? op.toUpperCase() : '空闲' },
      ctrl: { title: 'Control Signals', carry: '不携带数据。', logic: signals.join(' · ') },
      toAlu: { title: '寄存器 → ALU', carry: '操作数进入 ALU。', logic: step ? `R16=${hex(step.snap.regs[16])}` : '空闲' },
      fromAlu: { title: 'ALU → 寄存器', carry: '结果写回。比较指令不写回。', logic: op === 'cpi' || op === 'cp' ? '只留标志' : '写回 Rd' },
      sreg: { title: 'ALU → SREG', carry: '八个标志：中断、T、半进位、符号、溢出、负、零、进位。', logic: step ? `Z=${step.snap.z ? 1 : 0} C=${step.snap.c ? 1 : 0} N=${step.snap.n ? 1 : 0} V=${step.snap.v ? 1 : 0}` : '—' },
      indirect: { title: '间接寻址', carry: 'X/Y/Z 地址。', logic: mem ? `${op.toUpperCase()} ${addr != null ? hex(addr, 4) : ''}` : '本步不用' },
      direct: { title: '直接寻址', carry: '立即数或口地址来自指令字。', logic: op === 'ldi' ? `K=${hex(step?.flow?.k ?? 0)}` : '本步不用' },
      dbus: { title: '8-bit Data Bus', carry: '数据字节。指令不走这里。', logic: op === 'ld' ? `SRAM → R${step?.flow?.rd ?? 16}` : op === 'st' ? '寄存器 → SRAM' : '空闲' },
      io: { title: 'I/O', carry: '模块挂在数据总线上。', logic: op === 'in' || op === 'out' ? op.toUpperCase() : '关闭' },
    };
    return table[hover] ?? null;
  });

  const partTip = $derived(partHover ? { title: partHover.toUpperCase(), carry: PART_COPY[partHover].what, logic: partDoing(partHover, step) } : null);
  const tip = $derived(wireTip ?? partTip);
</script>

<div
  class="sheet-wrap arch-{arch}"
  bind:this={wrap}
  style="--detail-opacity: {detailOn ? 1 - lod.fade * 0.25 : lod.fade}; --inner-opacity: {innerOn ? 1 : lod.fade}"
>
  <div class="sheet-bar">
    <span class="sheet-title">L{lod.layer} · {spec.label}</span>
    {#each (['harvard', 'modified', 'vonNeumann'] as ArchId[]) as id}
      <button type="button" class:active={arch === id} onclick={() => setArch(id)}>{SPECS[id].label}</button>
    {/each}
    <label class="scale">缩放
      <input type="range" min="0.5" max="2.4" step="0.05" bind:value={prefs.scale} />
    </label>
    <button type="button" class:active={prefs.grain === 'insn'} onclick={() => (prefs.grain = 'insn')}>一指令</button>
    <button type="button" class:active={prefs.grain === 'cycle'} onclick={() => (prefs.grain = 'cycle')}>一拍</button>
  </div>
  <p class="spec-note">{spec.note}</p>

  <div class="diagram">
  <svg
    class="sheet"
    viewBox="0 0 920 560"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label="固定坐标数据通路"
    onwheel={onWheel}
  >
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 Z" class="arrow-head" />
      </marker>
    </defs>

    <g class="wire ctrl" class:hot={on('ctrl')} class:hover={hover === 'ctrl'}>
      <path marker-end="url(#arr)" d="M430 190 H860 V250" />
      <path marker-end="url(#arr)" d="M700 168 V250" />
      <path marker-end="url(#arr)" d="M250 212 V248" />
      <path marker-end="url(#arr)" d="M360 212 V260" />
      <path marker-end="url(#arr)" d="M520 212 V260" />
    </g>
    <text class="label" x="470" y="158">控制信号 Control</text>

    <g class="wire bus-fetch" class:hot={on('pc') || on('pmem')} class:hover={hover === 'pc'}>
      <path marker-end="url(#arr)" d="M118 48 H148" />
    </g>
    <g class="wire bus-fetch" class:hot={on('pmem') || on('ir')} class:hover={hover === 'fetch'}>
      <path marker-end="url(#arr)" d="M250 96 V110" />
    </g>
    <text class="label bus-fetch" x="258" y="108">16</text>
    <g class="wire" class:hot={on('ir') || on('decode')} class:hover={hover === 'decode'}>
      <path marker-end="url(#arr)" d="M250 154 V168" />
    </g>

    <g class="wire" class:hot={on('regs') || on('alu')} class:hover={hover === 'toAlu'}>
      <path marker-end="url(#arr)" d="M230 300 H268" />
    </g>
    <g class="wire" class:hot={on('alu') && on('regs')} class:hover={hover === 'fromAlu'}>
      <path marker-end="url(#arr)" d="M268 332 H230" />
    </g>
    <g class="wire" class:hot={on('sreg')} class:hover={hover === 'sreg'}>
      <path marker-end="url(#arr)" d="M330 348 V372" />
    </g>

    <g class="wire" class:hot={on('indirect')} class:hover={hover === 'indirect'}>
      <path marker-end="url(#arr)" d="M123 420 V458 H500 V400" />
    </g>
    <text class="label" x="150" y="448">间接寻址 Indirect</text>

    <g class="wire" class:hot={on('direct')} class:hover={hover === 'direct'}>
      <path marker-end="url(#arr)" d="M350 190 H500 V268" />
    </g>
    <text class="label" x="392" y="206">直接寻址 Direct</text>

    <g class="bus bus-shared">
      <path marker-start="url(#arr)" marker-end="url(#arr)" d="M250 96 H520 V268" />
    </g>
    <text class="label bus-shared" x="400" y="86">共享总线 Shared Bus</text>

    <g class="bus bus-data" class:hot={on('dbus') || on('dmem') || on('io')} class:hover={hover === 'dbus'}>
      <path marker-start="url(#arr)" marker-end="url(#arr)" d="M24 500 H896" />
    </g>
    <text class="label bus-name bus-data" x="300" y="490">{arch === 'vonNeumann' ? '共享总线 Shared Bus' : '8 位数据总线 Data Bus'}</text>
    <g class="wire bus-data" class:hot={on('dbus') || on('dmem')} class:hover={hover === 'dbus'}>
      <path marker-end="url(#arr)" d="M520 400 V500" />
      <path marker-end="url(#arr)" d="M120 420 V500" />
      <path marker-end="url(#arr)" d="M330 412 V500" />
    </g>
    <g class="wire" class:hot={on('io') || on('dbus')} class:hover={hover === 'io'}>
      <path marker-end="url(#arr)" d="M660 440 V500" />
      <path marker-end="url(#arr)" d="M790 440 V500" />
    </g>

    <g class="pulses" style="pointer-events: none">
      {#if on('dbus')}
        <circle r="3.2" class="pulse"><animateMotion dur="{prefs.pulse}s" repeatCount="indefinite" path="M160 500 H520" /></circle>
        {#if prefs.grain === 'cycle'}
          <circle r="2.4" class="pulse t2"><animateMotion dur="{prefs.pulse}s" begin="0.2s" repeatCount="indefinite" path="M160 500 H520" /></circle>
          <circle r="2.4" class="pulse t3"><animateMotion dur="{prefs.pulse}s" begin="0.4s" repeatCount="indefinite" path="M160 500 H520" /></circle>
        {/if}
      {/if}
      {#if on('pmem')}
        <circle r="3.2" class="pulse"><animateMotion dur="{prefs.pulse}s" repeatCount="indefinite" path="M250 96 V154" /></circle>
      {/if}
    </g>

    <g class="box" class:on={on('pc')} class:seek={query.trim().toLowerCase() === 'pc'}>
      <rect x="16" y="24" width="110" height="48" rx="4" />
      <text class="title" x="71" y="44" text-anchor="middle">PC</text>
      {#if detailOn}<text class="sub" x="71" y="62" text-anchor="middle">#{step?.pc ?? 0}</text>{/if}
    </g>
    <g class="box" class:on={on('pmem')}>
      <rect x="148" y="12" width="210" height="88" rx="4" />
      <text class="title" x="253" y="36" text-anchor="middle">程序存储器</text>
      <text class="sub" x="253" y="54" text-anchor="middle">Program Memory · 32KB</text>
      <text class="sub" x="253" y="72" text-anchor="middle">16-bit 字寻址</text>
      <text class="sub cache-note" x="253" y="90" text-anchor="middle">I-Cache</text>
    </g>
    <g class="box" class:on={on('ir')}>
      <rect x="160" y="108" width="186" height="48" rx="4" />
      <text class="title" x="253" y="128" text-anchor="middle">指令寄存器 IR</text>
      {#if detailOn}<text class="sub" x="253" y="146" text-anchor="middle">{step?.flow?.op?.toUpperCase() ?? ''}</text>{/if}
    </g>
    <g class="box" class:on={on('decode')}>
      <rect x="150" y="166" width="206" height="48" rx="4" />
      <text class="title" x="253" y="196" text-anchor="middle">指令译码器</text>
    </g>
    <g class="box" class:on={on('regs')} class:seek={seek != null}>
      <rect x="16" y="256" width="220" height="168" rx="4" />
      <text class="title" x="126" y="282" text-anchor="middle">寄存器堆</text>
      <text class="sub" x="126" y="302" text-anchor="middle">32 × 8-bit · R0–R31</text>
      {#if detailOn && step}
        <text class="sub" class:dirty={dirty.has(16)} x="32" y="334">R16 {hex(step.snap.regs[16])}</text>
        <text class="sub" class:dirty={dirty.has(17)} x="126" y="334">R17 {hex(step.snap.regs[17])}</text>
        <text class="sub" x="32" y="358">X {hex(xPtr, 4)}</text>
        <text class="sub" x="126" y="358">Z {hex(zPtr, 4)}</text>
        {#if step.flow?.rd != null}<text class="sub" x="32" y="386">Rd = R{step.flow.rd}</text>{/if}
      {:else}
        <text class="sub" x="126" y="340" text-anchor="middle">运行后显示数值</text>
      {/if}
    </g>
    <g class="box" class:on={on('alu')}>
      <rect x="268" y="264" width="128" height="84" rx="4" />
      <text class="title" x="332" y="300" text-anchor="middle">ALU</text>
      {#if detailOn}<text class="sub" x="332" y="324" text-anchor="middle">{step?.flow?.op?.toUpperCase() ?? '运算单元'}</text>{/if}
    </g>
    <g class="box" class:on={on('sreg')}>
      <rect x="268" y="368" width="128" height="48" rx="4" />
      <text class="title" x="332" y="388" text-anchor="middle">状态寄存器</text>
      {#if detailOn && step}<text class="sub" x="332" y="406" text-anchor="middle">Z{step.snap.z ? 1 : 0} C{step.snap.c ? 1 : 0} N{step.snap.n ? 1 : 0} V{step.snap.v ? 1 : 0}</text>{/if}
    </g>
    <g class="box" class:on={on('dmem')}>
      <rect x="436" y="264" width="168" height="140" rx="4" />
      <text class="title" x="520" y="292" text-anchor="middle">数据存储器</text>
      <text class="sub" x="520" y="314" text-anchor="middle">SRAM · 2KB</text>
      <text class="sub cache-note" x="520" y="334" text-anchor="middle">D-Cache</text>
      {#if detailOn}
        <text class="sub" x="520" y="356" text-anchor="middle">{on('indirect') ? `${(step?.flow?.ptr ?? 'x').toUpperCase()} 指针` : ' '}</text>
        {#if addr != null}<text class="sub" x="520" y="378" text-anchor="middle">{hex(addr, 4)}</text>{/if}
      {/if}
    </g>
    <g class="box io" class:on={on('io')}>
      <rect x="620" y="356" width="86" height="40" rx="4" />
      <text class="title sm" x="663" y="382" text-anchor="middle">模块 1</text>
    </g>
    <g class="box io" class:on={on('io')}>
      <rect x="620" y="404" width="86" height="40" rx="4" />
      <text class="title sm" x="663" y="430" text-anchor="middle">模块 n</text>
    </g>
    <g class="box io">
      <rect x="726" y="356" width="118" height="40" rx="4" />
      <text class="title sm" x="785" y="382" text-anchor="middle">定时器</text>
    </g>
    <g class="box io">
      <rect x="726" y="404" width="118" height="40" rx="4" />
      <text class="title sm" x="785" y="430" text-anchor="middle">中断单元</text>
    </g>

    <g class="picks">
      <rect data-part="pc" role="button" tabindex="0" aria-label="展开 PC" x="16" y="24" width="110" height="48" onclick={() => togglePart('pc')} onkeydown={(e) => { if (e.key === 'Enter') togglePart('pc'); }} onmouseenter={(e) => enterPart('pc', e)} onmouseleave={() => (partHover = null)} />
      <rect data-part="pmem" role="button" tabindex="0" aria-label="展开程序存储器" x="148" y="12" width="210" height="88" onclick={() => togglePart('pmem')} onkeydown={(e) => { if (e.key === 'Enter') togglePart('pmem'); }} onmouseenter={(e) => enterPart('pmem', e)} onmouseleave={() => (partHover = null)} />
      <rect data-part="ir" role="button" tabindex="0" aria-label="展开指令寄存器" x="160" y="108" width="186" height="48" onclick={() => togglePart('ir')} onkeydown={(e) => { if (e.key === 'Enter') togglePart('ir'); }} onmouseenter={(e) => enterPart('ir', e)} onmouseleave={() => (partHover = null)} />
      <rect data-part="decode" role="button" tabindex="0" aria-label="展开译码器" x="150" y="166" width="206" height="48" onclick={() => togglePart('decode')} onkeydown={(e) => { if (e.key === 'Enter') togglePart('decode'); }} onmouseenter={(e) => enterPart('decode', e)} onmouseleave={() => (partHover = null)} />
      <rect data-part="regs" role="button" tabindex="0" aria-label="展开寄存器堆" x="16" y="256" width="220" height="168" onclick={() => togglePart('regs')} onkeydown={(e) => { if (e.key === 'Enter') togglePart('regs'); }} onmouseenter={(e) => enterPart('regs', e)} onmouseleave={() => (partHover = null)} />
      <rect data-part="alu" role="button" tabindex="0" aria-label="展开 ALU" x="268" y="264" width="128" height="84" onclick={() => togglePart('alu')} onkeydown={(e) => { if (e.key === 'Enter') togglePart('alu'); }} onmouseenter={(e) => enterPart('alu', e)} onmouseleave={() => (partHover = null)} />
      <rect data-part="sreg" role="button" tabindex="0" aria-label="展开状态寄存器" x="268" y="368" width="128" height="48" onclick={() => togglePart('sreg')} onkeydown={(e) => { if (e.key === 'Enter') togglePart('sreg'); }} onmouseenter={(e) => enterPart('sreg', e)} onmouseleave={() => (partHover = null)} />
      <rect data-part="dmem" role="button" tabindex="0" aria-label="展开数据存储器" x="436" y="264" width="168" height="140" onclick={() => togglePart('dmem')} onkeydown={(e) => { if (e.key === 'Enter') togglePart('dmem'); }} onmouseenter={(e) => enterPart('dmem', e)} onmouseleave={() => (partHover = null)} />
    </g>
    <g class="hits">
      <path role="img" aria-label="PC 到程序存储器" d="M118 48 H148" onmouseenter={(e) => enter('pc', e)} onmousemove={place} onmouseleave={() => (hover = null)} />
      <path role="img" aria-label="16 位指令总线" d="M250 96 V118" onmouseenter={(e) => enter('fetch', e)} onmousemove={place} onmouseleave={() => (hover = null)} />
      <path role="img" aria-label="指令寄存器到译码器" d="M250 146 V176" onmouseenter={(e) => enter('decode', e)} onmousemove={place} onmouseleave={() => (hover = null)} />
      <path role="img" aria-label="控制信号" d="M430 190 H860 V250 M700 168 V250 M250 212 V248 M360 212 V260 M520 212 V260" onmouseenter={(e) => enter('ctrl', e)} onmousemove={place} onmouseleave={() => (hover = null)} />
      <path role="img" aria-label="寄存器到 ALU" d="M220 300 H278" onmouseenter={(e) => enter('toAlu', e)} onmousemove={place} onmouseleave={() => (hover = null)} />
      <path role="img" aria-label="ALU 写回寄存器" d="M220 332 H278" onmouseenter={(e) => enter('fromAlu', e)} onmousemove={place} onmouseleave={() => (hover = null)} />
      <path role="img" aria-label="ALU 到状态寄存器" d="M330 340 V380" onmouseenter={(e) => enter('sreg', e)} onmousemove={place} onmouseleave={() => (hover = null)} />
      <path role="img" aria-label="间接寻址" d="M123 420 V458 H500 V400" onmouseenter={(e) => enter('indirect', e)} onmousemove={place} onmouseleave={() => (hover = null)} />
      <path role="img" aria-label="直接寻址" d="M350 190 H500 V268" onmouseenter={(e) => enter('direct', e)} onmousemove={place} onmouseleave={() => (hover = null)} />
      <path role="img" aria-label="8 位数据总线" d="M24 500 H896 M520 400 V500 M120 420 V500 M330 412 V500" onmouseenter={(e) => enter('dbus', e)} onmousemove={place} onmouseleave={() => (hover = null)} />
      <path role="img" aria-label="数据总线到 I/O" d="M660 440 V500 M790 440 V500" onmouseenter={(e) => enter('io', e)} onmousemove={place} onmouseleave={() => (hover = null)} />
    </g>
  </svg>
  </div>

  {#each prefs.openParts as part (part)}
    <div class="overlay" style="left: {ANCHOR[part].x}%; top: {ANCHOR[part].y}%">
      <AvrPartOverlay
        {part}
        {step}
        {prev}
        {steps}
        {arch}
        {seek}
        onClose={() => togglePart(part)}
        onSeek={(reg) => { pinned = reg; query = ''; }}
        onPick={(index) => { activeStep = index; }}
      />
    </div>
  {/each}

  {#if tip}
    <div class="tip" style="left: {tipX}px; top: {tipY}px">
      <strong>{tip.title}</strong>
      <p>{tip.carry}</p>
      <p class="logic">{tip.logic}</p>
    </div>
  {/if}

  <div class="sheet-foot">
  <div class="time">
    <button type="button" onclick={() => bump(-1)}>上一拍</button>
    <input
      type="range"
      min="0"
      max={Math.max(0, steps.length - 1)}
      step={stride}
      bind:value={activeStep}
      aria-label="时间轴"
    />
    <button type="button" onclick={() => bump(1)}>下一拍</button>
    <button type="button" onclick={() => toggleBreak(activeStep)}>{prefs.breakpoints.includes(activeStep) ? '取消断点' : '断点'}</button>
    <span>{prefs.grain === 'cycle' ? `T${phase + 1}/${beats}` : `${activeStep + 1}/${steps.length || 0}`}</span>
  </div>
  <div class="ticks">
    {#each steps as s, i}
      {#if i % stride === 0}
        <button type="button" class:now={i === activeStep} class:mark={prefs.breakpoints.includes(i)} class:chain={chain.includes(i)} onclick={() => (activeStep = i)}>{i + 1}</button>
      {/if}
    {/each}
  </div>

  <p class="story">{storyLine(step)}</p>
  <div class="tools">
    <button type="button" onclick={playStory}>{storyOn ? '故事播放中' : '引导故事'}</button>
    <button type="button" onclick={stopStory}>停止</button>
    <label>找寄存器 <input bind:value={query} placeholder="r16" /></label>
    <button type="button" onclick={exportSvg}>导出 SVG</button>
    <button type="button" onclick={copyLink}>复制短链</button>
  </div>

  <details class="perf-box">
    <summary>性能对照 · CPI / 架构拍数</summary>
    {#if lod.layer >= 1}
      <p class="perf">CPI {perf.cpi.toFixed(2)} · 周期 {perf.cycles} · 约 {perf.ns.toFixed(1)} µs @ {prefs.sandbox.clockMHz} MHz</p>
    {/if}
    {#if lod.layer >= 2}
      <p class="perf">mix ALU {mix.alu} / 访存 {mix.load} / 控制 {mix.ctrl} / IO {mix.io}</p>
    {/if}
    {#if lod.layer >= 3}
      <p class="perf">寄存器压力 {regPressure(step)} / 32{#if seek != null} · r{seek} 溯源 {chain.map((i) => i + 1).join(' ← ') || '尚无写入'}{/if}</p>
    {/if}
    <p class="perf">同一段代码：哈佛 {compare.harvard} 拍 · 改进哈佛 {compare.modified} 拍 · 冯·诺依曼 {compare.vonNeumann} 拍</p>
    <p class="perf">理想单周期 RISC：{Math.min(steps.length, activeStep + 1)} 拍（对照）</p>
    <label class="pulse-lab">脉冲速度 <input type="range" min="0.4" max="2.4" step="0.1" bind:value={prefs.pulse} /></label>
  </details>

  <details>
    <summary>假设与自定义接线</summary>
    <label>时钟 MHz <input type="number" min="1" max="64" bind:value={prefs.sandbox.clockMHz} /></label>
    <label>流水线级数 <input type="number" min="1" max="5" bind:value={prefs.sandbox.pipeline} /></label>
    <label><input type="checkbox" bind:checked={prefs.sandbox.bypass} /> 旁路</label>
    <form onsubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); addCustom(String(fd.get('name') ?? ''), String(fd.get('kind') ?? 'alu') as 'alu' | 'ld' | 'st' | 'branch'); }}>
      <input name="name" placeholder="自定义助记符" />
      <select name="kind">
        <option value="alu">ALU</option>
        <option value="ld">ld</option>
        <option value="st">st</option>
        <option value="branch">分支</option>
      </select>
      <button type="submit">接线</button>
    </form>
    {#each customs as row}
      <button type="button" class:active={assumed === row.name} onclick={() => (assumed = row.name)}>{row.name}</button>
    {/each}
    <button type="button" onclick={() => (assumed = null)}>回到真实指令</button>
    <p>{signals.join(' · ')}</p>
  </details>

  {#if steps.length}
    <details>
      <summary>最近指令</summary>
      {#each steps.slice(Math.max(0, activeStep - 7), activeStep + 1) as s}
        <button type="button" onclick={() => (activeStep = s.id)}>{s.id + 1}. {s.source}</button>
      {/each}
    </details>
  {/if}
  </div>
</div>

<style>
  .sheet-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    padding: var(--space-2);
    overflow: hidden;
    gap: 2px;
  }
  /* 图优先：宁可脚栏滚动，也不把 SVG 压到字糊 */
  .diagram {
    flex: 1 1 auto;
    min-height: min(52vh, 22rem);
    overflow: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    background: var(--bg);
  }
  .sheet-foot {
    flex: 0 1 auto;
    max-height: 30%;
    min-height: 0;
    overflow: auto;
  }
  .sheet-bar, .tools, .time, .ticks { display: flex; flex-wrap: wrap; gap: var(--space-1); align-items: center; }
  .sheet-title { font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--text); }
  .spec-note, .story, .perf { font-size: var(--text-sm); color: var(--text-muted); margin: 2px 0; line-height: 1.4; }
  .sheet-bar button, .tools button, .time button, .ticks button, details button {
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    border-radius: 999px;
    font-size: var(--text-sm);
    padding: 4px var(--space-2);
    cursor: pointer;
  }
  button.active, .ticks button.now { color: var(--on-accent); background: var(--accent); border-color: transparent; }
  .ticks button.mark { outline: 2px solid var(--accent-in); }
  .ticks button.chain { background: var(--overlay-subtle); }
  .scale, .tools label, details label, .pulse-lab {
    font-size: var(--text-sm);
    color: var(--text-muted);
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
  }
  .sheet {
    width: 100%;
    height: auto;
    min-height: 22rem;
    display: block;
    shape-rendering: geometricPrecision;
    text-rendering: geometricPrecision;
  }
  .box rect {
    fill: var(--surface);
    stroke: var(--text);
    stroke-width: 1.75;
  }
  .box.on rect {
    stroke: var(--accent);
    stroke-width: 2.75;
    fill: var(--overlay-subtle);
  }
  .box.seek rect { stroke: var(--accent-in); }
  .box text.title {
    fill: var(--text);
    font-size: 17px;
    font-weight: 650;
    font-family: var(--font-body);
  }
  .box text.title.sm { font-size: 15px; }
  .box text.sub {
    font-size: 13px;
    fill: var(--text-muted);
    opacity: var(--detail-opacity, 1);
    font-family: var(--font-mono, ui-monospace, monospace);
  }
  .cache-note { opacity: 0; }
  .arch-modified .cache-note { opacity: var(--inner-opacity, 0); }
  .label {
    fill: var(--text);
    font-size: 13px;
    font-weight: 560;
    font-family: var(--font-body);
  }
  .bus-name { fill: var(--text); font-size: 14px; font-weight: 650; }
  .wire path, .bus path { fill: none; stroke: var(--text-muted); stroke-width: 1.85; }
  .wire.hot path, .bus.hot path { stroke: var(--accent); stroke-width: 2.6; }
  .ctrl path { stroke-dasharray: 5 4; }
  .wire.hover path, .bus.hover path { stroke: var(--accent); stroke-width: 3; }
  .arch-harvard .bus-shared, .arch-modified .bus-shared { display: none; }
  .arch-vonNeumann .bus-fetch { opacity: 0.35; }
  .arch-vonNeumann .bus-data { opacity: 0.45; }
  .hits path, .picks rect { fill: transparent; stroke: transparent; stroke-width: 14; cursor: pointer; }
  .hits path { pointer-events: stroke; cursor: help; }
  .pulse { fill: var(--accent); }
  .pulse.t2 { fill: var(--accent-in); }
  .pulse.t3 { fill: var(--accent-out); }
  text.dirty { fill: var(--accent-in); font-weight: 700; }
  .overlay { position: absolute; z-index: 4; }
  .tip {
    position: absolute;
    z-index: 6;
    max-width: 18rem;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--accent);
    border-radius: var(--radius-card);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow-sm);
    pointer-events: none;
  }
  .tip strong { display: block; font-size: var(--text-sm); }
  .tip p { margin: var(--space-1) 0 0; font-size: var(--text-sm); color: var(--text-muted); }
  .tip p.logic { color: var(--text); }
  .arrow-head { fill: var(--text-muted); }
  details { font-size: var(--text-sm); color: var(--text-muted); margin-top: 2px; }
  details summary { cursor: pointer; color: var(--text); font-weight: 560; }
  details form, details p { display: flex; flex-wrap: wrap; gap: var(--space-1); margin: var(--space-1) 0; }
  input, select {
    font-size: var(--text-sm);
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-button);
  }
</style>
