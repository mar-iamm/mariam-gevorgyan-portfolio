/* Bandeau continu : un groupe original accessible et des copies visuelles. */
export function initialiserCarrouselLogiciels(section) {
    const piste = section?.querySelector(".logiciels__piste");
    if (!piste || !piste.animate || section.classList.contains("logiciels--anime")) return () => {};
    const originaux = [...piste.children];
    if (!originaux.length) return () => {};
    const controle = new AbortController();
    const options = { signal: controle.signal };
    const fenetre = document.createElement("div");
    fenetre.className = "logiciels__fenetre";
    piste.before(fenetre);
    fenetre.append(piste);
    const bouton = document.createElement("button");
    bouton.className = "logiciels__pause";
    bouton.type = "button";
    section.append(bouton);
    section.classList.add("logiciels--anime");
    let animation = null;
    let duree = 0;
    let frame = 0;
    let pause = false;
    let survol = false;
    let focus = false;
    let visible = !("IntersectionObserver" in window);
    let copies = [];

    function actualiser() {
        bouton.textContent = pause ? "Reprendre" : "Pause";
        bouton.setAttribute("aria-label", pause ? "Reprendre le défilement des logiciels" : "Pause du défilement des logiciels");
        if (!animation) return;
        if (pause || survol || focus || !visible || document.hidden) animation.pause();
        else animation.play();
    }
    function copierGroupe() {
        return originaux.map(original => {
            const copie = original.cloneNode(true);
            copie.dataset.copieLogiciel = "";
            copie.setAttribute("aria-hidden", "true");
            copie.inert = true;
            copie.removeAttribute("id");
            copie.querySelectorAll("[id]").forEach(e => e.removeAttribute("id"));
            copie.querySelectorAll("a, button, input, select, textarea, [tabindex]").forEach(e => e.setAttribute("tabindex", "-1"));
            copie.querySelectorAll("img").forEach(img => { img.loading = "eager"; });
            piste.append(copie);
            copies.push(copie);
            return copie;
        });
    }
    function mesurer() {
        frame = 0;
        if (controle.signal.aborted) return;
        const progression = animation && duree ? (Number(animation.currentTime || 0) % duree) / duree : 0;
        animation?.cancel();
        copies.forEach(copie => copie.remove());
        copies = [];
        const groupe = copierGroupe();
        const distance = groupe[0].getBoundingClientRect().left - originaux[0].getBoundingClientRect().left;
        if (distance <= 0) return;
        const repetitions = Math.ceil(fenetre.clientWidth / distance);
        for (let i = 1; i < repetitions; i++) copierGroupe();
        duree = distance / 38 * 1000; // Vitesse constante : 38 pixels par seconde.
        animation = piste.animate([
            { transform: "translateX(0)" },
            { transform: `translateX(${-distance}px)` }
        ], { duration: duree, iterations: Infinity, easing: "linear" });
        animation.currentTime = progression * duree;
        actualiser();
    }
    function programmerMesure() { if (!frame) frame = requestAnimationFrame(mesurer); }
    bouton.addEventListener("click", () => { pause = !pause; actualiser(); }, options);
    fenetre.addEventListener("pointerenter", event => {
        if (event.pointerType === "mouse") { survol = true; actualiser(); }
    }, options);
    fenetre.addEventListener("pointerleave", () => { survol = false; actualiser(); }, options);
    fenetre.addEventListener("focusin", () => { focus = true; actualiser(); }, options);
    fenetre.addEventListener("focusout", event => {
        focus = fenetre.contains(event.relatedTarget);
        actualiser();
    }, options);
    document.addEventListener("visibilitychange", actualiser, options);
    const observation = "IntersectionObserver" in window ? new IntersectionObserver(entrees => {
        visible = entrees[0].isIntersecting;
        actualiser();
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
    actualiser();
    programmerMesure();

    return () => {
        controle.abort();
        cancelAnimationFrame(frame);
        observation?.disconnect();
        dimensions?.disconnect();
        animation?.cancel();
        copies.forEach(copie => copie.remove());
        fenetre.before(piste);
        fenetre.remove();
        bouton.remove();
        section.classList.remove("logiciels--anime");
    };
}
