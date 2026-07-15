const SHEET_ID = "14HT9OC7slKCsJrVNCLMcTaJPPYDfcgw3VKhLMO-6Xfo";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwV1hubdsBkgs4ZjLBqS6K8Ut-8_Dgw7CxO_kJkUAjEkBuQUwPIFOd6XaIxirVVDnd_qg/exec";

function erakutsiAtala(atala) {
  const edukia = document.getElementById("edukia");

  if (atala === "hasiera") hasieraIkusi();
  if (atala === "abisuak") kargatuAbisuak();

  if (["LH3", "LH4", "LH5", "DBH"].includes(atala)) {
    edukia.innerHTML = `
      <h2>${atala}</h2>
      <button onclick="ordutegiaIkusi('${atala}')">📅 Ordutegia</button>
      <button onclick="kokalekuakIkusi('${atala}')">📍 Kokalekuak</button>
      <button onclick="partaideakIkusi('${atala}')">👥 Partaideak</button>
      <button onclick="asistentziaIkusi('${atala}')">✅ Asistentzia</button>
    `;
  }

  if (atala === "dokumentuak") dokumentuakIkusi();
  if (atala === "protokoloak") protokoloakIkusi();
}

async function sheetKargatu(sheetIzena) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetIzena}`;
  const erantzuna = await fetch(url);
  const testua = await erantzuna.text();
  const jsonText = testua.substring(testua.indexOf("{"), testua.lastIndexOf("}") + 1);
  return JSON.parse(jsonText);
}

function gelaxka(row, index) {
  if (!row.c[index]) return "";
  return row.c[index].f || row.c[index].v || "";
}

function gaurISO() {
  return new Date().toISOString().split("T")[0];
}

function dataNormalizatu(data) {
  if (!data) return "";

  const testua = String(data);

  if (testua.includes("-")) {
    return testua.substring(0, 10);
  }

  const match = testua.match(/Date\((\d+),(\d+),(\d+)\)/);
  if (match) {
    const urtea = match[1];
    const hilabetea = String(Number(match[2]) + 1).padStart(2, "0");
    const eguna = String(match[3]).padStart(2, "0");
    return `${urtea}-${hilabetea}-${eguna}`;
  }

  return testua;
}

async function hasieraIkusi() {
  const edukia = document.getElementById("edukia");
  edukia.innerHTML = "<p>Hasiera kargatzen...</p>";

  try {
    const abisuak = await sheetKargatu("Abisuak");
    const partaideak = await sheetKargatu("Partaideak");
    const asistentzia = await sheetKargatu("Asistentzia");

    const gaur = gaurISO();
    const gaurIkusgai = new Date().toLocaleDateString("eu-ES");
    const taldeak = ["LH3", "LH4", "LH5", "DBH"];

    let html = `
      <h2>🏠 Hasiera</h2>

      <div class="txartela">
        <h3>📅 Gaur</h3>
        <p>${gaurIkusgai}</p>
      </div>

      <h3>📊 Gaurko asistentzia</h3>
    `;

    taldeak.forEach(taldea => {
      let guztira = 0;
      const gaurBertan = new Set();

      partaideak.table.rows.forEach(row => {
        const taldeaSheet = gelaxka(row, 1);
        const izena = gelaxka(row, 2);

        if (taldeaSheet === taldea && izena && izena.toLowerCase() !== "izena") {
          guztira++;
        }
      });

      asistentzia.table.rows.forEach(row => {
        const data = dataNormalizatu(gelaxka(row, 0));
        const taldeaSheet = gelaxka(row, 1);
        const id = gelaxka(row, 2);
        const asistentziaBalioa = gelaxka(row, 4);

        if (
          data === gaur &&
          taldeaSheet === taldea &&
          asistentziaBalioa === "Bai"
        ) {
          gaurBertan.add(id);
        }
      });

      html += `
        <div class="txartela">
          <h3>${taldea}</h3>
          <p><strong>${gaurBertan.size}/${guztira}</strong> bertan gaur</p>
        </div>
      `;
    });

    html += `<h3>📢 Azken abisuak</h3>`;

    abisuak.table.rows.slice(-3).reverse().forEach(row => {
      const izenburua = gelaxka(row, 1);
      const mezua = gelaxka(row, 2);

      if (izenburua && izenburua.toLowerCase() !== "izenburua") {
        html += `
          <div class="txartela">
            <h3>${izenburua}</h3>
            <p>${mezua}</p>
          </div>
        `;
      }
    });

    html += `<h3>⚠️ Alergiak dituzten partaideak</h3>`;

    partaideak.table.rows.forEach(row => {
      const taldea = gelaxka(row, 1);
      const izena = gelaxka(row, 2);
      const alergiak = gelaxka(row, 5);

      if (izena && alergiak && alergiak.toLowerCase() !== "alergiak") {
        html += `
          <div class="txartela">
            <h3>${izena}</h3>
            <p><strong>Taldea:</strong> ${taldea}</p>
            <p><strong>Alergiak:</strong> ${alergiak}</p>
          </div>
        `;
      }
    });

    edukia.innerHTML = html;

  } catch (error) {
    edukia.innerHTML = `
      <p>Ezin izan da hasiera kargatu.</p>
      <small>${error}</small>
    `;
  }
}

async function kargatuAbisuak() {
  const edukia = document.getElementById("edukia");
  edukia.innerHTML = "<p>Abisuak kargatzen...</p>";

  try {
    const json = await sheetKargatu("Abisuak");
    let html = "<h2>📢 Abisuak</h2>";

    json.table.rows.forEach(row => {
      const data = gelaxka(row, 0);
      const izenburua = gelaxka(row, 1);
      const mezua = gelaxka(row, 2);
      const taldea = gelaxka(row, 3);

      if (izenburua && izenburua.toLowerCase() !== "izenburua") {
        html += `
          <div class="txartela">
            <h3>${izenburua}</h3>
            <p>${mezua}</p>
            <small>${data} · ${taldea}</small>
          </div>
        `;
      }
    });

    edukia.innerHTML = html;
  } catch (error) {
    edukia.innerHTML = `<p>Ezin izan dira abisuak kargatu.</p><small>${error}</small>`;
  }
}

async function ordutegiaIkusi(taldea) {
  const edukia = document.getElementById("edukia");

  const ordutegiak = {
    LH3: "images/lh3-ordutegia.jpg",
    LH4: "images/lh4-ordutegia.jpg",
    LH5: "images/lh5-ordutegia.jpg",
    DBH: "images/dbh-ordutegia.jpg"
  };

  const irudia = ordutegiak[taldea];

  edukia.innerHTML = irudia
    ? `<h2>${taldea} - Ordutegia</h2><img src="${irudia}" class="irudiHandia">`
    : `<h2>${taldea} - Ordutegia</h2><p>Ez da ordutegirik aurkitu.</p>`;
}
async function kokalekuakIkusi(taldea) {
  const edukia = document.getElementById("edukia");
  edukia.innerHTML = `<p>${taldea} taldeko kokalekuak kargatzen...</p>`;

  try {
    const json = await sheetKargatu("Kokalekuak");
    let irudia = "";

    json.table.rows.forEach(row => {
      if (gelaxka(row, 0) === taldea) irudia = gelaxka(row, 1);
    });

    edukia.innerHTML = irudia
      ? `<h2>${taldea} - Kokalekuak</h2><img src="${irudia}" class="irudiHandia">`
      : `<h2>${taldea} - Kokalekuak</h2><p>Ez da kokalekurik aurkitu.</p>`;
  } catch (error) {
    edukia.innerHTML = `<p>Ezin izan dira kokalekuak kargatu.</p><small>${error}</small>`;
  }
}

async function partaideakIkusi(taldea) {
  const edukia = document.getElementById("edukia");
  edukia.innerHTML = `<p>${taldea} taldeko partaideak kargatzen...</p>`;

  try {
    const json = await sheetKargatu("Partaideak");

    let html = `
      <h2>${taldea} - Partaideak</h2>
      <input type="text" id="bilatzailea" placeholder="Bilatu izena..." onkeyup="bilatuPartaideak()">
      <div id="partaideZerrenda">
    `;

    json.table.rows.forEach(row => {
      const id = gelaxka(row, 0);
      const taldeaSheet = gelaxka(row, 1);
      const izena = gelaxka(row, 2);
      const tutorea = gelaxka(row, 3);
      const telefonoa = gelaxka(row, 4);
      const alergiak = gelaxka(row, 5);
      const beldurrak = gelaxka(row, 6);
      const baimenak = gelaxka(row, 7);

      if (taldeaSheet === taldea && izena) {
        html += `
          <div class="txartela partaide-txartela">
            <h3>${izena}</h3>
            <p><strong>Tutorea:</strong> ${tutorea}</p>
            <p><strong>Telefonoa:</strong> <a href="tel:${telefonoa}">${telefonoa}</a></p>
            <p><strong>Alergiak:</strong> ${alergiak}</p>
            <p><strong>Beldurrak:</strong> ${beldurrak}</p>
            <p><strong>Baimenak:</strong> ${baimenak}</p>
            <small>ID: ${id}</small>
          </div>
        `;
      }
    });

    html += `</div>`;
    edukia.innerHTML = html;
  } catch (error) {
    edukia.innerHTML = `<p>Ezin izan dira partaideak kargatu.</p><small>${error}</small>`;
  }
}

function bilatuPartaideak() {
  const input = document.getElementById("bilatzailea").value.toLowerCase();
  const txartelak = document.querySelectorAll(".partaide-txartela");

  txartelak.forEach(txartela => {
    const testua = txartela.innerText.toLowerCase();
    txartela.style.display = testua.includes(input) ? "block" : "none";
  });
}

async function asistentziaIkusi(taldea) {
  const edukia = document.getElementById("edukia");
  edukia.innerHTML = `<p>${taldea} taldeko asistentzia kargatzen...</p>`;

  try {
    const json = await sheetKargatu("Partaideak");

    let html = `
      <h2>${taldea} - Asistentzia</h2>
      <p>Markatu haur bakoitzaren asistentzia:</p>
    `;

    json.table.rows.forEach(row => {
      const id = gelaxka(row, 0);
      const taldeaSheet = gelaxka(row, 1);
      const izena = gelaxka(row, 2);

      if (taldeaSheet === taldea && izena) {
        html += `
          <div class="txartela" id="asistentzia-${id}">
            <h3>${izena}</h3>
            <button onclick="gordeAsistentzia('${taldea}', '${id}', '${izena}', 'Bai')">✅ Bertan</button>
            <button onclick="gordeAsistentzia('${taldea}', '${id}', '${izena}', 'Ez')">❌ Ez dago</button>
          </div>
        `;
      }
    });

    edukia.innerHTML = html;
  } catch (error) {
    edukia.innerHTML = `<p>Ezin izan da asistentzia kargatu.</p><small>${error}</small>`;
  }
}

async function gordeAsistentzia(taldea, id, izena, asistentzia) {
  const gaur = gaurISO();
  const txartela = document.getElementById(`asistentzia-${id}`);

  txartela.innerHTML = `<h3>${izena}</h3><p><strong>Gordetzen...</strong></p>`;

  const datuak = {
    data: gaur,
    taldea: taldea,
    id: id,
    izena: izena,
    asistentzia: asistentzia
  };

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datuak)
    });

    txartela.innerHTML = `<h3>${izena}</h3><p><strong>✔ ${asistentzia}</strong></p>`;
  } catch (error) {
    txartela.innerHTML = `
      <h3>${izena}</h3>
      <p><strong>Errorea gordetzean</strong></p>
      <button onclick="gordeAsistentzia('${taldea}', '${id}', '${izena}', '${asistentzia}')">Saiatu berriro</button>
    `;
  }
}

async function dokumentuakIkusi() {
  const edukia = document.getElementById("edukia");
  edukia.innerHTML = "<p>Dokumentuak kargatzen...</p>";

  try {
    const json = await sheetKargatu("Dokumentuak");
    let html = `<h2>📄 Dokumentuak</h2>`;

    json.table.rows.forEach(row => {
      const izenburua = gelaxka(row, 0);
      const esteka = gelaxka(row, 1);

      if (izenburua && esteka && izenburua.toLowerCase() !== "izenburua") {
        html += `
          <div class="txartela">
            <a href="${esteka}" target="_blank">📄 ${izenburua}</a>
          </div>
        `;
      }
    });

    edukia.innerHTML = html;
  } catch (error) {
    edukia.innerHTML = `<p>Ezin izan dira dokumentuak kargatu.</p><small>${error}</small>`;
  }
}

async function protokoloakIkusi() {
  const edukia = document.getElementById("edukia");
  edukia.innerHTML = "<p>Protokoloak kargatzen...</p>";

  try {
    const json = await sheetKargatu("Protokoloak");
    let html = `<h2>📋 Protokoloak</h2>`;

    json.table.rows.forEach(row => {
      const izenburua = gelaxka(row, 0);
      const esteka = gelaxka(row, 1);

      if (izenburua && esteka && izenburua.toLowerCase() !== "izenburua") {
        html += `
          <div class="txartela">
            <a href="${esteka}" target="_blank">📋 ${izenburua}</a>
          </div>
        `;
      }
    });

    edukia.innerHTML = html;
  } catch (error) {
    edukia.innerHTML = `<p>Ezin izan dira protokoloak kargatu.</p><small>${error}</small>`;
  }
}
