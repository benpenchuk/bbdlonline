let currentIndex = 0;
const items = document.querySelectorAll('.carousel-item');

function showSlide(index) {
  items.forEach((item, i) => {
    item.classList.remove('active');
    if (i === index) {
      item.classList.add('active');
    }
  });
}

function moveCarousel(step) {
  currentIndex += step;
  if (currentIndex < 0) {
    currentIndex = items.length - 1;
  } else if (currentIndex >= items.length) {
    currentIndex = 0;
  }
  showSlide(currentIndex);
}

// initialize the first slide
document.addEventListener('DOMContentLoaded', () => showSlide(currentIndex));