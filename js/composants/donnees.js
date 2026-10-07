/* Données des projets : une seule source, data/projets.json.
   Seule l'adresse dans fetch() changerait si la source changeait. */

const SOURCE = "data/projets.json";

/* Charge le tableau de projets (async / await). */
export async function loadProjects() {
    const reponse = await fetch(SOURCE);
    if (!reponse.ok) throw new Error(`Impossible de charger ${SOURCE} (erreur ${reponse.status})`);
    return reponse.json();
}

/* Protège le texte avant de l'insérer dans du HTML. */
export function echapper(texte = "") {
    return String(texte)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

/* Titre complet sur une ligne : « Wicked Wizard », « L’animatronique ». */
export function titreComplet(projet) {
    return [projet.title, projet.titleAccent].filter(Boolean).join(" ");
}