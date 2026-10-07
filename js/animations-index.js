import { afficherCartes } from "./composants/cartes.js";
import { initialiserAnimationsAccueil } from "./composants/animations-accueil.js";

/* Les animations démarrent tout de suite (MARIAM, carte, bandeau),
   puis sont actualisées une fois les cartes de projets générées. */
const actualiserAnimations = initialiserAnimationsAccueil();
await afficherCartes(document.querySelector(".projets__grille"));
actualiserAnimations?.();