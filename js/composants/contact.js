/* Formulaire de contact : envoi des messages par Formspree.
   Sans JavaScript, le formulaire s'envoie quand même (méthode POST classique)
   et Formspree affiche sa propre page de remerciement.
   Avec JavaScript, l'envoi se fait sans quitter la page et un message s'affiche sous le bouton.
   En cas d'échec, la raison précise est affichée sous le bouton et détaillée dans la console. */

/* Traduit la réponse de Formspree en une raison compréhensible. */
async function lireRaison(reponse) {
    let details = "";
    try {
        const donnees = await reponse.json();
        // Formspree renvoie ses erreurs dans un tableau « errors », chacune avec un « message ».
        details = (donnees.errors || []).map(erreur => erreur.message).filter(Boolean).join(" ")
            || donnees.error
            || "";
    } catch {
        // La réponse n'était pas du JSON : on garde seulement le code HTTP.
    }

    switch (reponse.status) {
        case 404:
            return "le formulaire Formspree est introuvable. Vérifiez l’identifiant dans l’attribut action du formulaire.";
        case 403:
            return `Formspree refuse l’envoi. Le formulaire n’est peut-être pas encore activé : confirmez votre adresse courriel dans Formspree.${details ? ` (${details})` : ""}`;
        case 422:
            return `Formspree a refusé les données envoyées : ${details || "un champ est invalide."}`;
        case 429:
            return "la limite d’envoi de Formspree est atteinte (50 messages par mois sur le plan gratuit). Réessayez plus tard.";
        default:
            return `Formspree a répondu avec l’erreur ${reponse.status}${details ? ` : ${details}` : "."}`;
    }
}

export function initialiserContact() {
    const formulaire = document.querySelector(".contact__formulaire");
    if (!formulaire || formulaire.dataset.contactInitialise !== undefined) return;
    formulaire.dataset.contactInitialise = "";
    const bouton = formulaire.querySelector(".contact__bouton");
    // La zone du message est créée sous le bouton si elle manque dans le HTML.
    let statut = formulaire.querySelector(".contact__statut");
    if (!statut) {
        statut = document.createElement("p");
        statut.className = "contact__statut";
        statut.setAttribute("role", "status");
        statut.setAttribute("aria-live", "polite");
        formulaire.append(statut);
    }
    const texteBouton = bouton?.innerHTML;

    function afficherStatut(message, etat) {
        if (!statut) return;
        statut.textContent = message;
        statut.classList.toggle("contact__statut--succes", etat === "succes");
        statut.classList.toggle("contact__statut--erreur", etat === "erreur");
    }

    // L'événement submit n'arrive qu'une fois les champs obligatoires valides.
    formulaire.addEventListener("submit", async event => {
        event.preventDefault();

        // Identifiant Formspree pas encore remplacé dans le HTML : inutile d'envoyer.
        if (formulaire.action.includes("TON_IDENTIFIANT")) {
            const raison = "l’identifiant Formspree n’a pas été ajouté. Remplacez TON_IDENTIFIANT dans l’attribut action du formulaire (index.html).";
            console.error(`Formulaire de contact : ${raison}`);
            afficherStatut(`Le message n’a pas pu être envoyé : ${raison}`, "erreur");
            return;
        }

        if (bouton) {
            bouton.disabled = true;
            bouton.textContent = "Envoi en cours…";
        }
        afficherStatut("", null);

        let reponse;
        try {
            reponse = await fetch(formulaire.action, {
                method: "POST",
                body: new FormData(formulaire),
                headers: { Accept: "application/json" }
            });
        } catch (erreur) {
            // fetch() échoue sans réponse : pas de connexion, ou requête bloquée (bloqueur, réseau).
            console.error("Formulaire de contact : aucune réponse de Formspree.", erreur);
            afficherStatut("Le message n’a pas pu être envoyé : aucune réponse du serveur. Vérifiez votre connexion Internet, puis réessayez.", "erreur");
            reactiverBouton();
            return;
        }

        if (reponse.ok) {
            formulaire.reset();
            afficherStatut("Merci, votre message a bien été envoyé ! Je vous réponds dès que possible.", "succes");
        } else {
            const raison = await lireRaison(reponse);
            console.error(`Formulaire de contact (erreur ${reponse.status}) : ${raison}`);
            afficherStatut(`Le message n’a pas pu être envoyé : ${raison}`, "erreur");
        }
        reactiverBouton();
    });

    function reactiverBouton() {
        if (!bouton) return;
        bouton.disabled = false;
        bouton.innerHTML = texteBouton;
    }
}