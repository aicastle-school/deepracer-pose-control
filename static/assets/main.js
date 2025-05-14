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
  NONE: { angle: 0.0, speed: 0.0 }, // 정지            0.3
  "Fast-Forward": { angle: 0.0, speed: 4.0 }, // 빠른 직진        0.1
  "Slow-Forward": { angle: 0.0, speed: 2.0 }, // 느린 직진        0.2
  "Fast-Left": { angle: 30, speed: 4.0 }, // 빠른 좌회전      0.1
  "Slow-Left": { angle: 30, speed: 2.0 }, // 느린 좌회전      0.3
  "Fast-Right": { angle: -30, speed: 4.0 }, // 빠른 우회전      0
  "Slow-Right": { angle: -30, speed: 2.0 }, // 느린 우회전      0
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
      const { angle, speed } = poseToDriveCommand[className] || {
        angle: 0,
        speed: 0,
      };

      totalProbability += probability;
      weightedAngleSum += angle * probability;
      weightedSpeedSum += speed * probability;
    }

    const meanAngle =
      totalProbability > 0 ? weightedAngleSum / totalProbability : 0;
    const meanSpeed =
      totalProbability > 0 ? weightedSpeedSum / totalProbability : 0;

    console.log("평균값");
    console.log(`meanAngle: ${meanAngle}`);
    console.log(`meanSpeed: ${meanSpeed}`);

    //////// Move ////////
    const smoothModeCheckbox = document.getElementById("smoothToggle");
    
    //check 값 확인
    const useMean = smoothModeCheckbox.checked;
    console.log("스무스 true/false 확인 " + useMean)

    const currentAngle = useMean ? meanAngle : topAngle;
    const currentSpeed = useMean ? meanSpeed : topSpeed;

    document.getElementById("currentSpeed").textContent = currentSpeed.toFixed(2) + " m/s";
    document.getElementById("currentAngle").textContent = currentAngle.toFixed(1) + "°";

    // 🚀 화살표 실시간 갱신
    drawArrow(currentAngle, currentSpeed);

    const data = useMean ? { angle: meanAngle, speed: meanSpeed } : { angle: topAngle, speed: topSpeed };
    console.log("🚀 Sending data in mode:", useMean ? "Smooth (Mean)" : "Top");
    console.log("Data:", data);

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
          console.log("✅ Server response:", text);
        })
        .catch((err) => console.error("❌ Error:", err));
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
        "Fast-Forward",
        "Slow-Forward",
        "Fast-Left",
        "Slow-Left",
        "Fast-Right",
        "Slow-Right",
      ],
      datasets: [
        {
          label: "예측 확률 (%)",
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: [
            "#6c757d", // NONE (회색)
            "#ffc107", // 빠른 직진 (노랑)
            "#fce18f", // 느린 직진 (연노랑)
            "#ff0019", // 빠른 좌회전 (빨강)
            "#f97a87", // 느린 좌회전 (연빨강)
            "#007bff", // 빠른 우회전 (파랑)
            "#69a7e8", // 느린 우회전 (연파랑)
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
    "Fast-Forward",
    "Slow-Forward",
    "Fast-Left",
    "Slow-Left",
    "Fast-Right",
    "Slow-Right",
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
      console.log("✅ Stop command sent successfully:", text);
    })
    .catch((err) => console.error("❌ Error sending stop command:", err));
  }
});
