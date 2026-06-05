// Efecto de fade-in al cargar la aplicación Vue
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    const grid = document.querySelector('.grid-container');
    if (grid) grid.style.opacity = '1';
  }, 50);
});

// Efecto ripple en botones al hacer clic (se agrega en el momento del click)
document.addEventListener('click', function(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  
  // Eliminar ripples anteriores
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
  
  // Eliminar después de la animación
  ripple.addEventListener('animationend', function() {
    ripple.remove();
  });
});
