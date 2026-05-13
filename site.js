(function () {
    const tapsNeeded = 3;
    let sunTapCount = 0;
    let tapTimer = null;

    function setNightMode(enabled) {
        document.body.classList.toggle('night-mode', enabled);
        try {
            localStorage.setItem('nightMode', enabled ? 'true' : 'false');
        } catch (error) {
            // Ignore storage failures; the easter egg still works for this page view.
        }
    }

    function restoreNightMode() {
        try {
            if (localStorage.getItem('nightMode') === 'true') {
                setNightMode(true);
            }
        } catch (error) {
            // Ignore storage failures.
        }
    }

    function setupSunEasterEgg() {
        const sun = document.querySelector('.corner-sun');
        if (!sun) {
            return;
        }

        sun.addEventListener('click', () => {
            sunTapCount += 1;
            window.clearTimeout(tapTimer);
            tapTimer = window.setTimeout(() => {
                sunTapCount = 0;
            }, 900);

            if (sunTapCount >= tapsNeeded) {
                sunTapCount = 0;
                setNightMode(!document.body.classList.contains('night-mode'));
            }
        });
    }

    restoreNightMode();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupSunEasterEgg);
    } else {
        setupSunEasterEgg();
    }
})();
