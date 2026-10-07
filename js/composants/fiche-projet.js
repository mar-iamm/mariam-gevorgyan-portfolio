/* Page projet.html : tous les projets, l'un sous l'autre, générés à partir de data/projets.json.
   Quand on arrive depuis une carte (projet.html?id=...), la page lit l'id dans l'adresse
   avec URLSearchParams, retrouve le projet avec find() et défile jusqu'à lui. */
import { loadProjects, echapper, titreComplet } from "./donnees.js";

const MAXIMUM_IMAGES = 3; // le CSS du carrousel prévoit trois images au maximum

/* Description : le mot « GitHub » devient un lien vers le dépôt, s'il y en a un. */
function creerDescription(projet) {
    const mot = "GitHub";
    const position = projet.repository ? projet.description.lastIndexOf(mot) : -1;
    if (position === -1) return echapper(projet.description);
    return `${echapper(projet.description.slice(0, position))}<a class="projet-presentation__lien" href="${echapper(projet.repository)}" target="_blank" rel="noopener noreferrer">${mot}</a>${echapper(projet.description.slice(position + mot.length))}`;
}

/* Carrousel : boutons radio, diapositives et flèches.
   Chaque projet a ses propres id et son propre groupe radio : les carrousels restent indépendants. */
function creerGalerie(projet) {
    const prefixe = `projet-${projet.id}`;
    const images = (projet.images || []).slice(0, MAXIMUM_IMAGES);
    const total = Math.max(images.length, 1);
    const choix = [];
    const diapositives = [];
    const navigations = [];

    for (let numero = 1; numero <= total; numero++) {
        choix.push(`<input class="galerie__choix galerie__choix--${numero} texte-accessible" type="radio" name="image-${prefixe}" id="${prefixe}-image-${numero}" aria-label="Afficher l’image ${numero} sur ${total}" aria-describedby="aide-${prefixe}"${numero === 1 ? " checked" : ""}>`);

        const image = images[numero - 1];
        const visuel = image
            ? `<img class="galerie__image" src="${echapper(image.src)}" alt="${echapper(image.alt)}">`
            : `<div class="galerie__emplacement">Visuels à venir</div>`;
        diapositives.push(`
            <figure class="galerie__diapositive galerie__diapositive--${numero}">
                ${visuel}
                <figcaption class="galerie__compteur">${numero} / ${total}</figcaption>
            </figure>`);

        // Les flèches n'apparaissent que s'il y a plus d'une image.
        if (total > 1) {
            const precedente = numero === 1 ? total : numero - 1;
            const suivante = numero === total ? 1 : numero + 1;
            navigations.push(`
                <div class="galerie__navigation galerie__navigation--${numero}">
                    <label class="galerie__fleche galerie__fleche--precedente" for="${prefixe}-image-${precedente}">
                        <span aria-hidden="true">‹</span>
                        <span class="texte-accessible">Image précédente : ${precedente} sur ${total}</span>
                    </label>
                    <label class="galerie__fleche galerie__fleche--suivante" for="${prefixe}-image-${suivante}">
                        <span aria-hidden="true">›</span>
                        <span class="texte-accessible">Image suivante : ${suivante} sur ${total}</span>
                    </label>
                </div>`);
        }
    }

    const visiter = projet.link
        ? `<a class="galerie__visiter" href="${echapper(projet.link)}" target="_blank" rel="noopener noreferrer">Visiter <span aria-hidden="true">↗</span></a>`
        : `<button class="galerie__visiter" type="button" disabled>Visiter <span aria-hidden="true">↗</span></button>`;

    return `
        <div class="galerie" role="region" aria-label="Images du projet ${echapper(titreComplet(projet))}">
            <p class="texte-accessible" id="aide-${prefixe}">Au clavier, utilisez les flèches gauche et droite pour changer d’image après avoir atteint ce groupe avec la touche Tab.</p>
            ${choix.join("")}
            <div class="galerie__fenetre">
                <div class="galerie__barre" aria-hidden="true">
                    <div class="galerie__temoins">
                        <span class="galerie__temoin"></span>
                        <span class="galerie__temoin galerie__temoin--jaune"></span>
                        <span class="galerie__temoin galerie__temoin--vert"></span>
                    </div>
                    <span class="galerie__adresse">${echapper(projet.address || "Lien à venir")}</span>
                </div>
                ${diapositives.join("")}
                ${visiter}
            </div>
            ${navigations.join("")}
        </div>`;
}

/* La fiche complète d'un projet, avec des id propres à ce projet. */
export function createProjectDetail(projet) {
    const prefixe = `projet-${projet.id}`;
    const fiche = document.createElement("article");
    fiche.className = `fiche-projet fiche-projet--${projet.color}`;
    fiche.id = prefixe;
    fiche.setAttribute("aria-labelledby", `titre-${prefixe}`);
    const accent = projet.titleAccent
        ? ` <span class="projet-presentation__accent">${echapper(projet.titleAccent)}</span>`
        : "";
    const demarche = projet.approach;
    const roles = projet.roles
        .map(role => `<li class="role-projet__element">${echapper(role)}</li>`)
        .join("");
    const outils = projet.tools
        .map(outil => `
            <li class="outil-projet">
                <img class="outil-projet__icone" src="${echapper(outil.icon)}" alt="" loading="lazy">
                <div>
                    <h4 class="outil-projet__nom">${echapper(outil.name)}</h4>
                    <p class="outil-projet__usage">${echapper(outil.usage)}</p>
                </div>
            </li>`)
        .join("");

    fiche.innerHTML = `
        <section class="projet-presentation" aria-labelledby="titre-${prefixe}">
            <h2 class="projet-presentation__titre" id="titre-${prefixe}">
                <span>${echapper(projet.title)}${accent}</span>
            </h2>
            <p class="projet-presentation__description">${creerDescription(projet)}</p>
            ${creerGalerie(projet)}
        </section>

        <section class="analyse-projet" aria-labelledby="demarche-${prefixe}">
            <aside class="role-projet" aria-labelledby="role-${prefixe}">
                <h3 class="role-projet__titre" id="role-${prefixe}">Mon rôle</h3>
                <ul class="role-projet__liste">${roles}</ul>
            </aside>
            <div class="demarche-projet">
                <h3 class="demarche-projet__titre" id="demarche-${prefixe}">Démarche du projet</h3>
                <p class="demarche-projet__texte">${echapper(demarche.before)}<mark class="demarche-projet__accent">${echapper(demarche.highlight)}</mark>${echapper(demarche.after)}</p>
            </div>
        </section>

        <section class="outils-projet" aria-labelledby="outils-${prefixe}">
            <h3 class="outils-projet__titre" id="outils-${prefixe}">Logiciels &amp; technologies</h3>
            <ul class="outils-projet__liste">${outils}</ul>
        </section>`;
    return fiche;
}

/* Fichier introuvable : un message et un lien de retour. */
function creerIntrouvable() {
    const fiche = document.createElement("article");
    fiche.className = "fiche-projet fiche-projet--bleu";
    fiche.innerHTML = `
        <section class="projet-presentation" aria-labelledby="titre-introuvable">
            <h1 class="projet-presentation__titre" id="titre-introuvable">
                <span>Projets <span class="projet-presentation__accent">introuvables</span></span>
            </h1>
            <p class="projet-presentation__description">Les projets n’ont pas pu être chargés. <a class="projet-presentation__lien" href="index.html#projets">Retourner à l’accueil</a>.</p>
        </section>`;
    return fiche;
}

/* Affiche tous les projets, puis défile jusqu'à celui choisi sur l'accueil, s'il y en a un. */
export async function afficherFiche(conteneur) {
    if (!conteneur) return;
    try {
        const projets = await loadProjects();
        const titre = document.createElement("h1");
        titre.className = "texte-accessible";
        titre.textContent = "Mes projets";
        conteneur.replaceChildren(titre, ...projets.map(createProjectDetail));

        const id = new URLSearchParams(window.location.search).get("id");
        const projet = projets.find(element => element.id === id);
        if (projet) document.getElementById(`projet-${projet.id}`)?.scrollIntoView({ block: "start" });
    } catch (erreur) {
        console.error(erreur);
        conteneur.replaceChildren(creerIntrouvable());
    }
}