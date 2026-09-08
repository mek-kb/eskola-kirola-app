const SHEET_ID = "1ResFVm5rBVHrt25QYdZTIWFy8hGwD-EkKz2BKa5ww-0";

const TALDEAK = {
  Psikomotrizitatea: ["HH3", "HH4", "HH5"],
  "Jolas Hezi": ["LH1", "LH2"],
  Multikirola: ["LH3", "LH4", "LH5", "LH6"]
};

// Hemen gehituko ditugu Google Calendar estekak.
const IKASTURTEKO_EGUTEGIA_IRUDIA = "images/ikasturteko-egutegia.png";
const BEGIRALEEN_EGUTEGIA_URL = "https://calendar.google.com/calendar/u/0?cid=bXV0cmlrdWtvZXNrb2xha2lyb2xhQGdtYWlsLmNvbQ";

function erakutsiAtala(atala) {
  navAktiboaEzarri(atala);

  const ekintzak = {
    hasiera: hasieraIkusi,
    taldeak: taldeakIkusi,
    egutegiak: egutegiakIkusi,
    agiriak: agiriakIkusi,
    gehiago: gehiagoIkusi,
    abisuak: abisuakIkusi,
    ordutegia: ordutegiaIkusi,
    kokalekuak: kokalekuakIkusi,
    ikasturtekoEgutegia: ikasturtekoEgutegiaIkusi,
    begiraleenEgutegia: begiraleenEgutegiaIkusi,
    dokumentuak: dokumentuakIkusi,
    protokoloak: protokoloakIkusi
  };

  if (ekintzak[atala]) ekintzak[atala]();
}

function navAktiboaEzarri(atala) {
  document.querySelectorAll(".beheko-menua button")
    .forEach(b => b.classList.remove("nav-aktiboa"));

  const mapa = {
    hasiera: "nav-hasiera",
    abisuak: "nav-hasiera",
    taldeak: "nav-taldeak",
    egutegiak: "nav-egutegiak",
    ikasturtekoEgutegia: "nav-egutegiak",
    begiraleenEgutegia: "nav-egutegiak",
    agiriak: "nav-agiriak",
    dokumentuak: "nav-agiriak",
    protokoloak: "nav-agiriak",
    gehiago: "nav-gehiago",
    ordutegia: "nav-gehiago",
    kokalekuak: "nav-gehiago"
  };

  const botoia = document.getElementById(mapa[atala] || "");
  if (botoia) botoia.classList.add("nav-aktiboa");
}

async function sheetKargatu(sheetIzena) {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}` +
    `/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetIzena)}` +
    `&t=${Date.now()}`;

  const erantzuna = await fetch(url, { cache: "no-store" });
  if (!erantzuna.ok) throw new Error(`${sheetIzena} fitxa ezin izan da irakurri.`);

  const testua = await erantzuna.text();
  const hasiera = testua.indexOf("{");
  const amaiera = testua.lastIndexOf("}") + 1;

  if (hasiera < 0 || amaiera <= 0) {
    throw new Error("Google Sheet-eko erantzuna ez da zuzena.");
  }

  return JSON.parse(testua.substring(hasiera, amaiera));
}

function gelaxka(row, index) {
  if (!row?.c?.[index]) return "";
  return row.c[index].f ?? row.c[index].v ?? "";
}

function garbitu(testua) {
  return String(testua ?? "").trim();
}

function babestu(testua) {
  return String(testua ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function goiburuaDa(testua, goiburua) {
  return garbitu(testua).toLowerCase() === goiburua.toLowerCase();
}

function alergiaErrealaDa(alergiak) {
  const balioa = garbitu(alergiak).toLowerCase();
  return !["", "ez", "ez dauka", "ez du", "bat ere ez", "ninguna", "ninguno", "no", "alergiak"]
    .includes(balioa);
}

function kargatzenErakutsi() {
  document.getElementById("edukia").innerHTML =
    `<div class="kargatzen"><span></span><span></span><span></span></div>`;
}

async function hasieraIkusi() {
  const edukia = document.getElementById("edukia");
  kargatzenErakutsi();

  try {
    const emaitzak = await Promise.allSettled([
      sheetKargatu("Partaideak"),
      sheetKargatu("Abisuak")
    ]);

    const partaideak =
      emaitzak[0].status === "fulfilled"
        ? emaitzak[0].value
        : { table: { rows: [] } };

    const abisuak =
      emaitzak[1].status === "fulfilled"
        ? emaitzak[1].value
        : { table: { rows: [] } };

    const taldeKopuruak = {};

    Object.values(TALDEAK)
      .flat()
      .forEach(taldea => {
        taldeKopuruak[taldea] = 0;
      });

    let partaideGuztira = 0;
    const alergiakDituztenak = [];

    (partaideak.table?.rows || []).forEach(row => {
      const taldea = garbitu(gelaxka(row, 1));
      const izena = garbitu(gelaxka(row, 2));
      const alergiak = garbitu(gelaxka(row, 5));

      if (!izena || goiburuaDa(izena, "Izena")) return;

      partaideGuztira++;

      if (taldeKopuruak[taldea] !== undefined) {
        taldeKopuruak[taldea]++;
      }

      if (alergiaErrealaDa(alergiak)) {
        alergiakDituztenak.push({ taldea, izena, alergiak });
      }
    });

    const abisuZerrenda = (abisuak.table?.rows || []).filter(row => {
      const izenburua = garbitu(gelaxka(row, 1));
      return izenburua && !goiburuaDa(izenburua, "Izenburua");
    });

    const azkenAbisuak = abisuZerrenda.slice(-3).reverse();

    const gaur = new Date().toLocaleDateString("eu-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    let html = `
      <section class="ongietorri-txartela">
        <div>
          <p class="ongietorri-testua">2026–2027 IKASTURTEA</p>
          <h2>Mutrikuko<br>Eskola Kirola</h2>
          <p class="gaurko-data">${babestu(gaur)}</p>
        </div>
        <img src="images/icon.192.png" alt="MEKE logoa">
      </section>

      <section class="web-atalak">
        <button class="web-atal-botoia" onclick="erakutsiAtala('egutegiak')">
          <span>IKASTURTEKO EGUTEGIA</span>
          <small>Ikasturteko eta begiraleen egutegiak</small>
          <svg viewBox="0 0 24 24"><path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/></svg>
        </button>

        <button class="web-atal-botoia" onclick="ordutegiaIkusi()">
          <span>ORDUTEGIA</span>
          <small>Ikasturteko ordutegi orokorra</small>
          <svg viewBox="0 0 24 24"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
        </button>

        <button class="web-atal-botoia" onclick="protokoloakIkusi()">
          <span>PROTOKOLOA</span>
          <small>Lan eta jarduera protokoloak</small>
          <svg viewBox="0 0 24 24"><path d="M9 5h6m-8 2H5v14h14V7h-2M9 3h6v4H9V3Zm0 9h6m-6 4h6"/></svg>
        </button>

        <button class="web-atal-botoia" onclick="kokalekuakIkusi()">
          <span>INSTALAZIOAK</span>
          <small>Kokalekuak eta instalazioen informazioa</small>
          <svg viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>
        </button>
      </section>

      <section class="estatistika-sarea">
        ${estatistikaTxartela("partaideak", partaideGuztira, "Partaide")}
        ${estatistikaTxartela("abisuak", abisuZerrenda.length, "Abisu", "erakutsiAtala('abisuak')")}
        ${estatistikaTxartela("alerta", alergiakDituztenak.length, "Alergia")}
        ${estatistikaTxartela("egutegia", 2, "Egutegi", "erakutsiAtala('egutegiak')")}
      </section>

      <div class="atal-izenburua">
        <h2>Programak eta taldeak</h2>
        <button onclick="erakutsiAtala('taldeak')">Ikusi guztiak</button>
      </div>
    `;

    Object.entries(TALDEAK).forEach(([programa, taldeak]) => {
      html += `
        <section class="dashboard-programa">
          <h3>${babestu(programa)}</h3>
          <div class="dashboard-taldeak">
            ${taldeak.map(taldea => `
              <button onclick="partaideakIkusi('${taldea}')">
                <span>${taldea}</span>
                <strong>${taldeKopuruak[taldea]}</strong>
              </button>
            `).join("")}
          </div>
        </section>
      `;
    });

    html += `
      <div class="atal-izenburua">
        <h2>Azken abisuak</h2>
        <button onclick="erakutsiAtala('abisuak')">Ikusi guztiak</button>
      </div>
    `;

    if (azkenAbisuak.length === 0) {
      html += `<article class="txartela"><p>Ez dago abisurik.</p></article>`;
    }

    azkenAbisuak.forEach(row => {
      html += abisuTxartela(
        garbitu(gelaxka(row, 0)),
        garbitu(gelaxka(row, 1)),
        garbitu(gelaxka(row, 2)),
        garbitu(gelaxka(row, 3))
      );
    });

    html += `
      <div class="atal-izenburua">
        <h2>Alergien alertak</h2>
      </div>
    `;

    if (alergiakDituztenak.length === 0) {
      html += `<article class="txartela"><p>Ez dago alergiarik erregistratuta.</p></article>`;
    }

    alergiakDituztenak.slice(0, 5).forEach(partaidea => {
      html += `
        <article class="txartela alergia-txartela">
          <h3>${babestu(partaidea.izena)}</h3>
          <p><strong>${babestu(partaidea.taldea)}</strong> · ${babestu(partaidea.alergiak)}</p>
        </article>
      `;
    });

    const erroreak = emaitzak
      .filter(emaitza => emaitza.status === "rejected")
      .map(emaitza => emaitza.reason?.message)
      .filter(Boolean);

    if (erroreak.length > 0) {
      html += `
        <article class="txartela">
          <p>Datu-fitxaren bat ezin izan da kargatu, baina aplikazioa ireki da.</p>
          <small>${babestu(erroreak.join(" · "))}</small>
        </article>
      `;
    }

    edukia.innerHTML = html;
  } catch (error) {
    edukia.innerHTML = `
      <div class="orrialde-goiburua"><h2>Hasiera</h2></div>
      <article class="txartela">
        <p>Ezin izan da hasiera kargatu.</p>
        <small>${babestu(error?.message || "Errore ezezaguna")}</small>
      </article>
    `;
  }
}

function estatistikaTxartela(mota, zenbakia, etiketa, onclick = "") {
  const ikonoak = {
    partaideak: `<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-1a3 3 0 1 0 0-6m-7 9c-4 0-7 2-7 5v2h14v-2c0-3-3-5-7-5Zm7 1c3 0 6 1.5 6 4v2h-5"/>`,
    abisuak: `<path d="M15 17H9m9-2V11a6 6 0 0 0-12 0v4l-2 2h16l-2-2Zm-7 5h2"/>`,
    alerta: `<path d="M12 3 2.5 20h19L12 3Zm0 6v5m0 3h.01"/>`,
    egutegia: `<path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/>`
  };

  return `
    <article class="estatistika-txartela ${onclick ? "klikagarria" : ""}" ${onclick ? `onclick="${onclick}"` : ""}>
      <svg viewBox="0 0 24 24">${ikonoak[mota]}</svg>
      <strong>${zenbakia}</strong>
      <span>${etiketa}</span>
    </article>
  `;
}

function abisuTxartela(data, izenburua, mezua, taldea) {
  return `
    <article class="txartela abisu-txartela">
      <div class="abisu-ikonoa">
        <svg viewBox="0 0 24 24"><path d="M15 17H9m9-2V11a6 6 0 0 0-12 0v4l-2 2h16l-2-2"/></svg>
      </div>
      <div>
        <h3>${babestu(izenburua)}</h3>
        <p>${babestu(mezua)}</p>
        <small>${babestu(data)}${taldea ? ` · ${babestu(taldea)}` : ""}</small>
      </div>
    </article>
  `;
}

function taldeakIkusi() {
  const edukia = document.getElementById("edukia");

  let html = `
    <div class="orrialde-goiburua">
      <h2>Taldeak</h2>
      <p>Aukeratu programa eta taldea.</p>
    </div>
  `;

  Object.entries(TALDEAK).forEach(([programa, taldeak]) => {
    html += `
      <section class="programa-atala">
        <h3>${babestu(programa)}</h3>
        <div class="talde-botoiak">
          ${taldeak.map(t => `<button onclick="partaideakIkusi('${t}')">${t}</button>`).join("")}
        </div>
      </section>
    `;
  });

  edukia.innerHTML = html;
}

async function partaideakIkusi(taldea) {
  navAktiboaEzarri("taldeak");
  kargatzenErakutsi();

  try {
    const json = await sheetKargatu("Partaideak");

    let html = `
      <button class="atzera-botoia" onclick="erakutsiAtala('taldeak')">← Taldeak</button>
      <div class="orrialde-goiburua">
        <h2>${babestu(taldea)}</h2>
        <p>Taldeko partaideen informazioa.</p>
      </div>
      <input type="search" id="bilatzailea" placeholder="Bilatu partaidea..." oninput="bilatuPartaideak()" autocomplete="off">
      <div id="partaideZerrenda">
    `;

    let kopurua = 0;

    json.table.rows.forEach(row => {
      const id = garbitu(gelaxka(row, 0));
      const taldeaSheet = garbitu(gelaxka(row, 1));
      const izena = garbitu(gelaxka(row, 2));
      const tutorea = garbitu(gelaxka(row, 3));
      const telefonoa = garbitu(gelaxka(row, 4));
      const alergiak = garbitu(gelaxka(row, 5));
      const kodea = garbitu(gelaxka(row, 6));

      if (taldeaSheet !== taldea || !izena || goiburuaDa(izena, "Izena")) return;
      kopurua++;

      const telefonoGarbitua = telefonoa.replace(/[^\d+]/g, "");

      html += `
        <article class="txartela partaide-txartela">
          <div class="partaide-goiburua">
            <div class="partaide-avatarra">${babestu(izena.charAt(0).toUpperCase())}</div>
            <div>
              <h3>${babestu(izena)}</h3>
              <small>${babestu(taldea)}</small>
            </div>
          </div>

          <div class="partaide-datuak">
            ${datuLerroa("Tutorea", tutorea || "—")}
            ${datuLerroa("Telefonoa", telefonoa || "—", telefonoa ? `tel:${telefonoGarbitua}` : "")}
            ${datuLerroa("Alergiak", alergiak || "—")}
            ${datuLerroa("Kodea", kodea || "—")}
          </div>

          <small>ID: ${babestu(id)}</small>
        </article>
      `;
    });

    html += `</div>`;

    if (!kopurua) {
      html += `<article class="txartela"><p>Ez dago ${babestu(taldea)} taldeko partaiderik.</p></article>`;
    }

    document.getElementById("edukia").innerHTML = html;
  } catch (error) {
    document.getElementById("edukia").innerHTML = erroreTxartela(taldea, error);
  }
}

function datuLerroa(etiketa, balioa, esteka = "") {
  return `
    <div>
      <strong>${babestu(etiketa)}</strong>
      ${esteka
        ? `<a href="${babestu(esteka)}">${babestu(balioa)}</a>`
        : `<span>${babestu(balioa)}</span>`}
    </div>
  `;
}

function bilatuPartaideak() {
  const input = document.getElementById("bilatzailea");
  if (!input) return;

  const bilaketa = input.value.toLowerCase().trim();

  document.querySelectorAll(".partaide-txartela").forEach(txartela => {
    txartela.style.display =
      txartela.innerText.toLowerCase().includes(bilaketa) ? "block" : "none";
  });
}

async function abisuakIkusi() {
  kargatzenErakutsi();

  try {
    const json = await sheetKargatu("Abisuak");
    let html = `
      <div class="orrialde-goiburua">
        <h2>Abisuak</h2>
        <p>Eskola Kirolaren azken informazioa.</p>
      </div>
    `;
    let kopurua = 0;

    json.table.rows.slice().reverse().forEach(row => {
      const data = garbitu(gelaxka(row, 0));
      const izenburua = garbitu(gelaxka(row, 1));
      const mezua = garbitu(gelaxka(row, 2));
      const taldea = garbitu(gelaxka(row, 3));

      if (!izenburua || goiburuaDa(izenburua, "Izenburua")) return;
      kopurua++;
      html += abisuTxartela(data, izenburua, mezua, taldea);
    });

    if (!kopurua) html += `<article class="txartela"><p>Ez dago abisurik.</p></article>`;
    document.getElementById("edukia").innerHTML = html;
  } catch (error) {
    document.getElementById("edukia").innerHTML = erroreTxartela("Abisuak", error);
  }
}

function egutegiakIkusi() {
  document.getElementById("edukia").innerHTML = `
    <div class="orrialde-goiburua">
      <h2>Egutegiak</h2>
      <p>Aukeratu ikusi nahi duzun egutegia.</p>
    </div>

    <section class="aukera-sarea">
      ${aukeraBotoia("ikasturtekoEgutegiaIkusi()", "Ikasturteko egutegia", "egutegia")}
      ${aukeraBotoia("begiraleenEgutegiaIkusi()", "Begiraleen egutegia", "begiraleak")}
    </section>
  `;
}

function ikasturtekoEgutegiaIkusi() {
  document.getElementById("edukia").innerHTML = `
    <button class="atzera-botoia" onclick="erakutsiAtala('egutegiak')">← Egutegiak</button>
    <div class="orrialde-goiburua">
      <h2>Ikasturteko egutegia</h2>
      <p>2026–2027 ikasturtea</p>
    </div>
    <article class="txartela irudi-txartela">
      <img src="${IKASTURTEKO_EGUTEGIA_IRUDIA}" alt="2026-2027 ikasturteko egutegia" loading="eager">
    </article>
  `;
}

function begiraleenEgutegiaIkusi() {
  const embedUrl = "https://calendar.google.com/calendar/embed?src=mutrikukoeskolakirola%40gmail.com&ctz=Europe%2FMadrid&mode=AGENDA";

  document.getElementById("edukia").innerHTML = `
    <button class="atzera-botoia" onclick="erakutsiAtala('egutegiak')">← Egutegiak</button>
    <div class="orrialde-goiburua">
      <h2>Begiraleen egutegia</h2>
      <p>Google Calendar · eguneratuta</p>
    </div>

    <article class="txartela" style="padding:0; overflow:hidden;">
      <iframe
        src="${embedUrl}"
        title="Begiraleen egutegia"
        style="width:100%; height:72vh; min-height:560px; border:0; display:block; background:#fff;"
        frameborder="0"
        scrolling="no">
      </iframe>
    </article>

    <p style="margin:12px 4px 0; font-size:0.9rem; opacity:.75;">
      Egutegia hemen bertan ikusiko duzu. Google Calendar-en egiten dituzun aldaketak automatikoki agertuko dira.
    </p>
  `;
}

function egutegiEstekaIkusi(izenburua, url) {
  document.getElementById("edukia").innerHTML = `
    <button class="atzera-botoia" onclick="erakutsiAtala('egutegiak')">← Egutegiak</button>
    <div class="orrialde-goiburua"><h2>${babestu(izenburua)}</h2></div>
    <article class="txartela">
      ${url
        ? `<a class="esteka-botoia" href="${babestu(url)}" target="_blank" rel="noopener">Egutegia ireki</a>`
        : `<p>Google Calendar oraindik ez dago lotuta.</p>`}
    </article>
  `;
}

function agiriakIkusi() {
  document.getElementById("edukia").innerHTML = `
    <div class="orrialde-goiburua">
      <h2>Agiriak</h2>
      <p>Dokumentuak eta lan-protokoloak.</p>
    </div>

    <section class="aukera-sarea">
      ${aukeraBotoia("dokumentuakIkusi()", "Dokumentuak", "dokumentua")}
      ${aukeraBotoia("protokoloakIkusi()", "Protokoloak", "protokoloa")}
    </section>
  `;
}

async function dokumentuakIkusi() {
  await estekaZerrendaIkusi("Dokumentuak", "Dokumentuak");
}

async function protokoloakIkusi() {
  await estekaZerrendaIkusi("Protokoloak", "Protokoloak");
}

async function estekaZerrendaIkusi(sheetIzena, izenburua) {
  kargatzenErakutsi();

  try {
    const json = await sheetKargatu(sheetIzena);

    let html = `
      <button class="atzera-botoia" onclick="erakutsiAtala('agiriak')">← Agiriak</button>
      <div class="orrialde-goiburua"><h2>${babestu(izenburua)}</h2></div>
    `;
    let kopurua = 0;

    json.table.rows.forEach(row => {
      const izena = garbitu(gelaxka(row, 0));
      const esteka = garbitu(gelaxka(row, 1));

      if (!izena || !esteka || goiburuaDa(izena, "Izenburua")) return;
      kopurua++;

      html += `
        <article class="txartela dokumentu-txartela">
          <a href="${babestu(esteka)}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6V3Zm8 0v5h5M9 13h6m-6 4h6"/></svg>
            <span>${babestu(izena)}</span>
          </a>
        </article>
      `;
    });

    if (!kopurua) html += `<article class="txartela"><p>Oraindik ez da edukirik gehitu.</p></article>`;
    document.getElementById("edukia").innerHTML = html;
  } catch (error) {
    document.getElementById("edukia").innerHTML = erroreTxartela(izenburua, error);
  }
}

function gehiagoIkusi() {
  document.getElementById("edukia").innerHTML = `
    <div class="orrialde-goiburua">
      <h2>Gehiago</h2>
      <p>Eskola Kirolaren bestelako informazioa.</p>
    </div>

    <section class="aukera-sarea">
      ${aukeraBotoia("ordutegiaIkusi()", "Ordutegia", "egutegia")}
      ${aukeraBotoia("kokalekuakIkusi()", "Instalazioak", "kokalekua")}
      ${aukeraBotoia("erakutsiAtala('abisuak')", "Abisuak", "abisuak")}
      ${aukeraBotoia("erakutsiAtala('agiriak')", "Agiriak", "dokumentua")}
    </section>
  `;
}

function aukeraBotoia(ekintza, testua, mota) {
  const ikonoak = {
    egutegia: `<path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/>`,
    begiraleak: `<path d="M12 3 3 8l9 5 9-5-9-5Zm-6 8v5c3 3 9 3 12 0v-5M21 9v6"/>`,
    dokumentua: `<path d="M6 3h8l4 4v14H6V3Zm8 0v5h5M9 13h6m-6 4h6"/>`,
    protokoloa: `<path d="M9 5h6m-8 2H5v14h14V7h-2M9 3h6v4H9V3Zm0 9h6m-6 4h6"/>`,
    kokalekua: `<path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>`,
    abisuak: `<path d="M15 17H9m9-2V11a6 6 0 0 0-12 0v4l-2 2h16l-2-2"/>`
  };

  return `
    <button onclick="${ekintza}">
      <svg viewBox="0 0 24 24">${ikonoak[mota]}</svg>
      <span>${babestu(testua)}</span>
    </button>
  `;
}

async function ordutegiaIkusi() {
  document.getElementById("edukia").innerHTML = `
    <button class="atzera-botoia" onclick="erakutsiAtala('gehiago')">← Gehiago</button>
    <div class="orrialde-goiburua"><h2>Ordutegia</h2></div>

    <article class="txartela">
      <h3>Eskola Kirola</h3>
      <a href="images/eskola-kirola-ordutegia.png" target="_blank" rel="noopener">
        <img src="images/eskola-kirola-ordutegia.png" class="irudiHandia" alt="Eskola Kirola 2026-2027 ordutegia">
      </a>
    </article>

    <article class="txartela">
      <h3>Psikomotrizitatea</h3>
      <a href="images/psikomotrizitatea-ordutegia.png" target="_blank" rel="noopener">
        <img src="images/psikomotrizitatea-ordutegia.png" class="irudiHandia" alt="Psikomotrizitatea 2026-2027 ordutegia">
      </a>
    </article>
  `;
}

function instalazioCalendarTxartela(izena, calendarId) {
  const src = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=Europe%2FMadrid&mode=AGENDA`;
  return `
    <article class="txartela" style="padding:0; overflow:hidden; margin-bottom:16px;">
      <div style="padding:14px 16px 10px;"><h3 style="margin:0;">${babestu(izena)}</h3></div>
      <iframe
        src="${src}"
        title="${babestu(izena)}"
        style="width:100%; height:60vh; min-height:480px; border:0; display:block; background:#fff;"
        frameborder="0"
        scrolling="no">
      </iframe>
    </article>
  `;
}

async function kokalekuakIkusi() {
  document.getElementById("edukia").innerHTML = `
    <button class="atzera-botoia" onclick="erakutsiAtala('gehiago')">← Gehiago</button>
    <div class="orrialde-goiburua">
      <h2>Instalazioak</h2>
      <p>Talde bakoitzaren instalazioen egutegiak eta psikomotrizitateko txandak.</p>
    </div>

    <section style="margin-bottom:28px;">
      <h2 style="margin:0 0 12px;">LH1 · LH2 · LH3 · LH4</h2>
      ${instalazioCalendarTxartela("Talde berdea", "b28451ff946a9b6333f1cc054eb8d263feec1b96c8440ca9ce4414e669d854c2@group.calendar.google.com")}
      ${instalazioCalendarTxartela("Talde laranja", "c34a07e7f122238624391124241a4808282ada68834081a193f9dc26ab7c9973@group.calendar.google.com")}
    </section>

    <section style="margin-bottom:28px;">
      <h2 style="margin:0 0 12px;">LH5</h2>
      ${instalazioCalendarTxartela("Talde arrosa", "160dc75ac739d6e5355f3e19e19e58ce0908538750b43ce8fd4654e41a0d7c08@group.calendar.google.com")}
      ${instalazioCalendarTxartela("Talde horia", "e7ab91b58c9831564d3376108b910dea500445f0af259fe40dd0974fde95e421@group.calendar.google.com")}
      ${instalazioCalendarTxartela("Talde morea", "a2f0cbcc2d270daf898d9e7d090ef99e537a90b9ec774a1c317860b3c48dd2c7@group.calendar.google.com")}
    </section>

    <section style="margin-bottom:28px;">
      <h2 style="margin:0 0 12px;">LH6</h2>
      ${instalazioCalendarTxartela("LH6 instalazioak", "41f5c31499b3ad6d31646515b6c4c4f56a589c93bf1d9b3a0e200a033584bfc5@group.calendar.google.com")}
    </section>

    <section>
      <h2 style="margin:0 0 12px;">Psikomotrizitatea</h2>
      <article class="txartela">
        <h3>HH3 txandak</h3>
        <a href="images/hh3-txandak.png" target="_blank" rel="noopener">
          <img src="images/hh3-txandak.png" class="irudiHandia" alt="HH3 egutegi txandak">
        </a>
      </article>
      <article class="txartela">
        <h3>HH5 txandak</h3>
        <a href="images/hh5-txandak.png" target="_blank" rel="noopener">
          <img src="images/hh5-txandak.png" class="irudiHandia" alt="HH5 egutegi txandak">
        </a>
      </article>
    </section>
  `;
}

async function irudiAtalaIkusi(sheetIzena, izenburua) {
  kargatzenErakutsi();

  try {
    const json = await sheetKargatu(sheetIzena);
    let irudiIzenburua = "";
    let irudia = "";

    json.table.rows.forEach(row => {
      const iz = garbitu(gelaxka(row, 0));
      const url = garbitu(gelaxka(row, 1));

      if (iz && url && !goiburuaDa(iz, "Izenburua")) {
        irudiIzenburua = iz;
        irudia = url;
      }
    });

    document.getElementById("edukia").innerHTML = `
      <button class="atzera-botoia" onclick="erakutsiAtala('gehiago')">← Gehiago</button>
      <div class="orrialde-goiburua"><h2>${babestu(irudiIzenburua || izenburua)}</h2></div>
      ${irudia
        ? `<a href="${babestu(irudia)}" target="_blank" rel="noopener">
             <img src="${babestu(irudia)}" class="irudiHandia" alt="${babestu(irudiIzenburua || izenburua)}">
           </a>`
        : `<article class="txartela"><p>Oraindik ez da irudirik gehitu.</p></article>`}
    `;
  } catch (error) {
    document.getElementById("edukia").innerHTML = erroreTxartela(izenburua, error);
  }
}

function erroreTxartela(izenburua, error) {
  return `
    <div class="orrialde-goiburua"><h2>${babestu(izenburua)}</h2></div>
    <article class="txartela">
      <p>Ezin izan da edukia kargatu.</p>
      <small>${babestu(error?.message || "Errore ezezaguna")}</small>
    </article>
  `;
}