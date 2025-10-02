// =============================
// Mobile Menu Toggle
// =============================
function toggleMenu() {
  const navLinks = document.getElementById("navLinks");
  if (navLinks) navLinks.classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded, initializing scripts...");

  // =============================
  // TradingView Chart
  // =============================
  function waitForTradingView(callback) {
    if (window.TradingView && window.TradingView.widget) {
      callback();
    } else {
      console.log("TradingView not ready, retrying...");
      setTimeout(() => waitForTradingView(callback), 300);
    }
  }

  function renderTradingViewChart() {
    console.log("Rendering TradingView line chart...");

    new TradingView.MediumWidget({
      container_id: "tradingview_chart",
      symbols: [["BTC/USDT", "BINANCE:BTCUSDT"]],
      greyText: "Quotes by",
      gridLineColor: "#e6e6e6",
      fontColor: "#000000",
      underLineColor: "#ffffff",
      trendLineColor: "#284ab9ff",
      width: "100%",
      height: 600,
      locale: "en",
      largeChartUrl: "",
      showVolume: true,
      colorTheme: "light",
    });
  }

  waitForTradingView(renderTradingViewChart);

  // =============================
  // Withdrawal Popup
  // =============================
const withdrawalNames = [
  "Emily Davis", "Haruto Tanaka", "George Baker", "Aya Morita", "Michael Johnson",
  "Sakura Fujimoto", "Amelia Evans", "Riku Takahashi", "Jessica Green", "Yuto Maeda",
  "Oliver Smith", "Mio Watanabe", "Sophia Harris", "Takumi Yamaguchi", "Thomas Carter",
  "Lucy Adams", "Rina Kaneko", "James White", "Aoi Kobayashi", "Charlotte King",
  "Hina Ishikawa", "Jack Turner", "Ashley Wilson", "Itsuki Okada", "William Phillips",
  "Grace Lewis", "Ren Yamamoto", "Madison Thompson", "Yui Sato", "Oscar Hughes",
  "Minami Aoyama", "Harry Scott", "Poppy Richardson", "Joshua Miller", "Kaito Nakamura",
  "Ella Campbell", "Misaki Ono", "Souta Matsumoto", "Andrew Robinson", "Olivia Moore",
  "Nana Otsuka", "Sophie Stewart", "Ryo Hosokawa", "Mei Shimizu", "Lucy Bennett",
  "Anthony Clark", "Hinata Yamazaki", "Chloe Mitchell", "Yuma Kojima", "Henry Morris",
  "Shota Kuroda", "Ava Young", "Nanami Sugiyama", "Daniel Anderson", "Isabella Walker",
  "Freya Foster", "Joseph Hall", "Alfie Ward", "Noa Shibata", "Charlotte King",
  "Tsubasa Hasegawa", "Christopher Brown", "Sena Murakami", "Matthew Taylor", "Megan Rogers",
  "Reo Fujii", "Ella Campbell", "Lily Bennett", "Marina Hoshino", "Sophie Stewart",
  "Ethan Allen", "Mayu Ishii", "Sosuke Sakamoto", "Lucy Adams", "Shun Tani",
  "Haruna Takeuchi", "Chloe Mitchell", "Kouki Iwata", "Poppy Richardson", "Yoshiki Kuwahara",
  "Akira Hayashi", "Sayaka Uchida", "Keisuke Araki", "Miyu Takeda", "Sarah Martinez",
  "Daiki Yoshida", "Riko Nishimura", "Hikari Yamagata", "Lily Bennett", "Akira Hayashi",
  "Megan Rogers", "Emi Mori", "Takuya Endo", "Hiroshi Taniguchi", "Kaede Matsuda"
];

  const amounts = Array.from({ length: 50 }, () =>
    Math.floor(Math.random() * (100000 - 10000 + 1)) + 10000
  );

  function showWithdrawalNotification() {
    const name = withdrawalNames[Math.floor(Math.random() * withdrawalNames.length)];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    const popup = document.getElementById("withdrawal-popup");

    if (!popup) return;

    popup.innerText = `${name} just withdrew $${amount.toLocaleString()}`;
    popup.classList.add("show");

    setTimeout(() => {
      popup.classList.remove("show");
    }, 3000);
  }

  // Show first popup after 2s, then every 10s
  setTimeout(showWithdrawalNotification, 2000);
  setInterval(showWithdrawalNotification, 10000);
});
