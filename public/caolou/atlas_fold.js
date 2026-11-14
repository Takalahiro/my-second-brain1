/* 选地点的筛选默认收起。打开一块，不打开另外几块。 */
function foldAtlasControls() {
  const filters = document.getElementById("filters");
  if (!filters || filters.dataset.folded === "1") return;
  const cats = document.getElementById("flowCats");
  const tools = document.getElementById("routeTools");
  const duration = document.getElementById("maxMin") ? document.getElementById("maxMin").closest("label") : null;
  const loose = Array.from(filters.children).filter((node) => {
    if (node === cats || node === tools || node === duration) return false;
    if (node.id === "count" || node.id === "foundLine") return false;
    return node.matches("label, select, p, fieldset");
  });
  function wrap(nodes, title) {
    const present = nodes.filter(Boolean);
    if (!present.length || present[0].closest("details.atlas-fold")) return;
    const details = document.createElement("details");
    details.className = "atlas-fold";
    details.open = false;
    const summary = document.createElement("summary");
    summary.textContent = title;
    details.appendChild(summary);
    present[0].parentNode.insertBefore(details, present[0]);
    present.forEach((node) => details.appendChild(node));
  }
  wrap(cats ? [cats] : [], "类别");
  wrap(duration ? [duration] : [], "路程时长");
  wrap(loose.concat(tools ? [tools] : []), "排序和标签");
  filters.dataset.folded = "1";
}

foldAtlasControls();
if (typeof map !== "undefined" && map) setTimeout(() => map.invalidateSize(), 80);
