const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let tool = "pen";
let color = "#111827";
let fillColor = "#ffffff";
let lineWidth = 3;
let isDrawing = false;
let startX, startY;
let strokes = [];
let redoStack = [];
let currentStroke = null;

function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  redrawAll();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function startDraw(e) {
  e.preventDefault();
  const pos = getPos(e);
  isDrawing = true;
  redoStack = [];

  if (tool === "pen" || tool === "eraser") {
    currentStroke = {
      type: tool,
      color: color,
      width: lineWidth,
      points: [pos]
    };
  } else if (tool === "rect" || tool === "circle") {
    startX = pos.x;
    startY = pos.y;
    currentStroke = {
      type: tool,
      strokeColor: color,
      fillColor: fillColor,
      width: lineWidth,
      start: { x: startX, y: startY },
      end: { x: startX, y: startY }
    };
  }
}

function draw(e) {
  if (!isDrawing || !currentStroke) return;
  const pos = getPos(e);

  if (currentStroke.type === "pen" || currentStroke.type === "eraser") {
    currentStroke.points.push(pos);
  } else {
    currentStroke.end = pos;
  }
  redrawAll();
  drawStroke(currentStroke, true);
}

function endDraw() {
  if (!isDrawing) return;
  isDrawing = false;
  if (currentStroke) {
    strokes.push(currentStroke);
    currentStroke = null;
  }
}

function drawStroke(s, preview = false) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = s.width;

  if (s.type === "pen") {
    ctx.strokeStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
  } else if (s.type === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  } else if (s.type === "rect") {
    ctx.strokeStyle = s.strokeColor;
    ctx.fillStyle = s.fillColor;
    const x = Math.min(s.start.x, s.end.x);
    const y = Math.min(s.start.y, s.end.y);
    const w = Math.abs(s.end.x - s.start.x);
    const h = Math.abs(s.end.y - s.start.y);
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
  } else if (s.type === "circle") {
    ctx.strokeStyle = s.strokeColor;
    ctx.fillStyle = s.fillColor;
    const cx = (s.start.x + s.end.x) / 2;
    const cy = (s.start.y + s.end.y) / 2;
    const rx = Math.abs(s.end.x - s.start.x) / 2;
    const ry = Math.abs(s.end.y - s.start.y) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function redrawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach(s => drawStroke(s));
}

document.getElementById("tool").addEventListener("change", e => tool = e.target.value);
document.getElementById("color").addEventListener("change", e => color = e.target.value);
document.getElementById("fillColor").addEventListener("change", e => fillColor = e.target.value);
document.getElementById("lineWidth").addEventListener("input", e => lineWidth = e.target.value);

document.getElementById("undo").addEventListener("click", () => {
  if (strokes.length > 0) {
    redoStack.push(strokes.pop());
    redrawAll();
  }
});
document.getElementById("redo").addEventListener("click", () => {
  if (redoStack.length > 0) {
    strokes.push(redoStack.pop());
    redrawAll();
  }
});
document.getElementById("clear").addEventListener("click", () => {
  strokes = [];
  redoStack = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
document.getElementById("save").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "pizarra.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// Eventos
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mouseleave", endDraw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", endDraw);
