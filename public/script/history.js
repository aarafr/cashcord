const historyItems = document.querySelectorAll(".history-item");

historyItems.forEach((value) => {
  value.addEventListener("click", () => {
    const target = value.querySelectorAll("div > div");
    console.log(target);
    target.forEach((target) => {
      target.classList.toggle("hidden");
      target.classList.toggle("visible");
    });
  });
});
