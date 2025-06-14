const speedSlider = document.getElementById("speedRange");
const speedValueLabel = document.getElementById("speedValue");
// const applyBtn = document.getElementById("applySpeed");

// 실시간으로 값 표시
speedSlider.addEventListener("input", () => {
  speedValueLabel.textContent = speedSlider.value + "%";
});

// 슬라이더 체인지시시 이벤트 발생
speedSlider.addEventListener("change", () => {
  setSpeed();
});

//최초 스피드 조절50% 로 1회 자동세팅
setSpeed();

//스피드 세팅팅
function setSpeed(){

  const speed = parseInt(speedSlider.value);
  // console.log("선택된 속도:", speed);

  fetch("/speed_percent", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ speed_percent: speed }),
  })
    .then((res) => res.text())
    .then((text) => {
      // console.log("✅ 서버 응답:", text)
    })
    .catch((err) => {
      // console.error("❌ 오류:", err)
    });
}
