import { afficherFiche } from "./composants/fiche-projet.js";
import { initialiserAnimationsProjet } from "./composants/animations-projet.js";

/* La fiche est générée d'abord, puis les animations s'appliquent à son contenu. */
await afficherFiche(document.querySelector("#contenu"));
initialiserAnimationsProjet();