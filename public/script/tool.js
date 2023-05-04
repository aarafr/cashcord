const toolForm = document.querySelector(".tool-form");
const results = document.querySelector(".results");
const historyList = document.querySelectorAll(".list-item");

toolForm.addEventListener("submit", (event) => {
  event.preventDefault();
  results.style.display = "flex";
});

for (let i = 0; i < historyList.length; i++) {
  historyList[i].addEventListener("click", function () {
    historyList[i].classList.toggle("active");
    const content = historyList[i].querySelector(".hidden-content");
    if (content.style.display === "flex") {
      content.style.display = "none";
    } else {
      content.style.display = "flex";
    }
  });
}
