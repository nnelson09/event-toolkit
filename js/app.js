const App = (() => {
    function start() {
        UIAuth.start();
        UI.start();

        Auth.onStateChanged(handleAuthChanged);
    }

    function handleAuthChanged(user) {
        try {
            if (user) {
                startApp();
                return;
            }

            stopApp();
        } catch (error) {
            ErrorHandler.handle(error, user ? "Starting application" : "Stopping application");
        }
    }

    function startApp() {
        Config.start();
        Events.start();
        Timer.start();
        Notifications.start();
        Recurrence.start();

        UIAuth.showApp();
    }

    function stopApp() {
        Recurrence.stop();
        Notifications.stop();
        Timer.stop();
        Events.stop();
        Config.stop();

        UI.reset();
        UIAuth.showAuth();
    }

    return {
        start
    };
})();

window.addEventListener("DOMContentLoaded", () => {
    try {
        App.start();
    } catch (error) {
        ErrorHandler.handle(error, "Starting Event Toolkit");
    }
});
