console.log("[INIT] 시작");

// 버튼 3개 수집
const btns = document.querySelectorAll(
  'button.awsui-button.awsui-button-no-text.awsui-button-variant-normal.awsui-hover-child-icons'
);

// index 기반으로 minus / plus 지정
const minusButton = btns[1]; // SVG width 51 × height 6
const plusButton  = btns[2]; // SVG width 51 × height 52

console.log("[DEBUG] minusButton =", minusButton);
console.log("[DEBUG] plusButton  =", plusButton);

// 키 이벤트 리스너
document.addEventListener("keydown", (e) => {
  console.log(`[KEY] key=${e.key}, shift=${e.shiftKey}`);

  if (e.key === "-") {
    console.log("[ACTION] '-' → minus.click()");
    minusButton?.click();
  }

  // '+' 는 Shift + '=' 이므로 둘 다 처리
  if (e.key === "+" || (e.key === "=" && e.shiftKey)) {
    console.log("[ACTION] '+' → plus.click()");
    plusButton?.click();
  }
});
