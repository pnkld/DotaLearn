
// Плавное появление страницы
document.body.classList.add("page-enter");

// Плавный переход при открытии другой HTML-страницы
document.addEventListener("click", event => {
    const link = event.target.closest("a");

    if (!link) return;

    if (
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.metaKey ||
        event.button !== 0
    ) return;

    const url = new URL(link.href);

    if (
        url.origin !== location.origin ||
        !url.pathname.endsWith(".html") ||
        url.pathname === location.pathname
    ) return;

    event.preventDefault();

    document.body.classList.add("page-leave");

    setTimeout(() => {
        location.href = url.href;
    }, 250);
});
