export default class TutorialEngine {
  constructor(pasos, opciones = {}) {
    this.pasos = pasos;
    this.pasoActual = 0;
    this.activo = false;
    this.elementoResaltado = null;

    // Callbacks para comunicar eventos a Vue
    this.onStateChange = opciones.onStateChange || (() => {});
    this.onClickElemento = opciones.onClickElemento || (() => {});
  }

  iniciar() {
    this.activo = true;
    this.pasoActual = 0;
    this._resaltar();
    this._notificar();
  }

  siguiente() {
    if (this.pasoActual < this.pasos.length - 1) {
      this.pasoActual++;
      this._resaltar();
      this._notificar();
    } else {
      this.finalizar();
    }
  }

  anterior() {
    if (this.pasoActual > 0) {
      this.pasoActual--;
      this._resaltar();
      this._notificar();
    }
  }

  finalizar() {
    this._limpiarResaltado();
    this.activo = false;
    this.pasoActual = 0;
    this._notificar();
  }

  _resaltar() {
    this._limpiarResaltado();
    const paso = this.pasos[this.pasoActual];
    if (!paso) return;

    const el = document.querySelector(paso.selector);
    if (el) {
      el.classList.add("tutorial-highlight");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      this.elementoResaltado = el;

      // Desbloquear pointer-events en el elemento para que sea clickeable
      el.style.pointerEvents = "auto";
    }
  }

  _limpiarResaltado() {
    if (this.elementoResaltado) {
      this.elementoResaltado.classList.remove("tutorial-highlight");
      this.elementoResaltado.style.pointerEvents = "";
      this.elementoResaltado = null;
    }
  }

  manejarClick(event) {
    if (!this.activo || !this.elementoResaltado) return;
    const rect = this.elementoResaltado.getBoundingClientRect();
    const dentro =
      event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (dentro) {
      this.onClickElemento(this.pasoActual);
    }
  }

  _notificar() {
    this.onStateChange({
      activo: this.activo,
      pasoActual: this.pasoActual,
      totalPasos: this.pasos.length,
      tooltipStyle: this.getTooltipStyle(),
      paso: this.pasos[this.pasoActual]
    });
  }

  getTooltipStyle() {
    if (!this.elementoResaltado) return { display: "none" };
    const r = this.elementoResaltado.getBoundingClientRect();
    const top = r.bottom + window.scrollY + 10;
    const left = r.left + window.scrollX + r.width / 2;
    const viewportHeight = window.innerHeight;
    const tooltipHeight = 120; // ajusta según tu CSS
    const finalTop = (top + tooltipHeight > viewportHeight)
      ? r.top + window.scrollY - tooltipHeight - 10
      : top;
    return {
      top: `${finalTop}px`,
      left: `${left}px`,
      transform: "translateX(-50%)",
      position: "fixed",
      zIndex: 9999,
      pointerEvents: "auto"
    };
  }
}
