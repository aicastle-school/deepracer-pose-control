// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
let model, webcam, ctx, labelContainer, maxPredictions;
let predictionChart;
let apiInterval = 100// API 호출 간격 (ms)
let lastLogTime = 0; // 마지막으로 로그를 찍은 시간 기록

// 최대 속도를 전역 변수로 설정 (0.0 ~ 1.0), 초기값 50%
window.maxSpeed = 0.5;

// 배터리에 따른 속도 설정 (관리용)
const SPEED_AT_FULL_BATTERY = 1.6;  // 배터리 100%일 때 속도
const SPEED_AT_EMPTY_BATTERY = Math.min(SPEED_AT_FULL_BATTERY + 0.6, 4.0); // 배터리 0%일 때 속도 (최대 4.0)

// Add event listener for the Stop button
const stopToggle = document.getElementById("stopToggle");

// Speed 슬라이더 요소
const speedSlider = document.getElementById("speedRange");
const speedValueLabel = document.getElementById("speedValue");

// 실시간으로 값 표시
if (speedSlider && speedValueLabel) {
  speedSlider.addEventListener("input", () => {
    speedValueLabel.textContent = speedSlider.value + "%";
  });

  // 슬라이더 변경 시 maxSpeed 변수 업데이트
  speedSlider.addEventListener("change", () => {
    const speed = parseInt(speedSlider.value);
    // maxSpeed 변수 업데이트 (0.0 ~ 1.0)
    window.maxSpeed = speed / 100.0;
    console.log("maxSpeed 업데이트:", speed / 100.0);
  });
}

// 배터리에 따라 동적으로 speed를 계산하는 함수
function getSpeedByBattery(batteryPercent) {
  // 배터리 100% → SPEED_AT_FULL_BATTERY
  // 배터리 0% → SPEED_AT_EMPTY_BATTERY
  // 선형 보간
  const speed = SPEED_AT_FULL_BATTERY + ((100 - batteryPercent) / 100.0) * (SPEED_AT_EMPTY_BATTERY - SPEED_AT_FULL_BATTERY);
  return Math.max(SPEED_AT_FULL_BATTERY, Math.min(SPEED_AT_EMPTY_BATTERY, speed));
}

const poseToDriveCommand = {
  NONE: { angle: 0.0, speed: 0.0 },
  "Forward": { angle: 0.0, speed: 3.0 }, // 기본값 (배터리에 따라 동적 변경됨)
  "Left": { angle: 30, speed: 3.0 },
  "Right": { angle: -30, speed: 3.0 },
};

// IP 주소를 가져오는 함수
function getBaseURL() {
  const ipInput = document.getElementById("ipAddress");
  const ip = ipInput?.value.trim();
  if (ip) {
    return `https://${ip}`;
  }
  return ""; // 기본값은 현재 호스트 사용
}

// 비디오 URL 업데이트 함수
function updateVideoURL() {
  const baseURL = getBaseURL();
  const frontCamera = document.getElementById("frontCamera");
  if (baseURL) {
    frontCamera.src = `${baseURL}/route?topic=/camera_pkg/display_mjpeg&width=480&height=360`;
  } else {
    frontCamera.src = "/video.jpg"; // 기본값
  }
}

// IP 주소 입력 필드에 이벤트 리스너 추가
document.addEventListener("DOMContentLoaded", () => {
  const ipInput = document.getElementById("ipAddress");
  if (ipInput) {
    // 셀렉트박스 변경 시 비디오 URL 업데이트
    ipInput.addEventListener("change", () => {
      updateVideoURL();
      checkIPAndToggleStop();
    });
    // 입력값 변경 시에도 처리 (기존 input 타입 호환)
    ipInput.addEventListener("input", () => {
      updateVideoURL();
      checkIPAndToggleStop();
    });
    // 초기 로드 시에도 URL 업데이트 및 Stop 체크
    updateVideoURL();
    checkIPAndToggleStop();
  }
});

// IP 주소가 비어있으면 Stop 자동 활성화
function checkIPAndToggleStop() {
  const ipInput = document.getElementById("ipAddress");
  const ip = ipInput?.value.trim();
  const stopToggle = document.getElementById("stopToggle");
  
  if (!ip) {
    // IP가 비어있으면 Stop 활성화
    stopToggle.checked = true;
    // 배터리 표시 초기화
    document.getElementById("batteryLevel").textContent = "--";
    // 배터리 히스토리 초기화
    batteryHistory = [];
    currentBatteryLevel = 100;
  } else {
    // IP가 입력되면 Stop 비활성화
    stopToggle.checked = false;
    
    // IP 변경 시 배터리 히스토리 초기화 (새로운 차량)
    batteryHistory = [];
    currentBatteryLevel = 100;
    
    // drive_mode를 manual로 전환
    setDriveModeToManual(ip);
    
    // 배터리 레벨 즉시 체크
    fetchBatteryLevel();
  }
}

// drive_mode를 manual로 설정하는 함수
function setDriveModeToManual(ip) {
  const baseURL = `https://${ip}`;
  
  fetch(`${baseURL}/api/drive_mode`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drive_mode: "manual" }),
  })
    .then((res) => {
      if (!res.ok) {
        return res.text().then(text => {
          console.error("❌ Drive mode API error (status " + res.status + "):", text);
          throw new Error("Failed to set drive mode");
        });
      }
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return res.json();
      } else {
        return res.text();
      }
    })
    .then((data) => {
      console.log("✅ Drive mode set to manual:", data);
      // manual 모드 설정 후 start 실행
      setVehicleStart(ip);
    })
    .catch((err) => {
      console.error("❌ Error setting drive mode:", err);
    });
}

// 차량을 start 상태로 설정하는 함수
function setVehicleStart(ip) {
  const baseURL = `https://${ip}`;
  
  fetch(`${baseURL}/api/start_stop`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start_stop: "start" }),
  })
    .then((res) => {
      if (!res.ok) {
        return res.text().then(text => {
          console.error("❌ Start/Stop API error (status " + res.status + "):", text);
          throw new Error("Failed to start vehicle");
        });
      }
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return res.json();
      } else {
        return res.text();
      }
    })
    .then((data) => {
      console.log("✅ Vehicle started:", data);
    })
    .catch((err) => {
      console.error("❌ Error starting vehicle:", err);
    });
}

// 배터리 레벨 히스토리 (최근 60개 저장)
let batteryHistory = [];
const BATTERY_HISTORY_SIZE = 60;
let currentBatteryLevel = 100; // 현재 배터리 레벨 (평균값)

// 배터리 레벨을 가져오는 함수
function fetchBatteryLevel() {
  const baseURL = getBaseURL();
  if (!baseURL) {
    // IP가 없으면 배터리 표시를 --로 초기화
    document.getElementById("batteryLevel").textContent = "--";
    batteryHistory = []; // 히스토리 초기화
    return;
  }
  
  fetch(`${baseURL}/api/get_battery_level`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch battery level");
      }
      return res.json();
    })
    .then((data) => {
      if (data.success && data.battery_level !== undefined) {
        // 배터리 레벨은 0~10 범위이므로 퍼센트로 변환
        const level = (data.battery_level / 10.0) * 100;
        
        // 히스토리에 추가
        batteryHistory.push(level);
        
        // 최근 60개만 유지
        if (batteryHistory.length > BATTERY_HISTORY_SIZE) {
          batteryHistory.shift();
        }
        
        // 평균 계산
        const averageLevel = batteryHistory.reduce((sum, val) => sum + val, 0) / batteryHistory.length;
        const displayLevel = Math.round(averageLevel);
        
        // 현재 배터리 레벨 업데이트 (speed 계산에 사용)
        currentBatteryLevel = averageLevel;
        
        const batteryElement = document.getElementById("batteryLevel");
        
        // 배터리 레벨에 따라 색상 변경
        if (displayLevel > 50) {
          batteryElement.className = "h5 font-weight-bold text-success";
        } else if (displayLevel > 20) {
          batteryElement.className = "h5 font-weight-bold text-warning";
        } else {
          batteryElement.className = "h5 font-weight-bold text-danger";
        }
        
        batteryElement.textContent = displayLevel + "%";
        console.log("🔋 Battery level (avg of " + batteryHistory.length + "):", displayLevel + "%");
      }
    })
    .catch((err) => {
      console.error("❌ Error fetching battery level:", err);
      document.getElementById("batteryLevel").textContent = "--";
    });
}

// 1초마다 배터리 레벨 업데이트
setInterval(fetchBatteryLevel, 1000);

// 페이지 로드 시 즉시 한 번 실행
setTimeout(fetchBatteryLevel, 1000);

// Restart 버튼 이벤트 리스너
document.addEventListener("DOMContentLoaded", () => {
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      const baseURL = getBaseURL();
      if (!baseURL) {
        alert("IP 주소를 먼저 입력해주세요!");
        return;
      }

      if (!confirm("DeepRacer를 재시작하시겠습니까?")) {
        return;
      }

      restartBtn.disabled = true;
      restartBtn.textContent = "재시작 중...";

      fetch(`${baseURL}/restart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Restart failed");
          }
          return res.json();
        })
        .then((data) => {
          console.log("✅ Restart initiated:", data);
          alert("DeepRacer 재시작이 시작되었습니다. 잠시 후 다시 연결해주세요.");
          
          // 5초 후 버튼 활성화
          setTimeout(() => {
            restartBtn.disabled = false;
            restartBtn.innerHTML = "🔄 Restart";
          }, 5000);
        })
        .catch((err) => {
          console.error("❌ Restart error:", err);
          alert("재시작 실패: " + err.message);
          restartBtn.disabled = false;
          restartBtn.innerHTML = "🔄 Restart";
        });
    });
  }
});

//바로 시작
init();

async function init() {
  // load the model and metadata
  // Refer to tmPose.loadFromFiles() in the API to support files from a file picker
  // Use relative URL (URL variable) so GH Pages or nested hosting fetches from repo path
  model = await tmPose.load("./model.json", "./metadata.json");
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const flip = true; // whether to flip the webcam
  webcam = new tmPose.Webcam(200, 200, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam
  webcam.play();

  window.requestAnimationFrame(loop);

  // append/get elements to the DOM
  const canvas = document.getElementById("canvas");
  canvas.width = 200;
  canvas.height = 200;
  ctx = canvas.getContext("2d");

  // 차트 초기화
  initCharts();
}

async function loop(timestamp) {
  webcam.update(); // update the webcam frame
  await predict();
  window.requestAnimationFrame(loop);
}

async function predict() {
  //////// Prediction ////////
  const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
  const prediction = await model.predict(posenetOutput);
  drawPose(pose);

  //////// 프로그래스 바 ////////
  const predictionMap = {};
  for (let i = 0; i < maxPredictions; i++) {
    const label = prediction[i].className;
    const prob = prediction[i].probability;
    predictionMap[label] = prob;
    // console.log(`📌 ${label}: ${prob.toFixed(4)}`);
    // console.log(label)
  }
  updateProgressBars(predictionMap);

  /////// Move API ///////
  const now = Date.now();
  if (now - lastLogTime > apiInterval) {
    lastLogTime = now;

    /////// Top 추출 ///////
    const top = prediction.reduce((prev, current) =>
      prev.probability > current.probability ? prev : current
    );
    const topAction = poseToDriveCommand[top.className];
    const topAngle = topAction.angle;
    // 배터리 레벨에 따라 speed 동적 조정
    const adjustedSpeed = top.className === "NONE" ? 0.0 : getSpeedByBattery(currentBatteryLevel);
    const topSpeed = adjustedSpeed;

    //////// Mean 추출 ////////
    let totalProbability = 0;
    let weightedAngleSum = 0;
    let weightedSpeedSum = 0;
    
    // 배터리에 따라 조정된 speed
    const batteryAdjustedSpeed = getSpeedByBattery(currentBatteryLevel);

    for (const predictionItem of prediction) {
      const { className, probability } = predictionItem;
      
      // NONE 클래스는 평균 계산에서 제외
      if (className === "NONE") continue;
      
      const { angle } = poseToDriveCommand[className] || {
        angle: 0,
        speed: 0,
      };
      
      // 배터리 조정된 speed 사용
      const speed = batteryAdjustedSpeed;

      totalProbability += probability;
      weightedAngleSum += angle * probability;
      weightedSpeedSum += speed * probability;
    }

    // NONE이 가장 높은 확률이면 평균값도 0으로 설정
    const noneProb = predictionMap["NONE"] || 0;
    const isNoneDominant = noneProb > 0.5; // NONE이 50% 이상이면
    
    const meanAngle = (totalProbability > 0 && !isNoneDominant) ? weightedAngleSum / totalProbability : 0;
    const meanSpeed = (totalProbability > 0 && !isNoneDominant) ? weightedSpeedSum / totalProbability : 0;

    // console.log("평균값");
    // console.log(`meanAngle: ${meanAngle}`);
    // console.log(`meanSpeed: ${meanSpeed}`);

    //////// Move ////////
    const smoothModeCheckbox = document.getElementById("smoothToggle");
    
    //check 값 확인
    const useMean = smoothModeCheckbox.checked;
    // console.log("스무스 true/false 확인 " + useMean)

    const currentAngle = useMean ? meanAngle : topAngle;
    const currentSpeed = useMean ? meanSpeed : topSpeed;

    document.getElementById("currentSpeed").textContent = currentSpeed.toFixed(2) + " m/s";
    document.getElementById("currentAngle").textContent = currentAngle.toFixed(1) + "°";

    // 🚀 화살표 실시간 갱신
    drawArrow(currentAngle, currentSpeed);

    const data = useMean ? { angle: meanAngle, speed: meanSpeed } : { angle: topAngle, speed: topSpeed };
    // console.log("🚀 Sending data in mode:", useMean ? "Smooth (Mean)" : "Top");
    // console.log("Data:", data);

    if(!stopToggle.checked){
      //console.log("스탑체크되있지않을때만 보내기")
      const baseURL = getBaseURL();
      
      // angle과 throttle을 -1.0 ~ 1.0 범위로 변환
      // angle: -30 ~ 30도를 -1.0 ~ 1.0으로 변환 (부호 반대)
      const normalizedAngle = -(data.angle / 30.0);
      // throttle: 0 ~ 4.0 m/s를 -1.0 ~ 1.0으로 변환 (부호 반대)
      const normalizedThrottle = -(data.speed / 4.0);
      
      console.log("📤 Sending to server:", {
        angle: normalizedAngle,
        throttle: normalizedThrottle,
        max_speed: window.maxSpeed
      });
      
      fetch(`${baseURL}/api/manual_drive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          angle: normalizedAngle, 
          throttle: normalizedThrottle,
          max_speed: window.maxSpeed
        }),
      })
        .then((res) => {
          console.log("📡 Response status:", res.status);
          if (!res.ok) {
            return res.text().then(text => {
              console.error("❌ Server error (status " + res.status + "):", text);
              throw new Error("Server returned " + res.status);
            });
          }
          // Content-Type 확인
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return res.json();
          } else {
            return res.text().then(text => {
              console.warn("⚠️ Server returned non-JSON:", text.substring(0, 200));
              return { success: true }; // 임시로 성공 처리
            });
          }
        })
        .then((data) => {
          console.log("✅ Server response:", data);
        })
        .catch((err) => {
          console.error("❌ Error:", err)
        });
      }
  }
}

// draw the poses on the canvas
function drawPose(pose) {
  ctx.drawImage(webcam.canvas, 0, 0);
  if (pose) {
    const minPartConfidence = 0.5;
    tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
    tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
  }
}

//차트 초기화
function initCharts() {
  const ctx = document.getElementById("predictionChart").getContext("2d");
  predictionChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        "NONE",
        "Forward",
        "Left",
        "Right",
      ],
      datasets: [
        {
          label: "예측 확률 (%)",
          data: [0, 0, 0, 0], // 초기값은 모두 0%
          backgroundColor: [
            "#6c757d", // NONE (회색)
            "#ff0019", // 직진 (빨강)
            "#28a745", // 좌회전 (초록)
            "#007bff", // 우회전 (파랑)
          ],
          borderRadius: 8, // 모서리 둥글게
          barThickness: 20, // 막대 두께
        },
      ],
    },
    options: {
      indexAxis: "y", // ✅ 수평 막대 그래프로 변경
      responsive: true,
      animation: { duration: 200 },
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: {
            callback: (value) => value + "%",
          },
          grid: {
            display: false,
          },
        },
        y: {
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw}%`,
          },
        },
      },
    },
  });
}

function updateProgressBars(predictionMap) {
  const labels = [
    "NONE",
    "Forward",
    "Left",
    "Right",
  ];
  const updatedData = labels.map((label) =>
    Math.round((predictionMap[label] || 0) * 100)
  );
  predictionChart.data.datasets[0].data = updatedData;
  predictionChart.update();
}

// 키보드 화살표 키로 스피드 조절
document.addEventListener("keydown", (event) => {
  const speedRange = document.getElementById("speedRange");
  const speedValue = document.getElementById("speedValue");
  const smoothToggle = document.getElementById("smoothToggle");
  
  if (event.key === "+") {
    event.preventDefault();
    let currentSpeed = parseInt(speedRange.value);
    if (currentSpeed < 100) {
      currentSpeed += 1;
      speedRange.value = currentSpeed;
      speedValue.textContent = currentSpeed + "%";
      
      // maxSpeed 변수 업데이트 (0.0 ~ 1.0)
      window.maxSpeed = currentSpeed / 100.0;
    }
  } else if (event.key === "-") {
    event.preventDefault();
    let currentSpeed = parseInt(speedRange.value);
    if (currentSpeed > 1) {
      currentSpeed -= 1;
      speedRange.value = currentSpeed;
      speedValue.textContent = currentSpeed + "%";
      
      // maxSpeed 변수 업데이트 (0.0 ~ 1.0)
      window.maxSpeed = currentSpeed / 100.0;
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    // Stop 버튼 토글
    stopToggle.checked = !stopToggle.checked;
    
    // Stop 이벤트 수동 트리거 (변수명 변경)
    const changeEvent = new Event('change');
    stopToggle.dispatchEvent(changeEvent);
  } else if (event.key === " ") {
    event.preventDefault();
    // Smooth 모드 토글
    smoothToggle.checked = !smoothToggle.checked;
  }
});
