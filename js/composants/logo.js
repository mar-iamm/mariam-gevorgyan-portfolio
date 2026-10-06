/* Logos de l'en-tête et du pied de page :
   à chaque survol, l'ombre colorée prend la couleur suivante de la palette. */

const COULEURS = ["var(--rose)", "var(--jaune)", "var(--vert)", "var(--bleu)"];

export function initialiserLogos() {
    document.querySelectorAll(".entete__marque, .pied-page__marque").forEach(lien => {
        if (lien.dataset.logoInitialise !== undefined) return;
        lien.dataset.logoInitialise = "";
        let index = 0;
        function changerCouleur() {
            lien.style.setProperty("--couleur-logo", COULEURS[index]);
            index = (index + 1) % COULEURS.length;
        }
        changerCouleur();
        lien.addEventListener("pointerenter", changerCouleur);
        lien.addEventListener("focus", changerCouleur);
    });
}