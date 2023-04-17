let hamburger = document.getElementById("hamburger-icon");
hamburger.addEventListener("click", headerEvent);

function headerEvent() {
  let nav = document.querySelector("header nav");
  let ul = document.querySelector("header ul");

  if (nav.style.top === "0px" || ul.style.top === "0px") {
    nav.style.top = "-220px";
    ul.style.top = "-220px";
    hamburger.textContent  = "menu";
  } else {
    nav.style.top = "-10px";
    ul.style.top = "0px";
    hamburger.textContent  = "close";
  }
  nav.querySelectorAll('li').forEach(function(li) {
    li.style.pointerEvents = 'none';
  });
  setTimeout(function() {
    nav.querySelectorAll('li').forEach(function(li) {
      li.style.pointerEvents = 'auto';
    });
  }, 500);
}