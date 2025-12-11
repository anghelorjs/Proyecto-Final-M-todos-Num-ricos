// NumeriX Lab - Lógica principal
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupInterpolation();
  setupCG();
  setupSOR();
});

/* ------------------------ NAVEGACIÓN ENTRE MÉTODOS ------------------------ */
function setupTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  const sections = document.querySelectorAll(".method-section");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.target;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      sections.forEach((sec) => {
        sec.classList.toggle("active", sec.id === targetId);
      });
    });
  });
}

/* =============================== INTERPOLACIÓN ============================ */

function setupInterpolation() {
  const tbody = document.getElementById("interp-table-body");
  const addBtn = document.getElementById("interp-add-row");
  const removeBtn = document.getElementById("interp-remove-row");
  const exampleBtn = document.getElementById("interp-example");
  const calcBtn = document.getElementById("interp-calc");

  addBtn.addEventListener("click", () => addInterpRow());
  removeBtn.addEventListener("click", removeInterpRow);
  exampleBtn.addEventListener("click", loadInterpExample);
  calcBtn.addEventListener("click", computeInterpolation);

  // Carga un ejemplo por defecto al inicio
  loadInterpExample();
}

function addInterpRow(x = "", y = "") {
  const tbody = document.getElementById("interp-table-body");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="number" step="any" class="interp-x" value="${x}" /></td>
    <td><input type="number" step="any" class="interp-y" value="${y}" /></td>
  `;
  tbody.appendChild(tr);
}

function removeInterpRow() {
  const tbody = document.getElementById("interp-table-body");
  if (tbody.children.length > 1) {
    tbody.removeChild(tbody.lastElementChild);
  }
}

function loadInterpExample() {
  const tbody = document.getElementById("interp-table-body");
  tbody.innerHTML = "";

  // Ejemplo: hora (x) vs demanda (y) en MW
  const examplePoints = [
    { x: 8, y: 320 },   // 8:00
    { x: 10, y: 450 },  // 10:00
    { x: 12, y: 610 },  // 12:00
    { x: 16, y: 680 },  // 16:00
    { x: 20, y: 530 },  // 20:00
  ];

  examplePoints.forEach((p) => addInterpRow(p.x, p.y));
  document.getElementById("interp-x-eval").value = 13;
  updateInterpCounts();
  clearInterpOutput();
}

function clearInterpOutput() {
  document.getElementById("interp-equation").textContent =
    "Define puntos y pulsa \"Calcular interpolación\".";
  document.getElementById("interp-info").textContent = "";
  document.getElementById("interp-error").textContent = "";
}

function updateInterpCounts(n = null) {
  const tbody = document.getElementById("interp-table-body");
  const rows = tbody.querySelectorAll("tr");
  const numPoints = n !== null ? n : rows.length;

  document.getElementById("interp-num-points").textContent =
    "Puntos: " + numPoints;
  document.getElementById("interp-num-equations").textContent =
    "Ecuaciones: " + numPoints;
  document.getElementById("interp-num-unknowns").textContent =
    "Incógnitas (coeficientes): " + numPoints;
}

function computeInterpolation() {
  const xInputs = Array.from(document.querySelectorAll(".interp-x"));
  const yInputs = Array.from(document.querySelectorAll(".interp-y"));
  const errorDiv = document.getElementById("interp-error");
  const xEvalInput = document.getElementById("interp-x-eval");
  errorDiv.textContent = "";

  const xs = [];
  const ys = [];

  for (let i = 0; i < xInputs.length; i++) {
    const xVal = parseFloat(xInputs[i].value);
    const yVal = parseFloat(yInputs[i].value);

    if (isNaN(xVal) || isNaN(yVal)) continue;
    xs.push(xVal);
    ys.push(yVal);
  }

  if (xs.length < 2) {
    errorDiv.textContent = "Debes proporcionar al menos 2 puntos válidos.";
    clearInterpOutput();
    drawInterpolationPlot([], [], []);
    updateInterpCounts(xs.length);
    return;
  }

  // Ordenamos por x
  const combined = xs.map((x, i) => ({ x, y: ys[i] }));
  combined.sort((a, b) => a.x - b.x);
  const xsSorted = combined.map((p) => p.x);
  const ysSorted = combined.map((p) => p.y);

  // Verificar puntos duplicados
  for (let i = 1; i < xsSorted.length; i++) {
    if (xsSorted[i] === xsSorted[i - 1]) {
      errorDiv.textContent =
        "Hay puntos con el mismo valor de x. La interpolación polinómica requiere x distintas.";
      clearInterpOutput();
      drawInterpolationPlot([], [], []);
      return;
    }
  }

  updateInterpCounts(xsSorted.length);

  // Coeficientes de Newton
  const coeffs = newtonCoefficients(xsSorted, ysSorted);

  // Evaluamos en xEval
  const xEval = parseFloat(xEvalInput.value);
  let pEval = null;
  if (!isNaN(xEval)) {
    pEval = newtonEvaluate(xEval, xsSorted, coeffs);
  }

  // Mostrar ecuación
  const eqStr = buildNewtonEquationString(xsSorted, coeffs);
  document.getElementById("interp-equation").textContent = eqStr;

  // Gráfica
  drawInterpolationPlot(xsSorted, ysSorted, coeffs);

  // Info numérica
  const infoDiv = document.getElementById("interp-info");
  let html = "";
  html += `<p><strong>Polinomio de grado:</strong> ${xsSorted.length - 1}</p>`;
  if (!isNaN(xEval) && pEval !== null) {
    html += `<p><strong>Demanda estimada en x = ${xEval.toFixed(
      2
    )} h:</strong> ${pEval.toFixed(2)} MW</p>`;
  } else {
    html += `<p>Ingresa un valor de x para evaluar la demanda.</p>`;
  }
  html += `<p>Este polinomio fue construido con mediciones reales (hora, demanda) y puede usarse para estimar valores intermedios.</p>`;
  infoDiv.innerHTML = html;
}

// Cálculo de coeficientes de Newton (diferencias divididas)
function newtonCoefficients(xs, ys) {
  const n = xs.length;
  const dd = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    dd[i][0] = ys[i];
  }

  for (let j = 1; j < n; j++) {
    for (let i = 0; i < n - j; i++) {
      dd[i][j] = (dd[i + 1][j - 1] - dd[i][j - 1]) / (xs[i + j] - xs[i]);
    }
  }

  const coeffs = [];
  for (let j = 0; j < n; j++) {
    coeffs.push(dd[0][j]);
  }
  return coeffs;
}

// Evaluación del polinomio de Newton (forma de Horner)
function newtonEvaluate(x, xs, coeffs) {
  let n = coeffs.length;
  let result = coeffs[n - 1];
  for (let k = n - 2; k >= 0; k--) {
    result = result * (x - xs[k]) + coeffs[k];
  }
  return result;
}

function buildNewtonEquationString(xs, coeffs) {
  const n = coeffs.length;
  const terms = [];

  for (let i = 0; i < n; i++) {
    let c = coeffs[i];
    if (Math.abs(c) < 1e-10) continue;

    let term = c.toFixed(4);
    if (i >= 1) {
      const factors = [];
      for (let j = 0; j < i; j++) {
        const xj = xs[j].toFixed(2);
        factors.push(`(x - ${xj})`);
      }
      term += "·" + factors.join("·");
    }
    terms.push(term);
  }

  if (terms.length === 0) return "p(x) = 0";

  // Ajuste simple de signos (para evitar "+ -a")
  let eq = "p(x) = ";
  eq += terms
    .map((t, idx) => {
      if (idx === 0) return t;
      if (t.trim().startsWith("-")) {
        return " - " + t.trim().slice(1);
      }
      return " + " + t.trim();
    })
    .join("");

  return eq;
}

// Dibujo en canvas
function drawInterpolationPlot(xs, ys, coeffs) {
  const canvas = document.getElementById("interp-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // Fondo
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#020617");
  gradient.addColorStop(1, "#020617");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Si no hay datos, mostrar mensaje sutil
  if (!xs || xs.length === 0) {
    ctx.fillStyle = "#64748b";
    ctx.font = "12px 'Space Grotesk'";
    ctx.fillText("Sin datos suficientes para graficar.", 20, height / 2);
    return;
  }

  const margin = 40;
  const plotWidth = width - 2 * margin;
  const plotHeight = height - 2 * margin;

  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);

  if (minX === maxX) {
    minX -= 1;
    maxX += 1;
  }
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }

  const scaleX = (x) =>
    margin + ((x - minX) / (maxX - minX)) * plotWidth;
  const scaleY = (y) =>
    margin + (1 - (y - minY) / (maxY - minY)) * plotHeight;

  // Ejes
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(margin, margin, plotWidth, plotHeight);
  ctx.stroke();

  // Ticks simples
  ctx.fillStyle = "#64748b";
  ctx.font = "10px 'Space Grotesk'";
  ctx.fillText(minX.toFixed(1), margin, height - 8);
  ctx.fillText(maxX.toFixed(1), width - margin - 20, height - 8);
  ctx.fillText(minY.toFixed(1), 4, scaleY(minY));
  ctx.fillText(maxY.toFixed(1), 4, scaleY(maxY));

  // Curva interpolante si hay coeficientes
  if (coeffs && coeffs.length > 0) {
    ctx.beginPath();
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const xVal = minX + (i / steps) * (maxX - minX);
      const yVal = newtonEvaluate(xVal, xs, coeffs);
      const px = scaleX(xVal);
      const py = scaleY(yVal);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(34,211,238,0.7)";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Puntos de datos
  ctx.fillStyle = "#f97316";
  for (let i = 0; i < xs.length; i++) {
    const px = scaleX(xs[i]);
    const py = scaleY(ys[i]);
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ======================= MÉTODO DEL GRADIENTE CONJUGADO =================== */

function setupCG() {
  const sizeInput = document.getElementById("cg-size");
  const generateBtn = document.getElementById("cg-generate");
  const exampleBtn = document.getElementById("cg-example");
  const solveBtn = document.getElementById("cg-solve");

  generateBtn.addEventListener("click", () =>
    buildCGInputs(parseInt(sizeInput.value) || 3)
  );
  exampleBtn.addEventListener("click", loadCGExample);
  solveBtn.addEventListener("click", solveCGSystem);

  // Inicializar con una matriz vacía 3x3
  buildCGInputs(parseInt(sizeInput.value) || 3);
}

function buildCGInputs(n, A = null, b = null) {
  const matrixContainer = document.getElementById("cg-matrix-container");
  const bContainer = document.getElementById("cg-b-container");
  matrixContainer.innerHTML = "";
  bContainer.innerHTML = "";

  const table = document.createElement("table");
  table.className = "data-table matrix-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (let j = 0; j < n; j++) {
    const th = document.createElement("th");
    th.textContent = `a${1}${j + 1}`;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (let i = 0; i < n; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < n; j++) {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.step = "any";
      input.className = "cg-a";
      input.dataset.i = i;
      input.dataset.j = j;
      if (A && A[i] && typeof A[i][j] === "number") {
        input.value = A[i][j];
      }
      td.appendChild(input);
      row.appendChild(td);
    }
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  matrixContainer.appendChild(table);

  const bTable = document.createElement("table");
  bTable.className = "data-table matrix-table";
  const bThead = document.createElement("thead");
  const bHeadRow = document.createElement("tr");
  const thb = document.createElement("th");
  thb.textContent = "b";
  bHeadRow.appendChild(thb);
  bThead.appendChild(bHeadRow);
  bTable.appendChild(bThead);

  const bBody = document.createElement("tbody");
  for (let i = 0; i < n; i++) {
    const row = document.createElement("tr");
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.className = "cg-b";
    input.dataset.i = i;
    if (b && typeof b[i] === "number") {
      input.value = b[i];
    }
    td.appendChild(input);
    row.appendChild(td);
    bBody.appendChild(row);
  }
  bTable.appendChild(bBody);
  bContainer.appendChild(bTable);

  updateCGCounts(n);
  document.getElementById("cg-equations-list").innerHTML = "";
  document.getElementById("cg-results").innerHTML = "";
  document.getElementById("cg-iterations-body").innerHTML = "";
  document.getElementById("cg-error").textContent = "";
}

function updateCGCounts(n) {
  document.getElementById("cg-num-equations").textContent =
    "Ecuaciones: " + n;
  document.getElementById("cg-num-unknowns").textContent =
    "Incógnitas: " + n;
}

function loadCGExample() {
  /*
    Ejemplo: red de tres nodos de tuberías.
    Matriz A simétrica definida positiva.
  */
  const A = [
    [4, 1, 0],
    [1, 3, 1],
    [0, 1, 2],
  ];
  const b = [15, 10, 10]; // caudales conocidos en nodos

  document.getElementById("cg-size").value = 3;
  buildCGInputs(3, A, b);
  document.getElementById("cg-tol").value = 1e-6;
  document.getElementById("cg-max-iter").value = 25;
}

function solveCGSystem() {
  const errorDiv = document.getElementById("cg-error");
  errorDiv.textContent = "";

  const n = parseInt(document.getElementById("cg-size").value) || 3;
  const tol = parseFloat(document.getElementById("cg-tol").value) || 1e-6;
  const maxIter = parseInt(document.getElementById("cg-max-iter").value) || 50;

  const aInputs = Array.from(document.querySelectorAll(".cg-a"));
  const bInputs = Array.from(document.querySelectorAll(".cg-b"));
  if (aInputs.length === 0 || bInputs.length === 0) {
    errorDiv.textContent = "Genera primero la matriz y el vector.";
    return;
  }

  const A = Array.from({ length: n }, () => Array(n).fill(0));
  const b = Array(n).fill(0);

  for (const input of aInputs) {
    const i = parseInt(input.dataset.i);
    const j = parseInt(input.dataset.j);
    const val = parseFloat(input.value);
    if (isNaN(val)) {
      errorDiv.textContent = "Todos los coeficientes de A deben ser numéricos.";
      return;
    }
    A[i][j] = val;
  }

  for (const input of bInputs) {
    const i = parseInt(input.dataset.i);
    const val = parseFloat(input.value);
    if (isNaN(val)) {
      errorDiv.textContent = "Todos los coeficientes de b deben ser numéricos.";
      return;
    }
    b[i] = val;
  }

  updateCGCounts(n);

  // Ejecutar gradiente conjugado
  try {
    const result = conjugateGradient(A, b, tol, maxIter);
    displayCGEquations(A, b);
    displayCGResult(result);
  } catch (err) {
    console.error(err);
    errorDiv.textContent =
      "Error numérico en el método (¿la matriz A es simétrica definida positiva?).";
  }
}

// Funciones auxiliares de álgebra lineal
function matVec(A, x) {
  const n = A.length;
  const m = x.length;
  const y = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < m; j++) {
      sum += A[i][j] * x[j];
    }
    y[i] = sum;
  }
  return y;
}

function dot(u, v) {
  let s = 0;
  for (let i = 0; i < u.length; i++) s += u[i] * v[i];
  return s;
}

function vecAdd(u, v) {
  return u.map((ui, i) => ui + v[i]);
}

function vecSub(u, v) {
  return u.map((ui, i) => ui - v[i]);
}

function vecScale(alpha, v) {
  return v.map((vi) => alpha * vi);
}

// Implementación básica del método de gradiente conjugado
function conjugateGradient(A, b, tol, maxIter) {
  const n = b.length;
  let x = Array(n).fill(0); // x₀
  let r = vecSub(b, matVec(A, x)); // r₀ = b - A x₀
  let p = r.slice(); // p₀ = r₀
  let rsOld = dot(r, r);

  const history = [];
  let k;
  for (k = 0; k < maxIter; k++) {
    const Ap = matVec(A, p);
    const denom = dot(p, Ap);
    if (Math.abs(denom) < 1e-14) break;
    const alpha = rsOld / denom;
    x = vecAdd(x, vecScale(alpha, p));
    r = vecSub(r, vecScale(alpha, Ap));
    const rsNew = dot(r, r);
    const resNorm = Math.sqrt(rsNew);
    history.push({ k, alpha, residual: resNorm });

    if (resNorm < tol) break;
    const beta = rsNew / rsOld;
    p = vecAdd(r, vecScale(beta, p));
    rsOld = rsNew;
  }

  return {
    x,
    iterations: k + 1,
    history,
  };
}

function displayCGEquations(A, b) {
  const container = document.getElementById("cg-equations-list");
  container.innerHTML = "";
  const n = A.length;

  for (let i = 0; i < n; i++) {
    const parts = [];
    for (let j = 0; j < n; j++) {
      const aij = A[i][j];
      const coef = aij.toFixed(3);
      const varName = `x${j + 1}`;
      if (Math.abs(aij) < 1e-12) continue;

      if (parts.length === 0) {
        parts.push(`${coef}·${varName}`);
      } else {
        if (aij >= 0) {
          parts.push(`+ ${coef}·${varName}`);
        } else {
          parts.push(`- ${Math.abs(aij).toFixed(3)}·${varName}`);
        }
      }
    }
    const eq = document.createElement("p");
    eq.textContent = parts.join(" ") + ` = ${b[i].toFixed(3)}`;
    container.appendChild(eq);
  }
}

function displayCGResult(result) {
  const resultsDiv = document.getElementById("cg-results");
  const tbody = document.getElementById("cg-iterations-body");

  const x = result.x;
  const iters = result.iterations;
  const history = result.history;

  let html = `<p><strong>Solución aproximada x:</strong></p><ul>`;
  x.forEach((val, idx) => {
    html += `<li>x${idx + 1} ≈ ${val.toFixed(6)}</li>`;
  });
  html += `</ul>`;
  html += `<p><strong>Iteraciones realizadas:</strong> ${iters}</p>`;
  if (history.length > 0) {
    const last = history[history.length - 1];
    html += `<p><strong>Norma del último residuo:</strong> ${last.residual.toExponential(
      3
    )}</p>`;
  }
  html += `<p>En el contexto de la red de tuberías, cada componente de <code>x</code> representa la presión en un nodo.</p>`;
  resultsDiv.innerHTML = html;

  tbody.innerHTML = "";
  history.forEach((h) => {
    const tr = document.createElement("tr");
    const tdK = document.createElement("td");
    tdK.textContent = h.k;
    const tdRes = document.createElement("td");
    tdRes.textContent = h.residual.toExponential(3);
    const tdAlpha = document.createElement("td");
    tdAlpha.textContent = h.alpha.toExponential(3);
    tr.appendChild(tdK);
    tr.appendChild(tdRes);
    tr.appendChild(tdAlpha);
    tbody.appendChild(tr);
  });
}

/* ========================== MÉTODO SOR (2D) =============================== */

let sorGrid = null;
let sorN = 0;
let sorOmega = 1.6;
let sorTol = 1e-3;
let sorMaxIter = 500;
let sorIter = 0;
let sorIntervalId = null;

function setupSOR() {
  const initBtn = document.getElementById("sor-init");
  const startBtn = document.getElementById("sor-start");
  const stopBtn = document.getElementById("sor-stop");

  initBtn.addEventListener("click", initSORGrid);
  startBtn.addEventListener("click", startSOR);
  stopBtn.addEventListener("click", stopSOR);

  // Inicializa una placa al cargar
  initSORGrid();
}

function initSORGrid() {
  const nInput = document.getElementById("sor-n");
  const omegaInput = document.getElementById("sor-omega");
  const tolInput = document.getElementById("sor-tol");
  const maxIterInput = document.getElementById("sor-max-iter");

  sorN = Math.min(
    20,
    Math.max(4, parseInt(nInput.value) || 8)
  );
  nInput.value = sorN;

  sorOmega = parseFloat(omegaInput.value) || 1.6;
  sorTol = parseFloat(tolInput.value) || 1e-3;
  sorMaxIter = parseInt(maxIterInput.value) || 500;

  // Crear malla sorN x sorN
  sorGrid = Array.from({ length: sorN }, () =>
    Array(sorN).fill(0)
  );

  // Condiciones de borde:
  // izquierda y derecha 100°C, arriba y abajo 0°C
  for (let i = 0; i < sorN; i++) {
    sorGrid[i][0] = 100; // izquierda
    sorGrid[i][sorN - 1] = 100; // derecha
  }
  for (let j = 0; j < sorN; j++) {
    sorGrid[0][j] = 0; // arriba
    sorGrid[sorN - 1][j] = 0; // abajo
  }

  sorIter = 0;
  updateSORCounts();

  buildSORGridVisual();
  updateSORVisual();
  document.getElementById("sor-iteration-info").innerHTML =
    "Placa inicializada. Bordes fijos: lados verticales a 100°C, horizontales a 0°C. Pulsa “Iniciar SOR” para iterar.";
}

function updateSORCounts() {
  const internal = (sorN - 2) * (sorN - 2);
  document.getElementById("sor-num-equations").textContent =
    "Ecuaciones (nodos interiores): " + internal;
  document.getElementById("sor-num-unknowns").textContent =
    "Incógnitas: " + internal;
}

function buildSORGridVisual() {
  const gridContainer = document.getElementById("sor-grid");
  gridContainer.innerHTML = "";
  gridContainer.style.gridTemplateColumns = `repeat(${sorN}, minmax(0, 1fr))`;

  for (let i = 0; i < sorN; i++) {
    for (let j = 0; j < sorN; j++) {
      const cell = document.createElement("div");
      cell.className = "sor-cell";
      cell.dataset.i = i;
      cell.dataset.j = j;
      gridContainer.appendChild(cell);
    }
  }
}

function startSOR() {
  if (!sorGrid) {
    initSORGrid();
  }
  stopSOR(); // Evita múltiples intervals
  sorIter = 0;
  sorIntervalId = setInterval(sorStep, 50);
}

function stopSOR() {
  if (sorIntervalId !== null) {
    clearInterval(sorIntervalId);
    sorIntervalId = null;
  }
}

function sorStep() {
  if (!sorGrid) return;

  let maxDelta = 0;
  // Recorrido Gauss-Seidel + SOR
  for (let i = 1; i < sorN - 1; i++) {
    for (let j = 1; j < sorN - 1; j++) {
      const oldVal = sorGrid[i][j];
      const neighbors =
        sorGrid[i + 1][j] +
        sorGrid[i - 1][j] +
        sorGrid[i][j + 1] +
        sorGrid[i][j - 1];
      const gsVal = 0.25 * neighbors; // Gauss-Seidel
      const newVal = (1 - sorOmega) * oldVal + sorOmega * gsVal;
      const delta = Math.abs(newVal - oldVal);
      if (delta > maxDelta) maxDelta = delta;
      sorGrid[i][j] = newVal;
    }
  }

  sorIter++;
  updateSORVisual();

  const infoDiv = document.getElementById("sor-iteration-info");
  infoDiv.innerHTML = `
    <p><strong>Iteración SOR:</strong> ${sorIter}</p>
    <p><strong>Máximo cambio en esta iteración:</strong> ${maxDelta.toExponential(
      3
    )}</p>
    <p>El método detiene cuando el cambio máximo es menor que la tolerancia establecida.</p>
  `;

  if (maxDelta < sorTol || sorIter >= sorMaxIter) {
    stopSOR();
    infoDiv.innerHTML += `<p><strong>Proceso finalizado</strong> (convergencia alcanzada o límite de iteraciones).</p>`;
  }
}

function updateSORVisual() {
  if (!sorGrid) return;
  const gridContainer = document.getElementById("sor-grid");
  const cells = gridContainer.querySelectorAll(".sor-cell");

  // Asumimos rango 0 - 100
  const minVal = 0;
  const maxVal = 100;

  cells.forEach((cell) => {
    const i = parseInt(cell.dataset.i);
    const j = parseInt(cell.dataset.j);
    const val = sorGrid[i][j];
    cell.style.backgroundColor = valueToHeatColor(val, minVal, maxVal);

    // Mostramos valor solo cuando la malla es pequeña
    if (sorN <= 10) {
      cell.textContent = Math.round(val);
    } else {
      cell.textContent = "";
    }

    // Bordes en texto más oscuro
    if (i === 0 || i === sorN - 1 || j === 0 || j === sorN - 1) {
      cell.style.color = "rgba(15,23,42,0.95)";
      cell.style.fontWeight = "600";
    } else {
      cell.style.color = "rgba(15,23,42,0.9)";
    }
  });
}

// Mapeo temperatura -> color (azul a rojo)
function valueToHeatColor(val, minVal, maxVal) {
  const t = Math.max(
    0,
    Math.min(1, (val - minVal) / (maxVal - minVal || 1))
  );
  // Interpolar entre azul (0) y rojo (1)
  const r = Math.round(255 * t);
  const g = Math.round(80 * (1 - t)); // un poco de verde en medios
  const b = Math.round(255 * (1 - t));
  return `rgb(${r},${g},${b})`;
}
