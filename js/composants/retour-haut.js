/* Bouton de retour en haut : fixé à l'écran, il apparaît après un peu de défilement.
   L'anneau rose autour du bouton indique la progression dans la page. */
export function initialiserRetourHaut() {
    const bouton = document.querySelector(".pied-page__retour");
    if (!bouton || bouton.dataset.retourInitialise !== undefined) return;
    bouton.dataset.retourInitialise = "";
    document.documentElement.classList.add("retour-haut-actif");
    let frame = 0;

    function actualiser() {
        frame = 0;
        const maximum = document.documentElement.scrollHeight - window.innerHeight;
        const progression = maximum > 0 ? Math.min(1, Math.max(0, window.scrollY / maximum)) : 0;
        bouton.style.setProperty("--progression", progression.toFixed(4));
        // Visible dès que l'on a défilé de plus de 60 % de la hauteur de l'écran.
        bouton.classList.toggle("pied-page__retour--visible", window.scrollY > window.innerHeight * 0.6);
    }

    function programmer() {
        if (!frame) frame = requestAnimationFrame(actualiser);
    }

    window.addEventListener("scroll", programmer, { passive: true });
    window.addEventListener("resize", programmer);
    actualiser();
}
