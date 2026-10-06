/* Une seule entrée au chargement : descente, balancement, puis immobilité. */
export function initialiserCarteIdentite(carte) {
    if (!carte || carte.dataset.entreeCarteInitialisee !== undefined) return;
    carte.dataset.entreeCarteInitialisee = "";
    carte.draggable = false;
    const reduction = matchMedia("(prefers-reduced-motion: reduce)");
    if (reduction.matches || (location.hash && !["#accueil", "#a-propos", "#contenu"].includes(location.hash))) return;
    const controle = new AbortController();
    const options = { signal: controle.signal };
    function terminer() {
        carte.classList.remove("carte-entree");
        carte.style.removeProperty("--carte-depart");
        controle.abort();
    }
    function lancer() {
        if (controle.signal.aborted || reduction.matches) return;
        const rect = carte.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= innerHeight) { terminer(); return; }
        carte.style.setProperty("--carte-depart", `${-Math.max(24, rect.bottom + 24)}px`);
        carte.classList.add("carte-entree");
        carte.addEventListener("animationend", terminer, { ...options, once: true });
    }
    reduction.addEventListener("change", () => { if (reduction.matches) terminer(); }, options);
    if (carte.complete && carte.naturalWidth > 0) lancer();
    else {
        carte.addEventListener("load", lancer, { ...options, once: true });
        carte.addEventListener("error", terminer, { ...options, once: true });
    }
}
