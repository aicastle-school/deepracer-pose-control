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

  /* ③ 바늘 ------------------------------------------------------- */
  const clampedAngle = Math.max(-30, Math.min(30, angleDeg));
  const clampedSpeed = Math.max(0, Math.min(4, speed));
  
  // 속도가 0이면 화살표 그리지 않음
  if (clampedSpeed === 0) {
    /* ④ 중앙 원 ---------------------------------------------------- */
    arrowCtx.beginPath();
    arrowCtx.arc(centerX, centerY, 3 * SCALE, 0, 2 * Math.PI);
    arrowCtx.fillStyle = "#000";
    arrowCtx.fill();
    return;
  }
  
  const needleLen = (clampedSpeed - 1) * 15 * SCALE;
  const radNeedle = -clampedAngle * 1.5 * Math.PI / 180;

  const needleEndX = centerX + Math.sin(radNeedle) * needleLen;
  const needleEndY = centerY - Math.cos(radNeedle) * needleLen;

  // 바늘 몸통
  arrowCtx.beginPath();
  arrowCtx.moveTo(centerX, centerY);
  arrowCtx.lineTo(needleEndX, needleEndY);
  arrowCtx.lineWidth   = 4 * SCALE;
  arrowCtx.strokeStyle = "#dc3545";
  arrowCtx.stroke();

  // 화살표 머리 (삼각형으로 그리기)
  const headLen = 8 * SCALE;
  const headAngle = 25 * Math.PI / 180;
  
  // 화살표 실제 끝점 (바늘 끝에서 headLen의 절반만큼 더 앞으로)
  const arrowTipX = centerX + Math.sin(radNeedle) * (needleLen + headLen * 0.5);
  const arrowTipY = centerY - Math.cos(radNeedle) * (needleLen + headLen * 0.5);
  
  arrowCtx.beginPath();
  arrowCtx.moveTo(arrowTipX, arrowTipY);
  arrowCtx.lineTo(
    arrowTipX - Math.sin(radNeedle - headAngle) * headLen,
    arrowTipY + Math.cos(radNeedle - headAngle) * headLen
  );
  arrowCtx.lineTo(
    arrowTipX - Math.sin(radNeedle + headAngle) * headLen,
    arrowTipY + Math.cos(radNeedle + headAngle) * headLen
  );
  arrowCtx.closePath();
  arrowCtx.fillStyle = "#dc3545";
  arrowCtx.fill();

  /* ④ 중앙 원 ---------------------------------------------------- */
  arrowCtx.beginPath();
  arrowCtx.arc(centerX, centerY, 3 * SCALE, 0, 2 * Math.PI);
  arrowCtx.fillStyle = "#000";
  arrowCtx.fill();
}