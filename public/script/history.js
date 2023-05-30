const historyItems = document.querySelectorAll(".history-item");

historyItems.forEach((value) => {
  value.addEventListener("click", () => {
    const target = value.children[1];
    target.classList.toggle("hidden");
    target.classList.toggle("visible");
  });
});
