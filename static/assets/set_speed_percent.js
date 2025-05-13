const speedSlider = document.getElementById("speedRange");
const speedValueLabel = document.getElementById("speedValue");
const applyBtn = document.getElementById("applySpeed");

// 실시간으로 값 표시
speedSlider.addEventListener("input", () => {
  speedValueLabel.textContent = speedSlider.value + "%";
});

// 버튼 클릭 시 이벤트 발생
applyBtn.addEventListener("click", () => {
  const speed = parseInt(speedSlider.value);
  console.log("선택된 속도:", speed);

  fetch("/speed_percent", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ speed_percent: speed }),
  })
    .then((res) => res.text())
    .then((text) => console.log("✅ 서버 응답:", text))
    .catch((err) => console.error("❌ 오류:", err));
});

//최초 스피드 조절50% 로 1회 자동클릭
applyBtn.click();