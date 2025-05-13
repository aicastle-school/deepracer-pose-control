const arrowCanvas = document.getElementById("arrowCanvas");
const arrowCtx    = arrowCanvas.getContext("2d");


// 1 기준 설계사이즈즈
const BASE_W = 120;          

// 2 현재 캔버스 폭에 따라 배율 자동 산출
const SCALE  = arrowCanvas.width / BASE_W;   // 480px → 1.60, 600px → 2.
/* ============================================================ */

function drawArrow(angleDeg, speed) {

  const width  = arrowCanvas.width;
  const height = arrowCanvas.height;
  const centerX = width  / 2;
  const centerY = height - 8 * SCALE;   // 아래쪽 여백도 배수 반영

  arrowCtx.clearRect(0, 0, width, height);

  /* ① 테두리 반원 ------------------------------------------------ */
  const R_OUTER = 28 * SCALE;            // 28px → 배수
  arrowCtx.beginPath();
  arrowCtx.arc(centerX, centerY, R_OUTER, Math.PI, 2 * Math.PI);
  arrowCtx.lineWidth   = 4 * SCALE;      // 두께도 배수
  arrowCtx.strokeStyle = "#333";
  arrowCtx.stroke();

  /* ② 눈금 ------------------------------------------------------- */
  for (let a = -45; a <= 45; a += 10) {
    const rad = a * Math.PI / 180;
    const r1  = (R_OUTER - 6 * SCALE);   // 안쪽 점
    const r2  = R_OUTER;                 // 바깥 점
    const x1 = centerX + Math.sin(rad) * r1;
    const y1 = centerY - Math.cos(rad) * r1;
    const x2 = centerX + Math.sin(rad) * r2;
    const y2 = centerY - Math.cos(rad) * r2;

    arrowCtx.beginPath();
    arrowCtx.moveTo(x1, y1);
    arrowCtx.lineTo(x2, y2);
    arrowCtx.lineWidth   = 2 * SCALE;
    arrowCtx.strokeStyle = "#555";
    arrowCtx.stroke();
  }

  /* ③ 바늘 ------------------------------------------------------- */
  const clampedAngle = Math.max(-30, Math.min(30, angleDeg));
  const clampedSpeed = Math.max(2,  Math.min(4,  speed));
  const needleLen = (clampedSpeed - 1) * 15 * SCALE;
  const radNeedle = -clampedAngle * 1.5 * Math.PI / 180;

  arrowCtx.beginPath();
  arrowCtx.moveTo(centerX, centerY);
  arrowCtx.lineTo(
    centerX + Math.sin(radNeedle) * needleLen,
    centerY - Math.cos(radNeedle) * needleLen
  );
  arrowCtx.lineWidth   = 4 * SCALE;
  arrowCtx.strokeStyle = "#dc3545";
  arrowCtx.stroke();

  /* ④ 중앙 원 ---------------------------------------------------- */
  arrowCtx.beginPath();
  arrowCtx.arc(centerX, centerY, 3 * SCALE, 0, 2 * Math.PI);
  arrowCtx.fillStyle = "#000";
  arrowCtx.fill();
}