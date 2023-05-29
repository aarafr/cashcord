const inputFields = document.querySelectorAll(".login input");

inputFields.forEach((input, key) => {
  input.addEventListener("input", () => {
    const label = document.querySelectorAll(".login label");
    if (input.value !== "") {
      console.log(key);
      label[key].classList.add("input-active");
      label[key].classList.remove("input-invalid");
    } else {
      console.log(key);
      label[key].classList.remove("input-active");
      label[key].classList.add("input-invalid");
    }
  });
});
