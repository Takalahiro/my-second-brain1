/* 潜水套装。和徒步分层分开，不并进 PACK，不进徒步可执行重量。
   克数和价格只在用户写过时才填。型号未定的行不挂产品图。 */
const DIVE_WHEN = "2026-11-13";
const DIVE_SOURCE = "用户确认";

const DIVE_KIT = [
  {
    id: "diveT3",
    label: "Atomic Aquatics T3",
    kind: "调节器",
    status: "已有",
    model: "T3",
    modelNote: "用户确认一套",
    photo: "gear/atomic-t3.jpg",
    page: "https://www.atomicaquatics.com/products/regulators/t3-regulator/",
    photoFrom: "https://www.atomicaquatics.com/wp-content/uploads/sites/4/2020/08/03-0100-7P_1-1.jpg",
    note: "官网这一页标题是 T3 Regulator，卖的是一级头加二级头。品牌记 Atomic Aquatics，型号记 T3。没有改成别的调节器。用户没有说明 DIN 或 Yoke，照片不拿来认定接头。克数未填。价格未填。"
  },
  {
    id: "diveMk2",
    label: "Garmin Descent MK2",
    kind: "潜水电脑表",
    status: "已有",
    model: "Descent MK2",
    modelNote: "不是 MK2i",
    photo: "gear/descent-mk2.png",
    page: "https://www.garmin.co.jp/products/wearables/descent-mk2/",
    photoFrom: "https://www.garmin.co.jp/m/jp/g/products/descent-Mk2-cf-xl.png",
    note: "佳明电脑表。记 Garmin Descent MK2，不是 MK2i。照片来自佳明日本官网这一页的 Descent Mk2 产品图。美国站产品页没有打开。不抄页面上的克数和价格。克数未填。价格未填。"
  },
  {
    id: "diveGull",
    label: "Gull 面镜",
    kind: "面镜",
    status: "已有",
    model: "型号未定",
    modelNote: "只记品牌 Gull",
    photo: "",
    page: "",
    photoFrom: "",
    note: "用户没有给出型号。不附某一款 Gull 面镜的产品图。"
  },
  {
    id: "diveFeSuit",
    label: "Fourth Element 连体湿衣",
    kind: "湿衣",
    status: "已有",
    model: "型号未定",
    modelNote: "四元素。不指定 Xenos、Proteus 或其他未点名的衣服",
    photo: "",
    page: "",
    photoFrom: "",
    note: "四元素连体湿衣。不附产品图。"
  },
  {
    id: "diveFeFins",
    label: "Fourth Element 技术脚蹼",
    kind: "脚蹼",
    status: "已有",
    model: "型号未定",
    modelNote: "四元素技术脚蹼。不指定脚蹼型号",
    photo: "",
    page: "",
    photoFrom: "",
    note: "四元素技术脚蹼。不附产品图。"
  },
  {
    id: "diveFeBoots",
    label: "Fourth Element 技术潜水靴",
    kind: "靴子",
    status: "已有",
    model: "型号未定",
    modelNote: "四元素技术潜水靴",
    photo: "",
    page: "",
    photoFrom: "",
    note: "四元素技术潜水靴。不附产品图。"
  },
  {
    id: "diveFeGloves",
    label: "Fourth Element 技术潜水手套",
    kind: "手套",
    status: "已有",
    model: "型号未定",
    modelNote: "四元素技术潜水手套",
    photo: "",
    page: "",
    photoFrom: "",
    note: "四元素技术潜水手套。不附产品图。"
  },
  {
    id: "diveBcd",
    label: "BCD",
    kind: "BCD",
    status: "已有但没带来",
    model: "型号未定",
    modelNote: "留在住处。不是本次携带",
    photo: "",
    page: "",
    photoFrom: "",
    note: "人有一只，这次没带来。状态是已有，不是未买。留在住处，不是本次携带，不计入本次可执行重量。不附产品图。克数未填。价格未填。"
  }
];

function diveEsc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

const diveCarry = {};

function diveFace(row) {
  if (row.status === "已有" || row.status === "已有但没带来") return "已有";
  if (row.status === "借用") return "借用";
  if (row.status === "已买但未收货") return "已订未到";
  if (row.status === "未买") return "未买";
  return row.status;
}

function diveKitHtml() {
  const rows = DIVE_KIT.map((row) => {
    const photo = row.photo
      ? `<img src="${diveEsc(row.photo)}" alt="${diveEsc(row.label)}">`
      : `<span class="dive-nophoto">无产品图</span>`;
    const link = row.page
      ? `<a href="${diveEsc(row.page)}" target="_blank" rel="noreferrer">${diveEsc(row.page)}</a>`
      : "无产品页";
    const face = diveFace(row);
    const carrying = !!diveCarry[row.id];
    const carry = `<label><input type="checkbox" data-dive-carry="${diveEsc(row.id)}" ${carrying ? "checked" : ""}> 这次带着</label>`;
    return `<tr data-dive-id="${diveEsc(row.id)}" data-dive-label="${diveEsc(row.label)}" data-dive-status="${diveEsc(row.status)}" data-face="${diveEsc(face)}">
      <td>${photo}</td>
      <td><strong>${diveEsc(row.label)}</strong><br><span>${diveEsc(row.kind)}</span></td>
      <td class="dive-face">${diveEsc(face)}${carrying ? " · 这次带着" : ""}</td>
      <td>${diveEsc(row.model)}。${diveEsc(row.modelNote)}</td>
      <td>克数未填。价格未填。<br>${carry}</td>
      <td>${diveEsc(row.note)} 来源 ${DIVE_SOURCE} ${DIVE_WHEN}。${link}</td>
    </tr>`;
  }).join("");
  return `<section id="diveKit" data-kit="dive">
    <h3>潜水套装</h3>
    <p>证书不等于这个潜点允许你下潜。</p>
    <p>这套单独放，不进上面的徒步。克数都未填，不计入能出发的重量。BCD 已有，这次没带来。</p>
    <table>
      <thead><tr><th>照片</th><th>名称</th><th>状态</th><th>型号</th><th>克数和价格</th><th>说明</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function diveKitMount() {
  if (document.getElementById("diveKit")) return;
  const page = document.querySelector(".flow-page");
  if (!page) return;
  const title = page.querySelector("h2");
  if (!title || title.textContent.indexOf("准备装备") < 0) return;
  page.insertAdjacentHTML("beforeend", diveKitHtml());
}

(function diveKitInstall() {
  const style = document.createElement("style");
  style.textContent = `#diveKit{margin-top:28px;border:1px solid var(--line);padding:12px 14px}#diveKit table{width:100%;border-collapse:collapse}#diveKit th,#diveKit td{border-bottom:1px solid var(--line);padding:8px;vertical-align:top;text-align:left}#diveKit td:last-child{color:var(--muted);font-size:14px}#diveKit img{width:72px;height:72px;object-fit:contain;background:#111}#diveKit .dive-nophoto{display:inline-block;width:72px;color:var(--muted)}#diveKit .dive-face{font-weight:500}#diveKit tr[data-face="已有"] .dive-face{color:var(--safe)}`;
  document.head.appendChild(style);
  if (typeof flowRender === "function") {
    const previous = flowRender;
    flowRender = function diveAwareFlowRender() {
      const result = previous.apply(this, arguments);
      diveKitMount();
      return result;
    };
  }
  document.body.addEventListener("change", (event) => {
    const carry = event.target.closest("[data-dive-carry]");
    if (!carry) return;
    diveCarry[carry.dataset.diveCarry] = carry.checked;
  });
  diveKitMount();
})();
