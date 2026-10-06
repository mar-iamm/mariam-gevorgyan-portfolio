/* Carte étudiante accrochée à un cordon : petite simulation physique.
   - La carte tombe, le cordon se tend d'un coup, elle rebondit un peu et oscille fort.
   - Le balancement diminue, puis continue sans fin, entretenu par un léger courant d'air irrégulier.
   - Elle tourne un peu sur son cordon (effet 3D) et réagit quand on fait défiler la page.
   - Ses ombres, extérieure et intérieure, suivent ses mouvements.
   - Pendant les grands balancements, un reflet de lumière glisse sur la carte. */

const GRAVITE = 2200;          // px/s², vitesse de la chute
const RAIDEUR_CORDON = 1500;   // élasticité du cordon : plus haut, moins de rebond vertical
const AMORTI_CORDON = 45;      // freine le rebond vertical
const RAIDEUR_BALANCIER = 12;  // un aller-retour toutes les 1,8 s environ
const AMORTI_BALANCIER = 0.9;  // freine le balancement après la chute
const AMPLITUDE = 4.5;         // degrés, balancement entretenu (varie de 3,5 à 5,5)
const RAIDEUR_TORSION = 20;    // rotation de la carte sur son cordon
const AMORTI_TORSION = 1.2;
const SEUIL_REFLET = 6;       // degrés : le reflet apparaît au-delà de ce balancement
const REFLET_PLEIN = 10;      // degrés : le reflet atteint sa pleine intensité
const PAS = 1 / 240;           // pas de calcul, en secondes
const DEGRE = Math.PI / 180;

export function initialiserCarteIdentite(carte) {
    if (!carte || carte.dataset.entreeCarteInitialisee !== undefined) return;
    carte.dataset.entreeCarteInitialisee = "";
    carte.draggable = false;
    const reduction = matchMedia("(prefers-reduced-motion: reduce)");
    // Arrivée directe sur une autre section : pas de chute, seulement le balancement.
    const sansDescente = location.hash && !["#accueil", "#a-propos", "#contenu"].includes(location.hash);
    // Petit étirement du cordon au repos, compensé à l'affichage.
    const repos = GRAVITE / RAIDEUR_CORDON;
    const etat = { y: 0, vy: 0, angle: 0, vAngle: 0, torsion: 0, vTorsion: 0, temps: 0 };
    let frame = 0;
    let precedent = 0;
    let actif = false;
    let visible = true;
    let dernierDefilement = 0;
    let vitesseDefilement = 0;
    let reflet = null;
    let refletVisible = false;

    /* Courant d'air : plusieurs sinus de fréquences différentes, jamais tout à fait régulier. */
    function air(t) {
        return Math.sin(t * 0.73) * 0.6 + Math.sin(t * 1.37 + 1.3) * 0.3 + Math.sin(t * 2.91 + 0.4) * 0.1;
    }

    function avancer(duree, acceleration) {
        const e = etat;
        e.temps += duree;

        // Cordon : chute libre quand il est détendu, ressort quand il est tendu.
        let ay = GRAVITE + acceleration;
        if (e.y > 0) ay -= RAIDEUR_CORDON * e.y + AMORTI_CORDON * e.vy;
        e.vy += ay * duree;
        e.y += e.vy * duree;

        // Balancier : il ne ramène la carte au centre que si le cordon est tendu.
        const tension = Math.min(3, Math.max(0, RAIDEUR_CORDON * e.y / GRAVITE));
        const cible = (AMPLITUDE + air(e.temps * 0.5)) * DEGRE;
        const energie = 0.5 * e.vAngle ** 2 + 0.5 * RAIDEUR_BALANCIER * e.angle ** 2;
        const energieCible = 0.5 * RAIDEUR_BALANCIER * cible ** 2;
        // Petite poussée dans le sens du mouvement tant que le balancement est trop faible.
        const relance = tension > 0 ? 0.6 * Math.sign(e.vAngle || 1) * Math.max(0, 1 - energie / energieCible) : 0;
        const aAngle = -RAIDEUR_BALANCIER * tension * Math.sin(e.angle)
            - AMORTI_BALANCIER * e.vAngle
            + relance
            + air(e.temps) * 0.05
            + acceleration * 0.00003;
        e.vAngle += aAngle * duree;
        e.angle += e.vAngle * duree;

        // Torsion : la carte pivote légèrement sur son cordon.
        const aTorsion = -RAIDEUR_TORSION * e.torsion
            - AMORTI_TORSION * e.vTorsion
            + air(e.temps * 0.8 + 5) * 0.6
            + acceleration * 0.00004;
        e.vTorsion += aTorsion * duree;
        e.torsion += e.vTorsion * duree;
    }

    /* Reflet : un calque posé sur la carte, découpé à sa forme grâce au PNG lui-même. */
    function creerReflet() {
        if (reflet) return;
        reflet = document.createElement("span");
        reflet.className = "accueil__reflet";
        reflet.setAttribute("aria-hidden", "true");
        const forme = `url("${carte.currentSrc || carte.src}")`;
        reflet.style.webkitMaskImage = forme;
        reflet.style.maskImage = forme;
        carte.after(reflet);
        placerReflet();
        if ("ResizeObserver" in window) {
            const dimensions = new ResizeObserver(placerReflet);
            dimensions.observe(carte);
            if (carte.parentElement) dimensions.observe(carte.parentElement);
        }
        window.addEventListener("resize", placerReflet);
    }

    /* Même position et même taille que la carte, avant ses mouvements. */
    function placerReflet() {
        if (!reflet) return;
        reflet.style.left = `${carte.offsetLeft}px`;
        reflet.style.top = `${carte.offsetTop}px`;
        reflet.style.width = `${carte.offsetWidth}px`;
        reflet.style.height = `${carte.offsetHeight}px`;
    }

    /* Le reflet n'apparaît que pendant les grands balancements, cordon tendu.
       Il glisse d'un côté à l'autre selon l'inclinaison et la rotation de la carte. */
    function afficherReflet() {
        if (!reflet) return;
        const amplitude = Math.sqrt(etat.angle ** 2 + etat.vAngle ** 2 / RAIDEUR_BALANCIER) / DEGRE;
        const intensite = etat.y > 0
            ? Math.min(1, Math.max(0, (amplitude - SEUIL_REFLET) / (REFLET_PLEIN - SEUIL_REFLET)))
            : 0;
        if (intensite > 0.005) {
            const position = 50 + (etat.angle / DEGRE) * 4 + (etat.torsion / DEGRE) * 2;
            reflet.style.translate = carte.style.translate;
            reflet.style.rotate = carte.style.rotate;
            reflet.style.transform = carte.style.transform;
            reflet.style.backgroundPosition = `${Math.min(100, Math.max(0, position)).toFixed(1)}% 0`;
            reflet.style.opacity = (intensite * 0.7).toFixed(3);
            refletVisible = true;
        } else if (refletVisible) {
            reflet.style.opacity = "0";
            refletVisible = false;
        }
    }

    /* Le filtre tourne avec la carte : on compense son inclinaison
       pour que l'ombre tombe toujours dans la même direction. */
    function decaler(x, y) {
        const cos = Math.cos(-etat.angle);
        const sin = Math.sin(-etat.angle);
        return `${(x * cos - y * sin).toFixed(1)}px ${(x * sin + y * cos).toFixed(1)}px`;
    }

    /* Lumière fixe venant d'en haut à gauche.
       - Ombre extérieure : une ombre de contact nette et une ombre portée plus douce.
         Quand la carte tourne sur son cordon, son bord s'éloigne du mur :
         l'ombre s'écarte, devient plus floue et plus pâle.
       - Ombre intérieure : la face s'éclaire quand elle se tourne vers la lumière
         et s'assombrit quand elle s'en détourne. */
    function eclairage() {
        const rotation = Math.sin(etat.torsion);
        const ecart = Math.abs(rotation);
        const lumiere = 1 - rotation * 0.5;
        const contact = `drop-shadow(${decaler(3 + ecart * 10, 5 + ecart * 8)} ${(4 + ecart * 8).toFixed(1)}px rgba(0, 0, 0, 0.3))`;
        const portee = `drop-shadow(${decaler(12 + ecart * 30, 18 + ecart * 20)} ${(18 + ecart * 30).toFixed(1)}px rgba(0, 0, 0, ${(0.22 - ecart * 0.08).toFixed(3)}))`;
        return `brightness(${lumiere.toFixed(3)}) ${contact} ${portee}`;
    }

    function afficher() {
        carte.style.translate = `0 ${(etat.y - repos).toFixed(2)}px`;
        carte.style.rotate = `${etat.angle.toFixed(5)}rad`;
        carte.style.transform = `perspective(900px) rotateY(${etat.torsion.toFixed(5)}rad)`;
        carte.style.filter = eclairage();
        afficherReflet();
    }

    function boucle(temps) {
        frame = 0;
        if (!actif || !visible || document.hidden) {
            precedent = 0;
            return;
        }
        if (!precedent) {
            dernierDefilement = window.scrollY;
            vitesseDefilement = 0;
        }
        const duree = precedent ? Math.min((temps - precedent) / 1000, 1 / 30) : 1 / 60;
        precedent = temps;

        // Défilement : quand la page accélère, la carte « traîne » un peu derrière son attache.
        const defilement = window.scrollY;
        const vitesse = (defilement - dernierDefilement) / duree;
        dernierDefilement = defilement;
        const vitesseLissee = vitesseDefilement + (vitesse - vitesseDefilement) * 0.3;
        const acceleration = Math.max(-8000, Math.min(8000, (vitesseLissee - vitesseDefilement) / duree));
        vitesseDefilement = vitesseLissee;

        for (let reste = duree; reste > 1e-6; reste -= PAS) avancer(Math.min(PAS, reste), acceleration);
        afficher();
        frame = requestAnimationFrame(boucle);
    }

    function demarrer() {
        if (!frame && actif && visible && !document.hidden) frame = requestAnimationFrame(boucle);
    }

    function lancer() {
        if (reduction.matches || actif) return;
        const rect = carte.getBoundingClientRect();
        const horsEcran = rect.bottom <= 0 || rect.top >= window.innerHeight;
        if (sansDescente || horsEcran) {
            Object.assign(etat, { y: repos, vy: 0, angle: AMPLITUDE * DEGRE, vAngle: 0, torsion: 0, vTorsion: 0 });
        } else {
            // Départ au-dessus de l'écran, légèrement penchée et tournée sur elle-même.
            Object.assign(etat, {
                y: -Math.max(24, rect.bottom + 24),
                vy: 0,
                angle: -12 * DEGRE,
                vAngle: 0,
                torsion: 25 * DEGRE,
                vTorsion: 0
            });
        }
        actif = true;
        creerReflet();
        carte.classList.add("carte-physique");
        afficher();
        demarrer();
    }

    function arreter() {
        actif = false;
        cancelAnimationFrame(frame);
        frame = 0;
        precedent = 0;
        carte.classList.remove("carte-physique");
        carte.style.removeProperty("translate");
        carte.style.removeProperty("rotate");
        carte.style.removeProperty("transform");
        carte.style.removeProperty("filter");
        if (reflet) {
            reflet.style.opacity = "0";
            refletVisible = false;
        }
    }

    /* La simulation se met en pause quand l'accueil n'est plus à l'écran. */
    if ("IntersectionObserver" in window) {
        const observation = new IntersectionObserver(entrees => {
            visible = entrees[0].isIntersecting;
            demarrer();
        }, { rootMargin: "100px 0px" });
        observation.observe(carte.closest(".accueil") || carte.parentElement || carte);
    }
    document.addEventListener("visibilitychange", demarrer);
    reduction.addEventListener("change", () => {
        if (reduction.matches) arreter();
        else lancer();
    });

    if (carte.complete && carte.naturalWidth > 0) lancer();
    else {
        carte.addEventListener("load", lancer, { once: true });
        carte.addEventListener("error", arreter, { once: true });
    }
}