import { initialiserCarteIdentite } from "./carte-identite.js";
import { initialiserCurseur } from "./curseur.js";
import { initialiserCarrouselLogiciels } from "./carrousel-logiciels.js";

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
                    lettre.style.setProperty("--delai-lettre", `${index * 65}ms`);
                    lettre.classList.add("animation-lettre");
                    lettre.addEventListener("animationend", () => {
                        lettre.classList.remove("animation-lettre");
                        lettre.style.removeProperty("--delai-lettre");
                    }, { once: true });
                });
            }
        }
        arreterRevelations = initialiserRevelations();
        arreterLogiciels = initialiserCarrouselLogiciels(document.querySelector(".logiciels"));
        if (souris.matches) {
            arreterCurseur = initialiserCurseur();
        }
    }

    /* Refermer le burger après le choix d'un lien ou avec Échap. */
    document.querySelectorAll(".menu-mobile").forEach(menu => {
        menu.addEventListener("click", event => {
            if (event.target.closest("a[href]")) menu.open = false;
        });
        menu.addEventListener("keydown", event => {
            if (event.key === "Escape" && menu.open) {
                menu.open = false;
                menu.querySelector("summary")?.focus();
            }
        });
    });
    mouvementReduit.addEventListener("change", synchroniser);
    souris.addEventListener("change", synchroniser);
    initialiserCarteIdentite(document.querySelector(".accueil__carte"));
    synchroniser();
}

/* Révélation unique des titres et cartes, avec un décalage court par groupe. */
function initialiserRevelations() {
    if (!("IntersectionObserver" in window)) return () => {};
    const elements = [...document.querySelectorAll("main .titre-section, .competence, .projet, .contact__introduction")];
    const observer = new IntersectionObserver(entrees => {
        entrees.forEach(entree => { if (entree.isIntersecting) reveler(entree.target); });
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });

    function reveler(element, immediat = false) {
        if (immediat) element.classList.add("revelation-immediate");
        element.classList.remove("revelation-attente");
        element.dataset.revele = "";
        observer.unobserve(element);
    }
    elements.forEach(element => {
        if (element.dataset.revele !== undefined) return;
        // Ne pas faire disparaître les éléments déjà visibles au chargement.
        if (element.getBoundingClientRect().top < window.innerHeight) {
            element.dataset.revele = "";
            return;
        }
        const index = element.matches(".competence, .projet") ? [...element.parentElement.children].indexOf(element) : 0;
        element.style.setProperty("--delai-revelation", `${Math.min(index, 3) * 65}ms`);
        element.classList.add("revelation", "revelation-attente");
        observer.observe(element);
    });
    function focus(event) {
        elements.forEach(element => { if (element.contains(event.target)) reveler(element, true); });
    }
    function ancre() {
        let id;
        try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
        const cible = document.getElementById(id);
        if (!cible) return;
        elements.forEach(element => {
            if (cible.contains(element) || element.contains(cible)) reveler(element, true);
        });
    }
    document.addEventListener("focusin", focus);
    window.addEventListener("hashchange", ancre);
    ancre();
    return () => {
        observer.disconnect();
        document.removeEventListener("focusin", focus);
        window.removeEventListener("hashchange", ancre);
        elements.forEach(element => {
            element.classList.remove("revelation", "revelation-attente", "revelation-immediate");
            element.style.removeProperty("--delai-revelation");
        });
    };
}
