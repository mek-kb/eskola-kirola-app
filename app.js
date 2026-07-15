const SHEET_ID =
  "1ResFVm5rBVHrt25QYdZTIWFy8hGwD-EkKz2BKa5ww-0";

const TALDEAK = {
  "Psikomotrizitatea": ["HH3", "HH4", "HH5"],
  "Jolas Hezi": ["LH1", "LH2"],
  "Multikirola": ["LH3", "LH4", "LH5", "LH6"]
};

/*
  Google Calendarreko estekak gero sartuko ditugu.
  Momentuz hutsik uzten ditugu.
*/
const IKASTURTEKO_EGUTEGIA_URL = "";
const BEGIRALEEN_EGUTEGIA_URL = "";


/* =========================================
   MENU NAGUSIA
========================================= */

function erakutsiAtala(atala) {
  if (atala === "hasiera") {
    hasieraIkusi();
    return;
  }

  if (atala === "abisuak") {
    abisuakIkusi();
    return;
  }

  if (atala === "ordutegia") {
    ordutegiaIkusi();
    return;
  }

  if (atala === "kokalekuak") {
    kokalekuakIkusi();
    return;
  }

  if (atala === "ikasturtekoEgutegia") {
    ikasturtekoEgutegiaIkusi();
    return;
  }

  if (atala === "begiraleenEgutegia") {
    begiraleenEgutegiaIkusi();
    return;
  }

  if (atala === "taldeak") {
    taldeakIkusi();
    return;
  }

  if (atala === "dokumentuak") {
    dokumentuakIkusi();
    return;
  }

  if (atala === "protokoloak") {
    protokoloakIkusi();
  }
}


/* =========================================
   GOOGLE SHEET IRAKURRI
========================================= */

async function sheetKargatu(sheetIzena) {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}` +
    `/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetIzena)}`;

  const erantzuna = await fetch(url, {
    cache: "no-store"
  });

  if (!erantzuna.ok) {
    throw new Error(`Ezin izan da ${sheetIzena} fitxa irakurri.`);
  }

  const testua = await erantzuna.text();

  const hasiera = testua.indexOf("{");
  const amaiera = testua.lastIndexOf("}") + 1;

  if (hasiera === -1 || amaiera === 0) {
    throw new Error("Google Sheet-eko erantzuna ez da zuzena.");
  }

  return JSON.parse(testua.substring(hasiera, amaiera));
}


function gelaxka(row, index) {
  if (!row?.c?.[index]) {
    return "";
  }

  return row.c[index].f ?? row.c[index].v ?? "";
}


function testuaGarbitu(testua) {
  return String(testua ?? "").trim();
}


function htmlBabestu(testua) {
  return String(testua ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function goiburuaDa(testua, goiburua) {
  return testuaGarbitu(testua).toLowerCase() ===
    goiburua.toLowerCase();
}


/* =========================================
   HASIERA
========================================= */

async function hasieraIkusi() {
  const edukia = document.getElementById("edukia");

  edukia.innerHTML = "<p>Hasiera kargatzen...</p>";

  try {
    const [abisuak, partaideak] = await Promise.all([
      sheetKargatu("Abisuak"),
      sheetKargatu("Partaideak")
    ]);

    const gaur = new Date().toLocaleDateString("eu-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const taldeKopuruak = {};

    Object.values(TALDEAK)
      .flat()
      .forEach(taldea => {
        taldeKopuruak[taldea] = 0;
      });

    const alergiakDituztenak = [];

    partaideak.table.rows.forEach(row => {
      const taldea = testuaGarbitu(gelaxka(row, 1));
      const izena = testuaGarbitu(gelaxka(row, 2));
      const alergiak = testuaGarbitu(gelaxka(row, 5));

      if (!izena || goiburuaDa(izena, "Izena")) {
        return;
      }

      if (taldeKopuruak[taldea] !== undefined) {
        taldeKopuruak[taldea]++;
      }

      if (
        alergiak &&
        !goiburuaDa(alergiak, "Alergiak") &&
        alergiak.toLowerCase() !== "ez" &&
        alergiak.toLowerCase() !== "ez dauka" &&
        alergiak.toLowerCase() !== "bat ere ez"
      ) {
        alergiakDituztenak.push({
          taldea,
          izena,
          alergiak
        });
      }
    });

    const abisuZerrenda = abisuak.table.rows
      .filter(row => {
        const izenburua = testuaGarbitu(gelaxka(row, 1));

        return izenburua &&
          !goiburuaDa(izenburua, "Izenburua");
      })
      .slice(-3)
      .reverse();

    let html = `
      <h2>🏠 Hasiera</h2>

      <div class="txartela">
        <h3>📅 Gaur</h3>
        <p>${htmlBabestu(gaur)}</p>
      </div>

      <h3>👥 Partaide kopurua</h3>

      <div class="talde-laburpena">
    `;

    Object.entries(taldeKopuruak).forEach(([taldea, kopurua]) => {
      html += `
        <button
          class="talde-kopurua"
          onclick="partaideakIkusi('${taldea}')"
        >
          <strong>${taldea}</strong>
          <span>${kopurua} partaide</span>
        </button>
      `;
    });

    html += `</div>`;

    html += `<h3>📢 Azken abisuak</h3>`;

    if (abisuZerrenda.length === 0) {
      html += `
        <div class="txartela">
          <p>Ez dago abisurik.</p>
        </div>
      `;
    }

    abisuZerrenda.forEach(row => {
      const data = gelaxka(row, 0);
      const izenburua = gelaxka(row, 1);
      const mezua = gelaxka(row, 2);
      const taldea = gelaxka(row, 3);

      html += `
        <div class="txartela">
          <h3>${htmlBabestu(izenburua)}</h3>
          <p>${htmlBabestu(mezua)}</p>

          <small>
            ${htmlBabestu(data)}
            ${taldea ? ` · ${htmlBabestu(taldea)}` : ""}
          </small>
        </div>
      `;
    });

    html += `<h3>⚠️ Alergiak</h3>`;

    if (alergiakDituztenak.length === 0) {
      html += `
        <div class="txartela">
          <p>Ez dago alergiarik erregistratuta.</p>
        </div>
      `;
    }

    alergiakDituztenak.forEach(partaidea => {
      html += `
        <div class="txartela alergia-txartela">
          <h3>${htmlBabestu(partaidea.izena)}</h3>

          <p>
            <strong>Taldea:</strong>
            ${htmlBabestu(partaidea.taldea)}
          </p>

          <p>
            <strong>Alergiak:</strong>
            ${htmlBabestu(partaidea.alergiak)}
          </p>
        </div>
      `;
    });

    edukia.innerHTML = html;

  } catch (error) {
    edukia.innerHTML = `
      <h2>🏠 Hasiera</h2>
      <p>Ezin izan da hasierako informazioa kargatu.</p>
      <small>${htmlBabestu(error.message)}</small>
    `;
  }
}


/* =========================================
   ABISUAK
========================================= */

async function abisuakIkusi() {
  const edukia = document.getElementById("edukia");

  edukia.innerHTML = "<p>Abisuak kargatzen...</p>";

  try {
    const json = await sheetKargatu("Abisuak");

    let html = `<h2>📢 Abisuak</h2>`;
    let kopurua = 0;

    json.table.rows
      .slice()
      .reverse()
      .forEach(row => {
        const data = testuaGarbitu(gelaxka(row, 0));
        const izenburua = testuaGarbitu(gelaxka(row, 1));
        const mezua = testuaGarbitu(gelaxka(row, 2));
        const taldea = testuaGarbitu(gelaxka(row, 3));

        if (
          !izenburua ||
          goiburuaDa(izenburua, "Izenburua")
        ) {
          return;
        }

        kopurua++;

        html += `
          <div class="txartela">
            <h3>${htmlBabestu(izenburua)}</h3>
            <p>${htmlBabestu(mezua)}</p>

            <small>
              ${htmlBabestu(data)}
              ${taldea ? ` · ${htmlBabestu(taldea)}` : ""}
            </small>
          </div>
        `;
      });

    if (kopurua === 0) {
      html += `
        <div class="txartela">
          <p>Ez dago abisurik.</p>
        </div>
      `;
    }

    edukia.innerHTML = html;

  } catch (error) {
    edukia.innerHTML = `
      <h2>📢 Abisuak</h2>
      <p>Ezin izan dira abisuak kargatu.</p>
      <small>${htmlBabestu(error.message)}</small>
    `;
  }
}


/* =========================================
   ORDUTEGI OROKORRA
========================================= */

async function ordutegiaIkusi() {
  const edukia = document.getElementById("edukia");

  edukia.innerHTML = "<p>Ordutegia kargatzen...</p>";

  try {
    const json = await sheetKargatu("Ordutegia");

    let izenburua = "";
    let irudia = "";

    json.table.rows.forEach(row => {
      const izenburuaSheet = testuaGarbitu(gelaxka(row, 0));
      const irudiaSheet = testuaGarbitu(gelaxka(row, 1));

      if (
        izenburuaSheet &&
        irudiaSheet &&
        !goiburuaDa(izenburuaSheet, "Izenburua")
      ) {
        izenburua = izenburuaSheet;
        irudia = irudiaSheet;
      }
    });

    edukia.innerHTML = irudia
      ? `
        <h2>📅 ${htmlBabestu(izenburua || "Ordutegia")}</h2>

        <a href="${htmlBabestu(irudia)}" target="_blank">
          <img
            src="${htmlBabestu(irudia)}"
            class="irudiHandia"
            alt="${htmlBabestu(izenburua || "Ordutegia")}"
          >
        </a>
      `
      : `
        <h2>📅 Ordutegia</h2>
        <p>Oraindik ez da ordutegirik gehitu.</p>
      `;

  } catch (error) {
    edukia.innerHTML = `
      <h2>📅 Ordutegia</h2>
      <p>Ezin izan da ordutegia kargatu.</p>
      <small>${htmlBabestu(error.message)}</small>
    `;
  }
}


/* =========================================
   KOKALEKU OROKORRAK
========================================= */

async function kokalekuakIkusi() {
  const edukia = document.getElementById("edukia");

  edukia.innerHTML = "<p>Kokalekuak kargatzen...</p>";

  try {
    const json = await sheetKargatu("Kokalekuak");

    let izenburua = "";
    let irudia = "";

    json.table.rows.forEach(row => {
      const izenburuaSheet = testuaGarbitu(gelaxka(row, 0));
      const irudiaSheet = testuaGarbitu(gelaxka(row, 1));

      if (
        izenburuaSheet &&
        irudiaSheet &&
        !goiburuaDa(izenburuaSheet, "Izenburua")
      ) {
        izenburua = izenburuaSheet;
        irudia = irudiaSheet;
      }
    });

    edukia.innerHTML = irudia
      ? `
        <h2>📍 ${htmlBabestu(izenburua || "Kokalekuak")}</h2>

        <a href="${htmlBabestu(irudia)}" target="_blank">
          <img
            src="${htmlBabestu(irudia)}"
            class="irudiHandia"
            alt="${htmlBabestu(izenburua || "Kokalekuak")}"
          >
        </a>
      `
      : `
        <h2>📍 Kokalekuak</h2>
        <p>Oraindik ez da kokalekuen irudirik gehitu.</p>
      `;

  } catch (error) {
    edukia.innerHTML = `
      <h2>📍 Kokalekuak</h2>
      <p>Ezin izan dira kokalekuak kargatu.</p>
      <small>${htmlBabestu(error.message)}</small>
    `;
  }
}


/* =========================================
   EGUTEGIAK
========================================= */

function ikasturtekoEgutegiaIkusi() {
  const edukia = document.getElementById("edukia");

  if (!IKASTURTEKO_EGUTEGIA_URL) {
    edukia.innerHTML = `
      <h2>🗓️ Ikasturteko egutegia</h2>

      <div class="txartela">
        <p>
          Google Calendarreko egutegia oraindik ez dago lotuta.
        </p>
      </div>
    `;

    return;
  }

  edukia.innerHTML = `
    <h2>🗓️ Ikasturteko egutegia</h2>

    <div class="txartela">
      <a
        class="esteka-botoia"
        href="${htmlBabestu(IKASTURTEKO_EGUTEGIA_URL)}"
        target="_blank"
        rel="noopener"
      >
        🗓️ Egutegia ireki
      </a>
    </div>
  `;
}


function begiraleenEgutegiaIkusi() {
  const edukia = document.getElementById("edukia");

  if (!BEGIRALEEN_EGUTEGIA_URL) {
    edukia.innerHTML = `
      <h2>👨‍🏫 Begiraleen egutegia</h2>

      <div class="txartela">
        <p>
          Google Calendarreko egutegia oraindik ez dago lotuta.
        </p>
      </div>
    `;

    return;
  }

  edukia.innerHTML = `
    <h2>👨‍🏫 Begiraleen egutegia</h2>

    <div class="txartela">
      <a
        class="esteka-botoia"
        href="${htmlBabestu(BEGIRALEEN_EGUTEGIA_URL)}"
        target="_blank"
        rel="noopener"
      >
        👨‍🏫 Egutegia ireki
      </a>
    </div>
  `;
}


/* =========================================
   TALDEAK
========================================= */

function taldeakIkusi() {
  const edukia = document.getElementById("edukia");

  let html = `<h2>👥 Taldeak</h2>`;

  Object.entries(TALDEAK).forEach(([programa, taldeak]) => {
    html += `
      <section class="programa-atala">
        <h3>${htmlBabestu(programa)}</h3>

        <div class="talde-botoiak">
    `;

    taldeak.forEach(taldea => {
      html += `
        <button onclick="partaideakIkusi('${taldea}')">
          👥 ${taldea}
        </button>
      `;
    });

    html += `
        </div>
      </section>
    `;
  });

  edukia.innerHTML = html;
}


/* =========================================
   PARTAIDEAK
========================================= */

async function partaideakIkusi(taldea) {
  const edukia = document.getElementById("edukia");

  edukia.innerHTML =
    `<p>${htmlBabestu(taldea)} taldeko partaideak kargatzen...</p>`;

  try {
    const json = await sheetKargatu("Partaideak");

    let html = `
      <div class="atal-goiburua">
        <button
          class="atzera-botoia"
          onclick="taldeakIkusi()"
        >
          ← Taldeak
        </button>

        <h2>👥 ${htmlBabestu(taldea)} – Partaideak</h2>
      </div>

      <input
        type="search"
        id="bilatzailea"
        placeholder="Bilatu partaidea..."
        oninput="bilatuPartaideak()"
        autocomplete="off"
      >

      <div id="partaideZerrenda">
    `;

    let kopurua = 0;

    json.table.rows.forEach(row => {
      const id = testuaGarbitu(gelaxka(row, 0));
      const taldeaSheet = testuaGarbitu(gelaxka(row, 1));
      const izena = testuaGarbitu(gelaxka(row, 2));
      const tutorea = testuaGarbitu(gelaxka(row, 3));
      const telefonoa = testuaGarbitu(gelaxka(row, 4));
      const alergiak = testuaGarbitu(gelaxka(row, 5));
      const beldurrak = testuaGarbitu(gelaxka(row, 6));
      const baimenak = testuaGarbitu(gelaxka(row, 7));

      if (
        taldeaSheet !== taldea ||
        !izena ||
        goiburuaDa(izena, "Izena")
      ) {
        return;
      }

      kopurua++;

      const telefonoGarbitua =
        telefonoa.replace(/[^\d+]/g, "");

      html += `
        <article class="txartela partaide-txartela">
          <h3>${htmlBabestu(izena)}</h3>

          <p>
            <strong>Tutorea:</strong>
            ${htmlBabestu(tutorea || "—")}
          </p>

          <p>
            <strong>Telefonoa:</strong>

            ${
              telefonoa
                ? `
                  <a href="tel:${htmlBabestu(telefonoGarbitua)}">
                    ${htmlBabestu(telefonoa)}
                  </a>
                `
                : "—"
            }
          </p>

          <p>
            <strong>Alergiak:</strong>
            ${htmlBabestu(alergiak || "—")}
          </p>

          <p>
            <strong>Beldurrak:</strong>
            ${htmlBabestu(beldurrak || "—")}
          </p>

          <p>
            <strong>Baimenak:</strong>
            ${htmlBabestu(baimenak || "—")}
          </p>

          <small>ID: ${htmlBabestu(id)}</small>
        </article>
      `;
    });

    html += `</div>`;

    if (kopurua === 0) {
      html += `
        <div class="txartela">
          <p>
            Ez dago ${htmlBabestu(taldea)} taldeko partaiderik.
          </p>
        </div>
      `;
    }

    edukia.innerHTML = html;

  } catch (error) {
    edukia.innerHTML = `
      <h2>👥 ${htmlBabestu(taldea)} – Partaideak</h2>

      <p>Ezin izan dira partaideak kargatu.</p>

      <small>${htmlBabestu(error.message)}</small>
    `;
  }
}


function bilatuPartaideak() {
  const bilatzailea = document.getElementById("bilatzailea");

  if (!bilatzailea) {
    return;
  }

  const bilaketa = bilatzailea.value
    .toLowerCase()
    .trim();

  const txartelak =
    document.querySelectorAll(".partaide-txartela");

  txartelak.forEach(txartela => {
    const testua = txartela.innerText.toLowerCase();

    txartela.style.display =
      testua.includes(bilaketa) ? "block" : "none";
  });
}


/* =========================================
   DOKUMENTUAK
========================================= */

async function dokumentuakIkusi() {
  const edukia = document.getElementById("edukia");

  edukia.innerHTML = "<p>Dokumentuak kargatzen...</p>";

  try {
    const json = await sheetKargatu("Dokumentuak");

    let html = `<h2>📄 Dokumentuak</h2>`;
    let kopurua = 0;

    json.table.rows.forEach(row => {
      const izenburua = testuaGarbitu(gelaxka(row, 0));
      const esteka = testuaGarbitu(gelaxka(row, 1));

      if (
        !izenburua ||
        !esteka ||
        goiburuaDa(izenburua, "Izenburua")
      ) {
        return;
      }

      kopurua++;

      html += `
        <div class="txartela">
          <a
            class="esteka-botoia"
            href="${htmlBabestu(esteka)}"
            target="_blank"
            rel="noopener"
          >
            📄 ${htmlBabestu(izenburua)}
          </a>
        </div>
      `;
    });

    if (kopurua === 0) {
      html += `
        <div class="txartela">
          <p>Oraindik ez da dokumenturik gehitu.</p>
        </div>
      `;
    }

    edukia.innerHTML = html;

  } catch (error) {
    edukia.innerHTML = `
      <h2>📄 Dokumentuak</h2>
      <p>Ezin izan dira dokumentuak kargatu.</p>
      <small>${htmlBabestu(error.message)}</small>
    `;
  }
}


/* =========================================
   PROTOKOLOAK
========================================= */

async function protokoloakIkusi() {
  const edukia = document.getElementById("edukia");

  edukia.innerHTML = "<p>Protokoloak kargatzen...</p>";

  try {
    const json = await sheetKargatu("Protokoloak");

    let html = `<h2>📋 Protokoloak</h2>`;
    let kopurua = 0;

    json.table.rows.forEach(row => {
      const izenburua = testuaGarbitu(gelaxka(row, 0));
      const esteka = testuaGarbitu(gelaxka(row, 1));

      if (
        !izenburua ||
        !esteka ||
        goiburuaDa(izenburua, "Izenburua")
      ) {
        return;
      }

      kopurua++;

      html += `
        <div class="txartela">
          <a
            class="esteka-botoia"
            href="${htmlBabestu(esteka)}"
            target="_blank"
            rel="noopener"
          >
            📋 ${htmlBabestu(izenburua)}
          </a>
        </div>
      `;
    });

    if (kopurua === 0) {
      html += `
        <div class="txartela">
          <p>Oraindik ez da protokolorik gehitu.</p>
        </div>
      `;
    }

    edukia.innerHTML = html;

  } catch (error) {
    edukia.innerHTML = `
      <h2>📋 Protokoloak</h2>
      <p>Ezin izan dira protokoloak kargatu.</p>
      <small>${htmlBabestu(error.message)}</small>
    `;
  }
}
