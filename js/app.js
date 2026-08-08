const App = (() => {
    function start() {
        UIAuth.start();
        UI.start();

        Auth.onStateChanged(handleAuthChanged);
    }

    function handleAuthChanged(user) {
        if (user) {
            startApplication();
            UIAuth.showApp();

            return;
        }

        stopApplication();
        UI.reset();
        UIAuth.showAuth();
    }

    function startApplication() {
        Events.start();
        Timer.start();
        Notifications.start();
        Recurrence.start();
    }

    function stopApplication() {
        Recurrence.stop();
        Notifications.stop();
        Timer.stop();
        Events.stop();
    }

    return {
        start
    };
})();

window.addEventListener("DOMContentLoaded", () => {
    App.start();
});
