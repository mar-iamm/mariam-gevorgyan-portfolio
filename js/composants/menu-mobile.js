/* Refermer le burger après le choix d'un lien ou avec Échap. */
export function initialiserMenuMobile() {
    document.querySelectorAll(".menu-mobile").forEach(menu => {
        if (menu.dataset.menuInitialise !== undefined) return;
        menu.dataset.menuInitialise = "";
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
}
