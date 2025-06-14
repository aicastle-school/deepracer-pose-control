// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
const URL = "./";
let model, webcam, ctx, labelContainer, maxPredictions;
let predictionChart;
let apiInterval = 100// API 호출 간격 (ms)
let lastLogTime = 0; // 마지막으로 로그를 찍은 시간 기록

// Add event listener for the Stop button
const stopToggle = document.getElementById("stopToggle");

const poseToDriveCommand = {
  NONE: { angle: 0.0, speed: 0.0 },
  "Forward": { angle: 0.0, speed: 3.0 },
  "Left": { angle: 30, speed: 3.0 },
  "Right": { angle: -30, speed: 3.0 },
};

//바로 시작
init();

async function init() {
  const modelURL = URL + "/model.json";
  const metadataURL = URL + "/metadata.json";

  // load the model and metadata
  // Refer to tmPose.loadFromFiles() in the API to support files from a file picker
  model = await tmPose.load(modelURL, metadataURL);
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
    const topSpeed = topAction.speed;

    //////// Mean 추출 ////////
    let totalProbability = 0;
    let weightedAngleSum = 0;
    let weightedSpeedSum = 0;

    for (const predictionItem of prediction) {
      const { className, probability } = predictionItem;
      
      // NONE 클래스는 평균 계산에서 제외
      if (className === "NONE") continue;
      
      const { angle, speed } = poseToDriveCommand[className] || {
        angle: 0,
        speed: 0,
      };

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
      fetch("/move", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })
        .then((res) => res.text()) // Handle response
        .then((text) => {
          // console.log("✅ Server response:", text);
        })
        .catch((err) => {
          // console.error("❌ Error:", err)
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

stopToggle.addEventListener("change", () => {
  //stop 체크박스가 on 이 아닐때만 move 실행
  const isChecked = stopToggle.checked;
  //console.log(isChecked)
  if(isChecked){
    fetch("/stop", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
    .then((res) => res.text())
    .then((text) => {
      // console.log("✅ Stop command sent successfully:", text);
    })
    .catch((err) => {
      // console.error("❌ Error sending stop command:", err)
    });
  }
});

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
      
      // 스피드 변경 API 호출
      fetch("/speed_percent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ speed_percent: currentSpeed }),
      });
    }
  } else if (event.key === "-") {
    event.preventDefault();
    let currentSpeed = parseInt(speedRange.value);
    if (currentSpeed > 1) {
      currentSpeed -= 1;
      speedRange.value = currentSpeed;
      speedValue.textContent = currentSpeed + "%";
      
      // 스피드 변경 API 호출
      fetch("/speed_percent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ speed_percent: currentSpeed }),
      });
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
