const UINotifications = (() => {
    function start() {
        // Reservado para inicializaciones futuras.
    }

    function info(message) {
        console.info(message);
    }

    function success(message) {
        console.log(message);
    }

    function error(message) {
        console.error(message);
    }

    return {
        start,

        info,
        success,
        error
    };
})();
