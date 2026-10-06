/* Révélation au défilement, partagée par l'accueil et la page projets :
   - en descendant, l'élément monte depuis le bas de l'écran ;
   - en remontant, il redescend depuis le haut de l'écran ;
   - il disparaît dès qu'il sort de l'écran, puis réapparaît à son retour. */

const DELAI_ENTRE_ELEMENTS = 140; // ms entre deux éléments qui apparaissent ensemble
const DECALAGES_MAXIMUM = 5;      // au-delà, les éléments suivants partent en même temps
const MARGE_FENETRE = 0.06;       // 6 % en haut et en bas de l'écran

/* Options :
   - fondu : sélecteur des éléments qui apparaissent sans glisser ;
   - entreeAuChargement : les éléments déjà visibles apparaissent aussi au chargement. */
export function initialiserRevelations(selecteur, { fondu = "", entreeAuChargement = false } = {}) {
    if (!("IntersectionObserver" in window)) return () => {};
    const elements = [...document.querySelectorAll(selecteur)];
    if (!elements.length) return () => {};

    function cacher(element, cote) {
        element.style.removeProperty("--delai-revelation");
        element.classList.remove("revelation--dessus", "revelation--dessous");
        element.classList.add("revelation--cachee", `revelation--${cote}`);
    }

    function montrer(element, delai = 0) {
        element.style.setProperty("--delai-revelation", `${delai}ms`);
        element.classList.remove("revelation--cachee", "revelation--dessus", "revelation--dessous");
    }

    /* De haut en bas, puis de gauche à droite pour les éléments d'une même rangée. */
    function ordre(a, b) {
        const ecart = a.boundingClientRect.top - b.boundingClientRect.top;
        return Math.abs(ecart) > 8 ? ecart : a.boundingClientRect.left - b.boundingClientRect.left;
    }

    const pourcentage = `${MARGE_FENETRE * 100}%`;
    const observateur = new IntersectionObserver(entrees => {
        const parLeBas = [];
        const parLeHaut = [];
        entrees.forEach(entree => {
            const element = entree.target;
            if (entree.isIntersecting) {
                if (!element.classList.contains("revelation--cachee")) return;
                (element.classList.contains("revelation--dessus") ? parLeHaut : parLeBas).push(entree);
            } else {
                const hautFenetre = entree.rootBounds ? entree.rootBounds.top : 0;
                cacher(element, entree.boundingClientRect.bottom <= hautFenetre ? "dessus" : "dessous");
            }
        });
        // Le plus proche du bord par lequel on arrive part en premier.
        parLeBas.sort(ordre);
        parLeHaut.sort(ordre).reverse();
        [parLeBas, parLeHaut].forEach(groupe => groupe.forEach((entree, index) => {
            montrer(entree.target, Math.min(index, DECALAGES_MAXIMUM) * DELAI_ENTRE_ELEMENTS);
        }));
    }, { threshold: 0, rootMargin: `-${pourcentage} 0px -${pourcentage} 0px` });

    /* État de départ appliqué sans transition : rien ne clignote au chargement. */
    const hauteur = window.innerHeight;
    elements.forEach(element => {
        element.classList.add("revelation", "revelation--immediate");
        if (fondu && element.matches(fondu)) element.classList.add("revelation--fondu");
        const rect = element.getBoundingClientRect();
        if (rect.bottom <= hauteur * MARGE_FENETRE) cacher(element, "dessus");
        else if (rect.top >= hauteur * (1 - MARGE_FENETRE) || entreeAuChargement) cacher(element, "dessous");
    });
    void document.body.offsetHeight;
    elements.forEach(element => element.classList.remove("revelation--immediate"));
    void document.body.offsetHeight;
    elements.forEach(element => observateur.observe(element));

    /* Au clavier, un élément atteint avec Tab s'affiche tout de suite. */
    function focus(event) {
        elements.forEach(element => {
            if (!element.contains(event.target) || !element.classList.contains("revelation--cachee")) return;
            element.classList.add("revelation--immediate");
            montrer(element);
            void element.offsetHeight;
            element.classList.remove("revelation--immediate");
        });
    }
    document.addEventListener("focusin", focus);

    return () => {
        observateur.disconnect();
        document.removeEventListener("focusin", focus);
        elements.forEach(element => {
            element.classList.remove(
                "revelation", "revelation--cachee", "revelation--dessus",
                "revelation--dessous", "revelation--fondu", "revelation--immediate"
            );
            element.style.removeProperty("--delai-revelation");
        });
    };
}
