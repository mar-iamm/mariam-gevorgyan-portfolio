import { initialiserCarteIdentite } from "./carte-identite.js";
import { initialiserCurseur } from "./curseur.js";
import { initialiserCarrouselLogiciels } from "./carrousel-logiciels.js";
import { initialiserMenuMobile } from "./menu-mobile.js";
import { initialiserRetourHaut } from "./retour-haut.js";
import { initialiserRevelations } from "./revelations.js";
import { initialiserLogos } from "./logo.js";

/* Rythme des lettres : augmenter cette valeur ralentit l'apparition de MARIAM. */
const DELAI_ENTRE_LETTRES = 140; // ms entre deux lettres

/* Éléments qui apparaissent et disparaissent au défilement, dans les deux sens. */
const ELEMENTS_REVELES = [
    ".accueil__texte",
    ".accueil__actions",
    "main .titre-section",
    ".projets__etiquette",
    ".competence",
    ".logiciels",
    ".projet",
    ".contact__introduction",
    ".champ",
    ".contact__bouton"
].join(", ");

/* Point d'entrée : uniquement l'accueil, sans initialisation en double. */
export function initialiserAnimationsAccueil() {
    if (!document.querySelector(".accueil__lettres") || document.body.classList.contains("page-projet")) return;
    if (document.body.dataset.animationsInitialisees !== undefined) return;
    document.body.dataset.animationsInitialisees = "";
    document.body.classList.add("animations-accueil");
    document.documentElement.classList.add("defilement-accueil");
    const mouvementReduit = matchMedia("(prefers-reduced-motion: reduce)");
    const souris = matchMedia("(hover: hover) and (pointer: fine) and (forced-colors: none)");
    let arreterRevelations = () => {};
    let arreterLogiciels = () => {};
    let arreterCurseur = () => {};
    let titreJoue = false;

    function synchroniser() {
        arreterRevelations();
        arreterLogiciels();
        arreterCurseur();
        arreterRevelations = arreterLogiciels = arreterCurseur = () => {};
        if (mouvementReduit.matches) {
            document.querySelectorAll(".animation-lettre").forEach(lettre => {
                lettre.classList.remove("animation-lettre");
                lettre.style.removeProperty("--delai-lettre");
            });
            titreJoue = true;
            return;
        }
        if (!titreJoue) {
            titreJoue = true;
            if (!location.hash || ["#accueil", "#a-propos", "#contenu"].includes(location.hash)) {
                document.querySelectorAll(".accueil__lettre").forEach((lettre, index) => {
                    lettre.style.setProperty("--delai-lettre", `${index * DELAI_ENTRE_LETTRES}ms`);
                    lettre.classList.add("animation-lettre");
                    lettre.addEventListener("animationend", () => {
                        lettre.classList.remove("animation-lettre");
                        lettre.style.removeProperty("--delai-lettre");
                    }, { once: true });
                });
            }
        }
        arreterRevelations = initialiserRevelations(ELEMENTS_REVELES, { fondu: ".logiciels" });
        arreterLogiciels = initialiserCarrouselLogiciels(document.querySelector(".logiciels"));
        arreterCurseur = () => {};
        if (souris.matches) {
            arreterCurseur = initialiserCurseur();
        }
    }

    initialiserMenuMobile();
    initialiserLogos();
    initialiserRetourHaut();
    mouvementReduit.addEventListener("change", synchroniser);
    souris.addEventListener("change", synchroniser);
    initialiserCarteIdentite(document.querySelector(".accueil__carte"));
    synchroniser();
}
