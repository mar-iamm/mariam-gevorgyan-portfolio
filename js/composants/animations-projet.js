import { initialiserCurseur } from "./curseur.js";
import { initialiserMenuMobile } from "./menu-mobile.js";
import { initialiserOuverture } from "./ouverture.js";
import { initialiserRetourHaut } from "./retour-haut.js";
import { initialiserRevelations } from "./revelations.js";
import { initialiserLogos } from "./logo.js";

/* Éléments qui apparaissent et disparaissent au défilement, dans les deux sens. */
const ELEMENTS_REVELES = [
    ".projet-presentation__titre",
    ".projet-presentation__description",
    ".role-projet",
    ".demarche-projet__titre",
    ".demarche-projet__texte",
    ".outils-projet__titre",
    ".outil-projet"
].join(", ");

/* Sections sombres et cadres de navigateur qui s'ouvrent au défilement. */
const ELEMENTS_OUVERTS = ".projet-presentation, .galerie";

/* Point d'entrée : uniquement projet.html, sans initialisation en double. */
export function initialiserAnimationsProjet() {
    if (!document.body.classList.contains("page-projet")) return;
    if (document.body.dataset.animationsInitialisees !== undefined) return;
    document.body.dataset.animationsInitialisees = "";
    document.body.classList.add("animations-projet");
    document.documentElement.classList.add("defilement-accueil");
    const mouvementReduit = matchMedia("(prefers-reduced-motion: reduce)");
    const souris = matchMedia("(hover: hover) and (pointer: fine) and (forced-colors: none)");
    let arreterRevelations = () => {};
    let arreterOuverture = () => {};
    let arreterCurseur = () => {};
    let premierPassage = true;

    function synchroniser() {
        arreterRevelations();
        arreterOuverture();
        arreterCurseur();
        arreterRevelations = arreterOuverture = arreterCurseur = () => {};
        if (mouvementReduit.matches) {
            premierPassage = false;
            return;
        }
        // Au chargement, le premier titre et sa description apparaissent eux aussi.
        arreterRevelations = initialiserRevelations(ELEMENTS_REVELES, { entreeAuChargement: premierPassage });
        premierPassage = false;
        arreterOuverture = initialiserOuverture(ELEMENTS_OUVERTS);
        if (souris.matches) {
            arreterCurseur = initialiserCurseur();
        }
    }

    initialiserLogos();
    initialiserMenuMobile();
    initialiserRetourHaut();
    mouvementReduit.addEventListener("change", synchroniser);
    souris.addEventListener("change", synchroniser);
    synchroniser();
}