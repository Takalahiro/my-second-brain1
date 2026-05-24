<script lang="ts">
  import { onMount } from 'svelte';

  let progress = $state(0);
  let altFt = $state(0);
  let orbitDeg = $state(0);

  onMount(() => {
    const scrollRoots: (Element | Document)[] = [document, document.documentElement];

    function measure() {
      let maxScroll = 0;
      let scrollTop = 0;
      let scrollHeight = 0;
      let clientHeight = 0;

      const bodies = document.querySelectorAll('.mac-body');
      bodies.forEach((el) => {
        const sh = el.scrollHeight - el.clientHeight;
        if (sh > maxScroll) {
          maxScroll = sh;
          scrollTop = el.scrollTop;
          scrollHeight = el.scrollHeight;
          clientHeight = el.clientHeight;
        }
      });

      if (maxScroll <= 0) {
        const doc = document.documentElement;
        maxScroll = doc.scrollHeight - doc.clientHeight;
        scrollTop = doc.scrollTop;
        scrollHeight = doc.scrollHeight;
        clientHeight = doc.clientHeight;
      }

      const p = maxScroll > 0 ? scrollTop / maxScroll : 0;
      progress = p;
      altFt = Math.round(p * 420);
      orbitDeg = p * 360;
    }

    const onScroll = () => measure();
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);

    let raf = 0;
    const spin = () => {
      orbitDeg = (orbitDeg + 0.15) % 360;
      raf = requestAnimationFrame(spin);
    };
    raf = requestAnimationFrame(spin);

    measure();

    return () => {
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  });
</script>

<div class="hud-scroll-indicator" aria-hidden="true">
  <div class="hud-scroll-indicator__orbit" style:transform="rotate({orbitDeg}deg)">
    <span class="hud-scroll-indicator__sat"></span>
  </div>
  <div class="hud-scroll-indicator__track">
    <div class="hud-scroll-indicator__fill" style:height="{progress * 100}%"></div>
    <div class="hud-scroll-indicator__needle" style:bottom="{progress * 100}%"></div>
  </div>
  <div class="hud-scroll-indicator__labels">
    <span>ALT</span>
    <span class="hud-scroll-indicator__val">{altFt} FT</span>
    <span>0</span>
  </div>
</div>
