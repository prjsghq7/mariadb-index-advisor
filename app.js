const research = {
  1000: {
    none: { label: "인덱스 없음", median: 0.512, iqr: "0.485–0.540", access: "ALL", key: "사용 안 함", read: 1000 },
    single: { label: "단일 인덱스", median: 0.351, iqr: "0.324–0.425", access: "ref", key: "idx_employees_department", read: 100 },
    composite: { label: "복합 인덱스", median: 0.334, iqr: "0.214–0.419", access: "ref", key: "idx_employees_department_age", read: 10 }
  },
  10000: {
    none: { label: "인덱스 없음", median: 2.043, iqr: "1.995–2.122", access: "ALL", key: "사용 안 함", read: 10000 },
    single: { label: "단일 인덱스", median: 1.126, iqr: "1.099–1.194", access: "ref", key: "idx_employees_department", read: 1000 },
    composite: { label: "복합 인덱스", median: 0.725, iqr: "0.722–0.741", access: "ref", key: "idx_employees_department_age", read: 100 }
  },
  100000: {
    none: { label: "인덱스 없음", median: 16.875, iqr: "16.552–17.161", access: "ALL", key: "사용 안 함", read: 100000 },
    single: { label: "단일 인덱스", median: 16.861, iqr: "16.765–17.053", access: "ALL", key: "사용 안 함", read: 100000 },
    composite: { label: "복합 인덱스", median: 3.645, iqr: "3.594–4.017", access: "ref", key: "idx_employees_department_age", read: 1000 }
  },
  1000000: {
    none: { label: "인덱스 없음", median: 154.715, iqr: "152.898–156.170", access: "ALL", key: "사용 안 함", read: 1000000 },
    single: { label: "단일 인덱스", median: 157.464, iqr: "154.125–159.496", access: "ALL", key: "사용 안 함", read: 1000000 },
    composite: { label: "복합 인덱스", median: 33.309, iqr: "31.166–34.218", access: "ref", key: "idx_employees_department_age", read: 10000 }
  }
};

const sizes = Object.keys(research).map(Number);
const chart = document.querySelector("#chart");
const planGrid = document.querySelector("#plan-grid");
const selectedSize = document.querySelector("#selected-size");
const recommendation = document.querySelector("#recommendation");
const improvement = document.querySelector("#improvement");
const input = document.querySelector("#row-input");
const inputMessage = document.querySelector("#input-message");
const sizeButtons = [...document.querySelectorAll("[data-size]")];

const formatNumber = (value) => new Intl.NumberFormat("ko-KR").format(value);
const formatPercent = (baseline, candidate) => ((baseline - candidate) / baseline * 100).toFixed(2);

function render(size) {
  const current = research[size];
  const entries = Object.entries(current);
  const max = Math.max(...entries.map(([, item]) => item.median));
  const bestKey = entries.reduce((best, [key, item]) => item.median < current[best].median ? key : best, "none");

  selectedSize.textContent = formatNumber(size);
  sizeButtons.forEach((button) => {
    const active = Number(button.dataset.size) === size;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  chart.innerHTML = entries.map(([key, item]) => `
    <div class="bar-row ${key === bestKey ? "is-best" : ""}">
      <div class="bar-meta">
        <strong>${item.label}</strong>
        <span>IQR ${item.iqr} ms</span>
      </div>
      <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${Math.max(2, item.median / max * 100)}%"></div></div>
      <div class="bar-value"><strong>${item.median.toFixed(3)}</strong> <span>ms</span></div>
    </div>
  `).join("");

  planGrid.innerHTML = entries.map(([key, item]) => `
    <article class="plan-card ${item.access === "ref" ? "is-used" : ""}">
      <span>${item.access === "ref" ? "INDEX USED" : "FULL SCAN"}</span>
      <h4>${item.label}</h4>
      <dl>
        <dt>접근 방식</dt><dd>${item.access}</dd>
        <dt>선택 key</dt><dd>${item.key}</dd>
        <dt>읽은 행</dt><dd>${formatNumber(item.read)}</dd>
      </dl>
    </article>
  `).join("");

  if (size >= 100000) {
    recommendation.textContent = `복합 인덱스가 가장 짧은 중앙값을 기록했습니다. 단일 인덱스는 존재했지만 실행계획에서 선택되지 않아 전체 행을 읽었습니다.`;
  } else {
    recommendation.textContent = `두 인덱스 모두 실행계획에서 선택됐고, 그중 복합 인덱스가 가장 짧은 중앙값을 기록했습니다.`;
  }
  improvement.textContent = `복합 인덱스는 인덱스 없음보다 ${formatPercent(current.none.median, current.composite.median)}%, 단일 인덱스보다 ${formatPercent(current.single.median, current.composite.median)}% 짧았습니다.`;
}

function selectClosest() {
  const normalized = input.value.replaceAll(",", "").trim();
  const value = Number(normalized);

  if (!normalized || !Number.isFinite(value) || !Number.isInteger(value)) {
    inputMessage.textContent = "행 수를 숫자로 입력해 주세요.";
    input.setAttribute("aria-invalid", "true");
    return;
  }
  if (value < 1000 || value > 1000000) {
    inputMessage.textContent = "논문의 측정 범위인 1,000~1,000,000 사이로 입력해 주세요.";
    input.setAttribute("aria-invalid", "true");
    return;
  }

  const closest = sizes.reduce((a, b) => Math.abs(b - value) < Math.abs(a - value) ? b : a);
  input.removeAttribute("aria-invalid");
  inputMessage.textContent = `${formatNumber(value)}행과 가장 가까운 ${formatNumber(closest)}행의 실제 측정 결과를 표시했습니다.`;
  render(closest);
  document.querySelector(".comparison-panel").scrollIntoView({ behavior: "smooth", block: "center" });
}

sizeButtons.forEach((button) => button.addEventListener("click", () => {
  inputMessage.textContent = "";
  input.removeAttribute("aria-invalid");
  render(Number(button.dataset.size));
}));

document.querySelector("#match-button").addEventListener("click", selectClosest);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") selectClosest();
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
render(1000000);
