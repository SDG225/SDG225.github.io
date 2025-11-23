// JS V-7
let mode = ""; // 'custom' หรือ 'average'
let mainTime = 0; // เวลาหลัก (วินาที)
let elapsedTime = 0; // เวลาของหัวข้อ
let timerInterval = null;
let timerPaused = false;
let elapsedInterval = null;
let elapsedPaused = false;
let selectedCustomIdx = -1;

// ข้อมูลหัวข้อ (Custom mode)
let customTopics = []; // { name: '', h:0, m:0, s:0, elapsedSec:0 }

// ข้อมูล Average mode
let averageCount = 0;
let averageH = 0,
  averageM = 0,
  averageS = 0;
let averageData = []; // [{index:1, used:0, total:30},...]
let selectedAverageIdx = 0;
let averageTimerInterval = null;

// ข้อมูล elapsed สำหรับ Average
let averageElapsedInterval = null;
let averageElapsedPaused = false;

// ตัวช่วยแปลงเวลา
function formatTime(sec) {
  sec = Math.max(0, sec || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h.toString().padStart(2, "0")} : ${m
    .toString()
    .padStart(2, "0")} : ${s.toString().padStart(2, "0")}`;
}
function formatTimeCompact(sec) {
  sec = Math.max(0, sec || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
    s
  ).padStart(2, "0")}`;
}

// อัปเดต main timer
function updateMainTimer(sec) {
  const el = document.getElementById("main-timer");
  if (el) el.textContent = formatTime(sec);
}

// เริ่ม/หยุด main timer
function startMainTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerPaused = false;

  timerInterval = setInterval(() => {
    if (!timerPaused) {
      if (mainTime > 0) {
        mainTime--;
        updateMainTimer(mainTime);
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        updateMainTimer(0);
      }
    }
  }, 1000);

  if (mode === "custom") {
    if (selectedCustomIdx < 0 && customTopics.length > 0) {
      selectedCustomIdx = 0;
      startElapsedTimer();
      renderCustomPanel();
    } else {
      startElapsedTimer();
    }
  }

  if (mode === "average") {
    ensureAverageData();
    startAverageTimer();
    startAverageElapsedTimer();
  }

  //  ส่วนปรับสีปุ่ม Stop
  const btnStop = document.getElementById("btn-stop");
  if (btnStop) {
    btnStop.style.backgroundColor = "#e74c3c"; // แดง
    btnStop.style.color = "#fff"; // ขาว
  }
}

// ฟังก์ชัน การหยุดเวลา
function stopMainTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerPaused = false;

  const btnStop = document.getElementById("btn-stop");

  // ปรับสีของปุ่ม Stop
  if (btnStop) {
    btnStop.style.backgroundColor = "#ffffff"; // พื้นหลังขาว
    btnStop.style.color = "#000000"; // ตัวอักษรดำ
  }

  pauseElapsedTimer();
  pauseAverageTimer();
  pauseAverageElapsedTimer();
}

function togglePauseMainTimer() {
  if (!timerInterval) return;
  timerPaused = !timerPaused;

  if (btnOp) {
    btnOp.textContent = timerPaused ? "Continue" : "Pause";
    //  เพิ่มสีพื้นหลังตามสถานะ
    if (timerPaused) {
      btnOp.style.backgroundColor = "#ffc107"; // เหลืองเข้ม (Continue)
      btnOp.style.color = "#000";
    } else {
      btnOp.style.backgroundColor = "#fff3cd"; // เหลืองอ่อน (Pause)
      btnOp.style.color = "#000";
    }
  }

  elapsedPaused = timerPaused;
  averageElapsedPaused = timerPaused;

  if (mode === "average") {
    if (!timerPaused && !averageTimerInterval) startAverageTimer();
  }
}

// ฟังก์ชัน จับเวลา elapsed ของ custom
function startElapsedTimer() {
  pauseElapsedTimer();
  elapsedPaused = false;
  if (selectedCustomIdx < 0 || !customTopics[selectedCustomIdx]) return;
  elapsedInterval = setInterval(() => {
    if (!elapsedPaused) {
      customTopics[selectedCustomIdx].elapsedSec =
        (customTopics[selectedCustomIdx].elapsedSec || 0) + 1;
      renderCustomPanel();
    }
  }, 1000);
}
function pauseElapsedTimer() {
  if (elapsedInterval) {
    clearInterval(elapsedInterval);
    elapsedInterval = null;
  }
  elapsedPaused = true;
}

// ฟังก์ชันจับเวลา elapsed ของ Average
function startAverageElapsedTimer() {
  pauseAverageElapsedTimer();
  averageElapsedPaused = false;
  if (!averageData || averageData.length === 0) return;
  // แสดงค่าเริ่มต้น
  const idx = selectedAverageIdx;
  const label = document.getElementById("elapsed-timer");
  if (label)
    label.textContent = "Elapsed: " + formatTime(averageData[idx].used || 0);

  averageElapsedInterval = setInterval(() => {
    if (averageElapsedPaused) return;
    const idx = selectedAverageIdx;
    if (averageData[idx]) {
      const label = document.getElementById("elapsed-timer");
      if (label)
        label.textContent =
          "Elapsed: " + formatTime(averageData[idx].used || 0);
    }
  }, 1000);
}
function pauseAverageElapsedTimer() {
  if (averageElapsedInterval) {
    clearInterval(averageElapsedInterval);
    averageElapsedInterval = null;
  }
  averageElapsedPaused = true;
}

// ------------------ Average helpers ------------------
function ensureAverageData() {
  averageCount = Math.max(0, parseInt(averageCount) || 0);
  const totalSec =
    (averageH || 0) * 3600 + (averageM || 0) * 60 + (averageS || 0);

  while (averageData.length < averageCount) {
    averageData.push({
      index: averageData.length + 1,
      used: 0,
      total: totalSec,
    });
  }
  while (averageData.length > averageCount) {
    averageData.pop();
  }

  for (let i = 0; i < averageData.length; i++) {
    averageData[i].index = i + 1;
    averageData[i].total = totalSec;
    if (typeof averageData[i].used === "undefined") averageData[i].used = 0;
  }

  // ปรับ openedBlox ให้ไม่เกินขอบเขตใหม่ และ ensure มี 0 เสมอ
  openedBlox = openedBlox.filter((v) => v >= 0 && v < averageData.length);
  if (!openedBlox.includes(0) && averageData.length > 0) openedBlox.unshift(0);

  if (averageData.length === 0) {
    selectedAverageIdx = 0;
  } else if (selectedAverageIdx >= averageData.length) {
    selectedAverageIdx = averageData.length - 1;
  } else if (selectedAverageIdx < 0) {
    selectedAverageIdx = 0;
  }
}

// ฟังก์ชันตรวจสอบและควบคุม
function startAverageTimer() {
  // หยุดของเดิมก่อน
  if (averageTimerInterval) clearInterval(averageTimerInterval);
  averageTimerInterval = null;
  // ถ้าข้อมูลไม่มี ให้ไม่เริ่ม
  if (!averageData || averageData.length === 0) return;

  // ซิงค์ elapsed-timer กับค่า used ของบล็อกก่อน
  if (averageData[selectedAverageIdx]) {
    const label = document.getElementById("elapsed-timer");
    if (label)
      label.textContent =
        "Elapsed: " + formatTime(averageData[selectedAverageIdx].used || 0);
  }

  averageTimerInterval = setInterval(() => {
    if (timerPaused) return;
    const idx = selectedAverageIdx;
    if (averageData[idx]) {
      averageData[idx].used = (averageData[idx].used || 0) + 1;
      // update label ใน blox (ใช้ id ที่ตั้งไว้)
      const label = document.getElementById(`avg-elapsed-${idx}`);
      if (label)
        label.textContent = formatTimeCompact(averageData[idx].used || 0);
      // update elapsed-timer ให้ตรงกับ blox
      const elapsedLabel = document.getElementById("elapsed-timer");
      if (elapsedLabel)
        elapsedLabel.textContent =
          "Elapsed: " + formatTime(averageData[idx].used);
      updateAverageBloxHighlight(idx);
    }
  }, 1000);
}
function pauseAverageTimer() {
  if (averageTimerInterval) {
    clearInterval(averageTimerInterval);
    averageTimerInterval = null;
  }
}

// อัปเดตไฮไลต์ของบล็อก Average
function updateAverageBloxHighlight(activeIdx) {
  averageData.forEach((item, idx) => {
    const el = document.getElementById(`avg-blox-${idx}`);
    if (el) {
      if (idx === activeIdx) {
        el.style.background = "#d1e7dd";
      } else {
        el.style.background = "#fff";
      }
    }
  });
}

// ฟังก์ชันเลือก Average Blox พร้อมซิงค์ elapsed และชื่อ
function selectAverageBlox(idx) {
  if (selectedAverageIdx === idx) return;

  pauseAverageTimer();
  // guard
  if (idx < 0 || idx >= averageData.length) return;

  selectedAverageIdx = idx;

  // ซิงค์ elapsed-timer กับค่าจาก blox (ถ้ามี)
  const label = document.getElementById(`avg-elapsed-${idx}`);
  if (label) {
    const text = label.textContent || "";
    const match = text.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
    if (match) {
      const h = parseInt(match[1]) || 0;
      const m = parseInt(match[2]) || 0;
      const s = parseInt(match[3]) || 0;
      averageData[idx].used = h * 3600 + m * 60 + s;
    } else {
      // หากไม่มี match ปล่อยไว้ (ค่าที่มีใน averageData จะถูกใช้อยู่แล้ว)
    }
  }

  // อัปเดตชื่อ
  const nameDiv = document.getElementById("selected-blox-name");
  if (nameDiv && averageData[idx])
    nameDiv.textContent = `ข้อที่ ${averageData[idx].index}`;

  // render panel ใหม่
  renderAveragePanel();

  // เริ่ม timer ใหม่หลัง DOM update สั้นๆ
  setTimeout(() => {
    if (timerInterval && !timerPaused) startAverageTimer();
  }, 100);
}

// ฟังก์ชัน render panel ของ Custom
function renderCustomPanel() {
  const panel = document.getElementById("panelforCustom");
  const nameDiv = document.getElementById("selected-blox-name");
  const setTimeEl = document.getElementById("settime-overlay");
  const setTimeVisible = setTimeEl && setTimeEl.style.display !== "none";

  if (!panel) return;

  if (mode !== "custom" || setTimeVisible) {
    panel.style.display = "none";
    panel.innerHTML = "";
    if (nameDiv) nameDiv.textContent = "";
    const elapsedLabel = document.getElementById("elapsed-timer");
    if (elapsedLabel) elapsedLabel.textContent = "Elapsed: 00 : 00 : 00";
    return;
  }

  panel.style.display = "flex";
  panel.innerHTML = "";
  if (customTopics.length === 0) {
    if (nameDiv) nameDiv.textContent = "";
    return;
  }

  customTopics.forEach((topic, idx) => {
    const blox = document.createElement("div");
    blox.className = "custom-blox";
    blox.style.cursor = "pointer";
    blox.style.margin = "4px";
    blox.style.padding = "4px";
    blox.style.border = "1px solid #ccc";
    blox.style.borderRadius = "4px";

    // highlight selected
    if (selectedCustomIdx === idx) {
      blox.style.background = "#d1e7dd";
      blox.style.boxShadow = "0 2px 8px rgba(44,62,80,0.12)";
    }
    const setSec = (topic.h || 0) * 3600 + (topic.m || 0) * 60 + (topic.s || 0);
    if (topic.elapsedSec > setSec && setSec > 0) {
      blox.style.background = "#f8d7da";
      blox.style.border = "1px solid #dc3545";
      blox.style.color = "#721c24";
      blox.style.boxShadow = "0 2px 8px rgba(231,76,60,0.12)";
    }

    // ข้อความชื่อ
    const nameSpan = document.createElement("span");
    nameSpan.textContent = topic.name || "(ไม่มีชื่อ)";
    nameSpan.style.fontWeight = "bold";
    nameSpan.style.marginRight = "10px";
    blox.appendChild(nameSpan);

    // เวลาที่ตั้ง
    const timeSpan = document.createElement("span");
    timeSpan.textContent = `${String(topic.h).padStart(2, "0")}:${String(
      topic.m
    ).padStart(2, "0")}:${String(topic.s).padStart(2, "0")}`;
    timeSpan.style.marginRight = "10px";
    blox.appendChild(timeSpan);

    // เวลาปัจจุบัน elapsed
    const elapsedSpan = document.createElement("span");
    elapsedSpan.textContent = "/ " + formatTime(topic.elapsedSec || 0);
    elapsedSpan.style.color = "#888";
    blox.appendChild(elapsedSpan);

    // คลิกเลือก
    blox.onclick = () => {
      if (selectedCustomIdx !== idx) {
        pauseElapsedTimer();
        selectedCustomIdx = idx;
        renderCustomPanel();
        if (timerInterval && !timerPaused) {
          startElapsedTimer();
        }
      }
    };

    panel.appendChild(blox);
  });

  // ชื่อหัวข้อ
  if (selectedCustomIdx >= 0 && customTopics[selectedCustomIdx]) {
    if (nameDiv)
      nameDiv.textContent =
        customTopics[selectedCustomIdx].name || "(ไม่มีชื่อ)";
    const elapsedLabel = document.getElementById("elapsed-timer");
    if (elapsedLabel)
      elapsedLabel.textContent =
        "Elapsed: " +
        formatTime(customTopics[selectedCustomIdx].elapsedSec || 0);
  } else {
    if (nameDiv) nameDiv.textContent = "";
    const elapsedLabel = document.getElementById("elapsed-timer");
    if (elapsedLabel) elapsedLabel.textContent = "Elapsed: 00 : 00 : 00";
  }
}

// render panel สำหรับแก้ไขหัวข้อ custom
function renderCustomEditPanel() {
  const panel = document.getElementById("set-actionmode-custom");
  if (!panel) return;
  panel.innerHTML = "";

  if (mode === "custom") {
    customTopics.forEach((topic, idx) => {
      const blox = document.createElement("div");
      blox.className = "custom-blox";
      blox.style.margin = "4px";
      blox.style.display = "flex";
      blox.style.alignItems = "center";
      blox.style.gap = "6px";

      // name input
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "ชื่อหัวข้อ";
      nameInput.value = topic.name;
      nameInput.style.width = "150px";
      nameInput.oninput = (e) => {
        customTopics[idx].name = e.target.value;
      };
      blox.appendChild(nameInput);

      // ชั่วโมง
      const hInput = document.createElement("input");
      hInput.type = "number";
      hInput.min = 0;
      hInput.max = 99;
      hInput.placeholder = "ชั่วโมง";
      hInput.value = topic.h > 0 ? topic.h : "";
      hInput.oninput = (e) => {
        customTopics[idx].h = parseInt(e.target.value) || 0;
      };
      blox.appendChild(hInput);

      // นาที
      const mInput = document.createElement("input");
      mInput.type = "number";
      mInput.min = 0;
      mInput.max = 59;
      mInput.placeholder = "นาที";
      mInput.value = topic.m > 0 ? topic.m : "";
      mInput.oninput = (e) => {
        customTopics[idx].m = parseInt(e.target.value) || 0;
      };
      blox.appendChild(mInput);

      // วินาที
      const sInput = document.createElement("input");
      sInput.type = "number";
      sInput.min = 0;
      sInput.max = 59;
      sInput.placeholder = "วินาที";
      sInput.value = topic.s > 0 ? topic.s : "";
      sInput.oninput = (e) => {
        customTopics[idx].s = parseInt(e.target.value) || 0;
      };
      blox.appendChild(sInput);

      // ปุ่มลบ
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "✕";
      removeBtn.onclick = () => {
        customTopics.splice(idx, 1);
        renderCustomEditPanel();
        renderCustomPanel();
      };
      blox.appendChild(removeBtn);

      panel.appendChild(blox);
    });

    // ปุ่มเพิ่ม
    const addBlox = document.createElement("div");
    addBlox.className = "custom-blox";
    addBlox.style.margin = "4px";
    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.onclick = () => {
      customTopics.push({ name: "", h: 0, m: 0, s: 0, elapsedSec: 0 });
      renderCustomEditPanel();
      renderCustomPanel();
    };
    addBlox.appendChild(addBtn);
    panel.appendChild(addBlox);
  }
}

// ------------------ render Average ------------------
// render panel สำหรับแก้ไขหัวข้อ Average
let currentBloxIdx = 1; // เริ่มจากข้อที่ 1 (ข้อที่ 0 เปิดอยู่แล้ว)
let openedBlox = [0]; // เปิดข้อแรกไว้ตั้งแต่ต้น

function renderAveragePanel() {
  const panel = document.getElementById("set-actionmode-average");
  const avgDisplay = document.getElementById("panelforAverage");
  const nameDiv = document.getElementById("selected-blox-name");
  if (!panel || !avgDisplay) return;

  panel.innerHTML = "";

  let panelInAverage = document.getElementById("PanelinAverage");
  if (!panelInAverage) {
    panelInAverage = document.createElement("div");
    panelInAverage.id = "PanelinAverage";
    avgDisplay.appendChild(panelInAverage);
  }

  if (mode !== "average") {
    panel.style.display = "none";
    avgDisplay.style.display = "none";
    if (nameDiv) nameDiv.textContent = "";
    pauseAverageTimer();
    return;
  }

  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.gap = "6px";
  avgDisplay.style.display = "block";

  // ------------------ จำนวนข้อ ------------------
  const countRow = document.createElement("div");
  countRow.style.display = "flex";
  countRow.style.alignItems = "center";
  countRow.style.gap = "6px";

  const countLabel = document.createElement("span");
  countLabel.textContent = "จำนวนข้อ:";
  countRow.appendChild(countLabel);

  const countInput = document.createElement("input");
  countInput.type = "number";
  countInput.min = 0;
  countInput.max = 999;
  countInput.value = "";
  countInput.placeholder = averageCount || "";
  countInput.onchange = (e) => {
    const val = parseInt(e.target.value) || 0;
    if (val !== averageCount) {
      averageCount = val;
      ensureAverageData();
      renderAveragePanel();
    }
  };
  countRow.appendChild(countInput);
  panel.appendChild(countRow);

  // ------------------ เวลาต่อข้อ ------------------
  const timeRow = document.createElement("div");
  timeRow.style.display = "flex";
  timeRow.style.alignItems = "center";
  timeRow.style.gap = "6px";

  const timeLabel = document.createElement("span");
  timeLabel.textContent = "เวลาต่อข้อ (ชั่วโมง : นาที : วินาที):";
  timeRow.appendChild(timeLabel);

  // ชั่วโมง
  const hInput = document.createElement("input");
  hInput.type = "number";
  hInput.min = 0;
  hInput.max = 99;
  hInput.placeholder = "ชั่วโมง";
  hInput.value = averageH > 0 ? averageH : "";
  hInput.style.width = "60px";
  hInput.onchange = (e) => {
    averageH = parseInt(e.target.value) || 0;
    averageM = Math.max(0, averageM || 0);
    averageS = Math.max(0, averageS || 0);
    const total =
      (averageH || 0) * 3600 + (averageM || 0) * 60 + (averageS || 0);
    averageData.forEach((item) => (item.total = total));
    renderAveragePanel();
  };
  timeRow.appendChild(hInput);

  // นาที
  const mInput = document.createElement("input");
  mInput.type = "number";
  mInput.min = 0;
  mInput.max = 59;
  mInput.placeholder = "นาที";
  mInput.value = averageM > 0 ? averageM : "";
  mInput.style.width = "60px";
  mInput.onchange = (e) => {
    let v = parseInt(e.target.value);
    if (isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 59) {
      alert("นาทีต้องไม่เกิน 59");
      v = 59;
      e.target.value = "59";
    }
    averageM = v;
    const total =
      (averageH || 0) * 3600 + (averageM || 0) * 60 + (averageS || 0);
    averageData.forEach((item) => (item.total = total));
    renderAveragePanel();
  };
  timeRow.appendChild(mInput);

  // วินาที
  const sInput = document.createElement("input");
  sInput.type = "number";
  sInput.min = 0;
  sInput.max = 59;
  sInput.placeholder = "วินาที";
  sInput.value = averageS > 0 ? averageS : "";
  sInput.style.width = "60px";
  sInput.onchange = (e) => {
    let v = parseInt(e.target.value);
    if (isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 59) {
      alert("วินาทีต้องไม่เกิน 59");
      v = 59;
      e.target.value = "59";
    }
    averageS = v;
    const total =
      (averageH || 0) * 3600 + (averageM || 0) * 60 + (averageS || 0);
    averageData.forEach((item) => (item.total = total));
    renderAveragePanel();
  };
  timeRow.appendChild(sInput);

  panel.appendChild(timeRow);

  // ------------------ Summary ------------------
  const timePerQuestion = averageH * 3600 + averageM * 60 + averageS;
  const oldSummary = document.getElementById("average-summary");
  if (oldSummary) oldSummary.remove();

  const summary = document.createElement("div");
  summary.id = "average-summary";
  // แสดงทั้งวินาทีและรูปแบบ HH:MM:SS
  summary.innerHTML = `จำนวนข้อ ${averageCount} ข้อ<br>เวลาต่อข้อ ${timePerQuestion} วิ (${formatTimeCompact(
    timePerQuestion
  )})`;
  summary.style.marginTop = "10px";
  summary.style.marginBottom = "6px";
  summary.style.color = "#222";
  summary.style.fontWeight = "bold";
  avgDisplay.insertBefore(summary, document.getElementById("PanelinAverage"));

  // ------------------ Panel in Average ------------------
  let bloxContainer = document.getElementById("PanelinAverage");
  bloxContainer.style.display = "flex";
  bloxContainer.style.flexWrap = "wrap";
  bloxContainer.style.gap = "6px";
  bloxContainer.style.marginTop = "10px";
  bloxContainer.style.padding = "6px";
  bloxContainer.style.background = "rgba(0, 0, 255, 0.05)";
  bloxContainer.style.border = "1px solid #ccc";
  bloxContainer.style.borderRadius = "6px";
  bloxContainer.style.color = "black";

  ensureAverageData();

  // ------------------ สร้าง blox ------------------
  bloxContainer.innerHTML = "";

  const displayData = [...averageData].reverse();

  displayData.forEach((item, idx) => {
    const origIdx = item.index - 1;
    const blox = document.createElement("div");
    blox.className = "average-blox";
    blox.id = `avg-blox-${origIdx}`;
    blox.style.cursor = "pointer";
    blox.style.margin = "4px";
    blox.style.padding = "4px";
    blox.style.border = "1px solid #ccc";
    blox.style.borderRadius = "4px";
    blox.style.minWidth = "130px";
    blox.style.textAlign = "center";
    blox.style.transition = "background 0.3s, color 0.3s";

    blox.style.background = origIdx === selectedAverageIdx ? "#d1e7dd" : "#fff";

    if ((item.used || 0) > (item.total || 0)) {
      blox.style.background = "#f8d7da";
      blox.style.borderColor = "#dc3545";
      blox.style.color = "#721c24";
    }

    const title = document.createElement("div");
    const usedSpan = document.createElement("span");
    usedSpan.className = "used-time";
    usedSpan.id = `avg-elapsed-${origIdx}`;
    usedSpan.textContent = formatTimeCompact(item.used || 0);

    title.textContent = `ข้อที่ ${item.index} (${formatTimeCompact(
      item.total || 0
    )} / `;
    title.appendChild(usedSpan);
    title.append(")");
    title.style.fontWeight = "bold";
    blox.appendChild(title);

    blox.onclick = () => selectAverageBlox(origIdx);
    if (!openedBlox.includes(origIdx)) blox.style.display = "none";

    bloxContainer.appendChild(blox);
  });

  const currentItem = averageData[selectedAverageIdx] || { index: 0, used: 0 };
  if (nameDiv) nameDiv.textContent = `ข้อที่ ${currentItem.index}`;
  const elapsedTimerLabel = document.getElementById("elapsed-timer");
  if (elapsedTimerLabel)
    elapsedTimerLabel.textContent =
      "Elapsed: " + formatTime(currentItem.used || 0);
}

// ------------------ Timer สำหรับอัปเดตเวลาที่ใช้ ใน DOM (ทุกๆ 1s) ------------------
setInterval(() => {
  averageData.forEach((item, idx) => {
    const usedSpan =
      document.querySelector(`#avg-blox-${idx} .used-time`) ||
      document.getElementById(`avg-elapsed-${idx}`);
    if (usedSpan) {
      usedSpan.textContent = formatTimeCompact(item.used || 0);
    }

    // ✅ อัปเดตสีเรียลไทม์
    const blox = document.getElementById(`avg-blox-${idx}`);
    if (blox) {
      if ((item.used || 0) > (item.total || 0)) {
        blox.style.background = "#f8d7da";
        blox.style.borderColor = "#dc3545";
        blox.style.color = "#721c24";
      } else if (idx === selectedAverageIdx) {
        blox.style.background = "#d1e7dd";
        blox.style.borderColor = "#ccc";
        blox.style.color = "black";
      } else {
        blox.style.background = "#fff";
        blox.style.borderColor = "#ccc";
        blox.style.color = "black";
      }
    }
  });
}, 1000);

// ------------------ แสดง panel ตาม mode ------------------
function showPanelByMode() {
  if (mode === "custom") {
    pauseAverageTimer();
    renderCustomEditPanel();
    renderCustomPanel();
  } else if (mode === "average") {
    ensureAverageData();
    if (openedBlox.length === 0 && averageData.length > 0) openedBlox = [0];
    currentBloxIdx = 1;
    renderAveragePanel();
    if (timerInterval && !timerPaused) startAverageTimer();
  } else {
    const setActionCustom = document.getElementById("set-actionmode-custom");
    if (setActionCustom) setActionCustom.style.display = "none";
    const panCustom = document.getElementById("panelforCustom");
    if (panCustom) panCustom.style.display = "none";
    const panAvg = document.getElementById("panelforAverage");
    if (panAvg) panAvg.style.display = "none";
    pauseAverageTimer();
  }
}

// Set Time Dialog
function showSetTimeDialog() {
  const el = document.getElementById("settime-overlay");
  if (el) el.style.display = "flex";
}

// ------------------ DOMContentLoaded และการผูก event ------------------
document.addEventListener("DOMContentLoaded", function () {
  const overlay = document.getElementById("mode-overlay");
  const selectCustom = document.getElementById("select-custom");
  const selectAverage = document.getElementById("select-average");
  if (selectCustom)
    selectCustom.addEventListener("click", () => {
      mode = "custom";
      if (overlay) overlay.style.display = "none";
      showSetTimeDialog();
      showPanelByMode();
    });
  if (selectAverage)
    selectAverage.addEventListener("click", () => {
      mode = "average";
      if (overlay) overlay.style.display = "none";
      showSetTimeDialog();
      showPanelByMode();
    });

  const btnSetTime = document.getElementById("btn-settime");
  if (btnSetTime)
    btnSetTime.addEventListener("click", () => {
      const h = parseInt(document.getElementById("set-h").value) || 0;
      const m = parseInt(document.getElementById("set-m").value) || 0;
      const s = parseInt(document.getElementById("set-s").value) || 0;
      if (m > 59 || s > 59) {
        alert("Minute และ Second ต้องไม่เกิน 59");
        return;
      }
      mainTime = h * 3600 + m * 60 + s;
      updateMainTimer(mainTime);
      document.getElementById("settime-overlay").style.display = "none";

      ensureAverageData();
      showPanelByMode();
      stopMainTimer();
    });

  const btnStart = document.getElementById("btn-start");
  if (btnStart) btnStart.addEventListener("click", () => startMainTimer());
  const btnStop = document.getElementById("btn-stop");
  if (btnStop)
    btnStop.addEventListener("click", () => {
      stopMainTimer();
      updateMainTimer(mainTime);
    });

  // ปุ่ม Next  custom และ average
  const btnNext = document.getElementById("btn-next");
  if (btnNext) {
    // ถ้ามี listener เก่า (rare) จะไม่ผูกซ้ำด้วย addEventListener เดิม ๆ ใน DOMContentLoaded
    btnNext.addEventListener("click", () => {
      // ปุ่ม Next กับ custom
      if (mode === "custom") {
        if (customTopics.length === 0) return;
        let idx = selectedCustomIdx < 0 ? 0 : selectedCustomIdx;
        const total = customTopics.length;
        let allOver = customTopics.every((topic) => {
          const setSec =
            (topic.h || 0) * 3600 + (topic.m || 0) * 60 + (topic.s || 0);
          return (topic.elapsedSec || 0) > setSec && setSec > 0;
        });
        let nextIdx = idx;
        let found = false;
        for (let i = 1; i <= total; i++) {
          let tryIdx = (idx + i) % total;
          const topic = customTopics[tryIdx];
          const setSec =
            (topic.h || 0) * 3600 + (topic.m || 0) * 60 + (topic.s || 0);
          if (allOver || (topic.elapsedSec || 0) <= setSec || setSec === 0) {
            nextIdx = tryIdx;
            found = true;
            break;
          }
        }
        if (found) {
          pauseElapsedTimer();
          selectedCustomIdx = nextIdx;
          renderCustomPanel();
          if (timerInterval && !timerPaused) startElapsedTimer();
        }
        return;
      }

      // ปุ่ม Next กับ average
      if (mode === "average") {
        if (!averageData || averageData.length === 0) return;
        // guard: หาก currentBloxIdx เกินจะไม่ทำอะไร
        if (currentBloxIdx >= averageData.length) return;
        // เพิ่ม openedBlox (ถ้ายังไม่มี)
        if (!openedBlox.includes(currentBloxIdx))
          openedBlox.push(currentBloxIdx);
        // แสดงบล็อกเป้าหมาย
        const targetBlox = document.getElementById(
          `avg-blox-${currentBloxIdx}`
        );
        if (targetBlox) {
          targetBlox.style.display = "flex";
          selectAverageBlox(currentBloxIdx);
        }
        currentBloxIdx += 1;
        return;
      }
    });
  }
});
