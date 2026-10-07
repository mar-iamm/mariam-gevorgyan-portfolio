/* Page d'accueil : les cartes de projets sont générées à partir de data/projets.json. */
import { loadProjects, echapper, titreComplet } from "./donnees.js";

/* Une carte, avec exactement les mêmes classes que les cartes écrites à la main auparavant. */
export function createProjectCard(projet) {
    const carte = document.createElement("article");
    carte.className = `projet projet--${projet.color}`;
    // Titre sur deux lignes : cardTitle s'il existe (« L’anima / tronique »),
    // sinon le titre et sa partie en couleur (« Wicked / Wizard »).
    const lignes = projet.cardTitle || [projet.title, projet.titleAccent].filter(Boolean);
    const titre = lignes.map(echapper).join("<br>");
    const apercu = projet.thumbnail
        ? `<img class="projet__image" src="${echapper(projet.thumbnail)}" alt="" loading="lazy">`
        : "";
    carte.innerHTML = `
        <div class="projet__apercu" aria-hidden="true">${apercu}</div>
        <p class="projet__categorie">${echapper(projet.category)}</p>
        <h3 class="projet__titre">${titre}</h3>
        <p class="projet__description">${echapper(projet.summary)}</p>
        <div class="projet__action">
            <a class="projet__bouton"
               href="projet.html?id=${encodeURIComponent(projet.id)}"
               aria-label="Voir le projet ${echapper(titreComplet(projet))}">
                Voir le projet
            </a>
        </div>`;
    return carte;
}

/* Remplit la grille ; en cas d'erreur, un message remplace les cartes. */
export async function afficherCartes(grille) {
    if (!grille) return;
    try {
        const projets = await loadProjects();
        grille.replaceChildren(...projets.map(createProjectCard));
    } catch (erreur) {
        console.error(erreur);
        grille.innerHTML = `<p class="projets__erreur">Les projets n’ont pas pu être chargés. Réessayez plus tard.</p>`;
    }
}