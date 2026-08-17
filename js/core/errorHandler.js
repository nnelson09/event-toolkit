const ErrorHandler = (() => {
    function handle(error, context = null) {
        const normalizedError = normalizeError(error);
        const normalizedContext = normalizeContext(context);

        if (normalizedContext !== null) {
            console.error(`[${normalizedContext}]`, normalizedError);

            return;
        }

        console.error(normalizedError);
    }

    function normalizeError(error) {
        if (error instanceof Error) {
            return error;
        }

        return new Error(String(error));
    }

    function normalizeContext(context) {
        if (context === null) {
            return null;
        }

        return String(context);
    }

    return {
        handle
    };
})();
