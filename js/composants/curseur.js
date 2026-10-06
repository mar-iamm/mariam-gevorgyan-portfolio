/* Point précis et cercle légèrement décalé, uniquement pour la souris. */
export function initialiserCurseur() {
    const controle = new AbortController();
    const options = { signal: controle.signal };
    const point = document.createElement("div");
    const cercle = document.createElement("div");
    point.className = "curseur-point";
    cercle.className = "curseur-cercle";
    point.setAttribute("aria-hidden", "true");
    cercle.setAttribute("aria-hidden", "true");
    document.body.append(point, cercle);
    let cible = { x: 0, y: 0 };
    let position = { x: 0, y: 0 };
    let visible = false;
    let frame = 0;
    let precedent = 0;

    function masquer() {
        visible = false;
        document.body.classList.remove("curseur-actif");
        cancelAnimationFrame(frame);
        frame = precedent = 0;
    }

    function dessiner(temps) {
        frame = 0;
        if (!visible) return;
        const duree = precedent ? Math.min(temps - precedent, 50) : 16;
        precedent = temps;
        const facteur = 1 - Math.exp(-duree / 45);
        position.x += (cible.x - position.x) * facteur;
        position.y += (cible.y - position.y) * facteur;
        const distance = Math.hypot(cible.x - position.x, cible.y - position.y);
        if (distance < 0.15) position = { ...cible };
        cercle.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
        if (distance >= 0.15) frame = requestAnimationFrame(dessiner);
        else precedent = 0;
    }

    /* Le cercle grossit et devient vert sur tout ce qui est cliquable. */
    function contexte(element) {
        if (!(element instanceof Element) || element.closest("input, textarea, select, [contenteditable]:not([contenteditable='false']), iframe")) {
            masquer();
            return false;
        }
        const projet = element.closest(".projet");
        const interactif = element.closest("a[href], button:not(:disabled), summary, [role='button'], label[for]");
        cercle.classList.toggle("curseur-cercle--actif", Boolean(interactif || projet));
        return true;
    }

    document.addEventListener("pointermove", event => {
        if (event.pointerType !== "mouse") { masquer(); return; }
        if (!contexte(event.target)) return;
        cible = { x: event.clientX, y: event.clientY };
        if (!visible) position = { ...cible };
        point.style.transform = `translate3d(${cible.x}px, ${cible.y}px, 0)`;
        if (!visible) cercle.style.transform = point.style.transform;
        visible = true;
        document.body.classList.add("curseur-actif");
        if (!frame) frame = requestAnimationFrame(dessiner);
    }, { ...options, passive: true });
    document.addEventListener("pointerout", event => { if (!event.relatedTarget) masquer(); }, options);
    document.addEventListener("pointercancel", masquer, options);
    document.addEventListener("keydown", event => { if (["Tab", "Escape"].includes(event.key)) masquer(); }, options);
    document.addEventListener("visibilitychange", () => { if (document.hidden) masquer(); }, options);
    window.addEventListener("blur", masquer, options);
    window.addEventListener("scroll", () => {
        if (visible) contexte(document.elementFromPoint(cible.x, cible.y));
    }, { ...options, passive: true });

    return () => {
        masquer();
        controle.abort();
        point.remove();
        cercle.remove();
    };
}