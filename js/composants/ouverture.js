/* Ouverture au défilement, comme une carte que l'on déplie.
   --ouverture passe de 0 (fermée) à 1 (ouverte) pendant que l'élément monte
   du bas de l'écran jusqu'à 35 % de sa hauteur. En remontant, la carte se referme. */

const DEBUT = 1;      // le haut de l'élément touche le bas de l'écran
const FIN = 0.35;     // le haut de l'élément atteint 35 % de la hauteur de l'écran

export function initialiserOuverture(selecteur) {
    const elements = [...document.querySelectorAll(selecteur)];
    if (!elements.length) return () => {};
    const actifs = new Set(elements);
    let frame = 0;

    function calculer(element, hauteur) {
        const haut = element.getBoundingClientRect().top;
        const brut = (hauteur * DEBUT - haut) / (hauteur * (DEBUT - FIN));
        const progression = Math.min(1, Math.max(0, brut));
        // Départ et arrivée en douceur.
        const douce = progression * progression * (3 - 2 * progression);
        element.style.setProperty("--ouverture", douce.toFixed(4));
    }

    function actualiser() {
        frame = 0;
        const hauteur = window.innerHeight;
        actifs.forEach(element => calculer(element, hauteur));
    }

    function programmer() {
        if (!frame) frame = requestAnimationFrame(actualiser);
    }

    /* Seuls les éléments proches de l'écran sont recalculés pendant le défilement. */
    const observateur = "IntersectionObserver" in window ? new IntersectionObserver(entrees => {
        entrees.forEach(entree => {
            if (entree.isIntersecting) actifs.add(entree.target);
            else {
                actifs.delete(entree.target);
                entree.target.style.setProperty("--ouverture", entree.boundingClientRect.top > 0 ? "0" : "1");
            }
        });
        programmer();
    }, { rootMargin: "10% 0px 10% 0px" }) : null;

    elements.forEach(element => {
        element.classList.add("ouverture");
        observateur?.observe(element);
    });
    window.addEventListener("scroll", programmer, { passive: true });
    window.addEventListener("resize", programmer);
    actualiser();

    return () => {
        cancelAnimationFrame(frame);
        observateur?.disconnect();
        window.removeEventListener("scroll", programmer);
        window.removeEventListener("resize", programmer);
        elements.forEach(element => {
            element.classList.remove("ouverture");
            element.style.removeProperty("--ouverture");
        });
    };
}
