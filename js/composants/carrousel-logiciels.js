/* Bandeau des logiciels : défilement continu vers la gauche.
   On peut aussi le faire glisser dans les deux sens, à la souris, au doigt,
   au pavé tactile ou avec les flèches du clavier. Après un geste rapide,
   le bandeau garde son élan, ralentit, puis reprend son défilement normal. */

const VITESSE = 26;         // px par seconde, défilement automatique
const FROTTEMENT = 4;       // plus la valeur est haute, plus l'élan s'arrête vite
const ELAN_CLAVIER = 600;   // px par seconde ajoutés à chaque appui sur une flèche
const ELAN_MAXIMUM = 3000;  // px par seconde, élan le plus fort possible

export function initialiserCarrouselLogiciels(section) {
    const piste = section?.querySelector(".logiciels__piste");
    if (!piste || section.classList.contains("logiciels--anime")) return () => {};
    const originaux = [...piste.children];
    if (!originaux.length) return () => {};
    const controle = new AbortController();
    const options = { signal: controle.signal };

    const fenetre = document.createElement("div");
    fenetre.className = "logiciels__fenetre";
    fenetre.tabIndex = 0;
    fenetre.setAttribute("aria-label", "Logiciels. Utilisez les flèches gauche et droite pour faire défiler.");
    piste.before(fenetre);
    fenetre.append(piste);
    section.classList.add("logiciels--anime");
    originaux.forEach(original => original.querySelectorAll("img").forEach(img => { img.draggable = false; }));

    let distance = 0;   // largeur d'un groupe complet de logiciels
    let decalage = 0;   // position actuelle du bandeau
    let elan = 0;       // vitesse ajoutée par un geste, en px par seconde
    let frame = 0;
    let mesure = 0;
    let precedent = 0;
    let survol = false;
    let focus = false;
    let visible = !("IntersectionObserver" in window);
    let glisse = null;
    let copies = [];

    /* Le décalage reste toujours entre 0 et la largeur d'un groupe : la boucle est invisible. */
    function placer() {
        if (distance > 0) decalage = ((decalage % distance) + distance) % distance;
        piste.style.transform = `translate3d(${-decalage}px, 0, 0)`;
    }

    function boucle(temps) {
        frame = 0;
        if (!visible || document.hidden || !distance) {
            precedent = 0;
            return;
        }
        const duree = precedent ? Math.min((temps - precedent) / 1000, 0.05) : 0;
        precedent = temps;
        if (!glisse) {
            // Survol ou focus : le défilement automatique s'arrête, mais l'élan d'un geste continue.
            const automatique = survol || focus ? 0 : VITESSE;
            decalage += (automatique + elan) * duree;
            elan *= Math.exp(-FROTTEMENT * duree);
            if (Math.abs(elan) < 1) elan = 0;
            placer();
        }
        frame = requestAnimationFrame(boucle);
    }

    function demarrer() {
        if (!frame && visible && !document.hidden) frame = requestAnimationFrame(boucle);
    }

    function copierGroupe() {
        return originaux.map(original => {
            const copie = original.cloneNode(true);
            copie.dataset.copieLogiciel = "";
            copie.setAttribute("aria-hidden", "true");
            copie.inert = true;
            copie.removeAttribute("id");
            copie.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));
            copie.querySelectorAll("img").forEach(img => {
                img.loading = "eager";
                img.draggable = false;
            });
            piste.append(copie);
            copies.push(copie);
            return copie;
        });
    }

    /* Assez de copies pour remplir l'écran, quelle que soit sa largeur. */
    function mesurer() {
        mesure = 0;
        if (controle.signal.aborted) return;
        const proportion = distance ? decalage / distance : 0;
        copies.forEach(copie => copie.remove());
        copies = [];
        const groupe = copierGroupe();
        const nouvelleDistance = groupe[0].getBoundingClientRect().left - originaux[0].getBoundingClientRect().left;
        if (nouvelleDistance <= 0) {
            distance = 0;
            return;
        }
        distance = nouvelleDistance;
        const repetitions = Math.ceil(fenetre.clientWidth / distance);
        for (let i = 1; i < repetitions; i++) copierGroupe();
        decalage = proportion * distance;
        placer();
        demarrer();
    }

    function programmerMesure() {
        if (!mesure) mesure = requestAnimationFrame(mesurer);
    }

    /* Glisser à la souris ou au doigt. */
    fenetre.addEventListener("pointerdown", event => {
        if (event.button !== 0 || glisse) return;
        glisse = {
            id: event.pointerId,
            depart: event.clientX,
            decalage,
            dernierX: event.clientX,
            dernierTemps: event.timeStamp,
            vitesse: 0
        };
        elan = 0;
        fenetre.setPointerCapture(event.pointerId);
        fenetre.classList.add("logiciels__fenetre--glisse");
    }, options);

    fenetre.addEventListener("pointermove", event => {
        if (!glisse || event.pointerId !== glisse.id) return;
        decalage = glisse.decalage - (event.clientX - glisse.depart);
        const duree = (event.timeStamp - glisse.dernierTemps) / 1000;
        if (duree > 0) glisse.vitesse = -(event.clientX - glisse.dernierX) / duree;
        glisse.dernierX = event.clientX;
        glisse.dernierTemps = event.timeStamp;
        placer();
    }, options);

    function lacher(event) {
        if (!glisse || event.pointerId !== glisse.id) return;
        // L'élan n'est gardé que si le doigt ou la souris bougeait encore au moment du lâcher.
        const enMouvement = event.type === "pointerup" && event.timeStamp - glisse.dernierTemps < 80;
        elan = enMouvement ? Math.max(-ELAN_MAXIMUM, Math.min(ELAN_MAXIMUM, glisse.vitesse)) : 0;
        glisse = null;
        fenetre.classList.remove("logiciels__fenetre--glisse");
    }
    fenetre.addEventListener("pointerup", lacher, options);
    fenetre.addEventListener("pointercancel", lacher, options);
    fenetre.addEventListener("lostpointercapture", lacher, options);

    /* Pavé tactile : un balayage horizontal fait défiler le bandeau. */
    fenetre.addEventListener("wheel", event => {
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        event.preventDefault();
        decalage += event.deltaX;
        placer();
    }, { ...options, passive: false });

    /* Clavier : les flèches lancent le bandeau dans un sens ou dans l'autre. */
    fenetre.addEventListener("keydown", event => {
        if (event.key === "ArrowRight") elan = Math.min(elan + ELAN_CLAVIER, ELAN_MAXIMUM);
        else if (event.key === "ArrowLeft") elan = Math.max(elan - ELAN_CLAVIER, -ELAN_MAXIMUM);
        else return;
        event.preventDefault();
    }, options);

    fenetre.addEventListener("pointerenter", event => {
        if (event.pointerType === "mouse") survol = true;
    }, options);
    fenetre.addEventListener("pointerleave", () => { survol = false; }, options);
    fenetre.addEventListener("focusin", () => { focus = true; }, options);
    fenetre.addEventListener("focusout", event => {
        focus = fenetre.contains(event.relatedTarget);
    }, options);

    document.addEventListener("visibilitychange", () => {
        precedent = 0;
        demarrer();
    }, options);
    const observation = "IntersectionObserver" in window ? new IntersectionObserver(entrees => {
        visible = entrees[0].isIntersecting;
        precedent = 0;
        demarrer();
    }) : null;
    observation?.observe(section);

    const dimensions = "ResizeObserver" in window ? new ResizeObserver(programmerMesure) : null;
    dimensions?.observe(fenetre);
    originaux.forEach(element => dimensions?.observe(element));
    window.addEventListener("resize", programmerMesure, options);
    piste.addEventListener("load", event => {
        if (!event.target.closest("[data-copie-logiciel]")) programmerMesure();
    }, { ...options, capture: true });
    document.fonts?.ready.then(() => { if (!controle.signal.aborted) programmerMesure(); });
    programmerMesure();

    return () => {
        controle.abort();
        cancelAnimationFrame(frame);
        cancelAnimationFrame(mesure);
        observation?.disconnect();
        dimensions?.disconnect();
        copies.forEach(copie => copie.remove());
        piste.style.removeProperty("transform");
        fenetre.before(piste);
        fenetre.remove();
        section.classList.remove("logiciels--anime");
    };
}
