const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');
let menuOpen = false;

menuBtn.addEventListener('click', () => {
  if (!menuOpen) {
    menuBtn.classList.add('active');
    nav.classList.add('open');
    menuOpen = true;
  } else {
    menuBtn.classList.remove('active');
    nav.classList.remove('open');
    menuOpen = false;
  }
});