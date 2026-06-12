document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    const grid = document.querySelector('.grid-container');
    if (grid) grid.style.opacity = '1';
  }, 50);
});

document.addEventListener('click', function(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  const ripples = btn.querySelectorAll('.ripple');
  ripples.forEach(r => r.remove());
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', function() {
    ripple.remove();
  });
});
