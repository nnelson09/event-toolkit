const Config = (() => {
    const TROOP_LEVELS = "troopLevels";
    const DEFAULT_TROOP_LEVEL = "defaultTroopLevel";

    const troopLevelListeners = [];

    let troopLevels = [];
    let defaultTroopLevel = null;

    let unsubscribeTroopLevels = null;
    let unsubscribeDefaultTroopLevel = null;

    function start() {
        if (!unsubscribeTroopLevels) {
            unsubscribeTroopLevels = Firebase.listenConfig(TROOP_LEVELS, handleTroopLevelsChanged);
        }

        if (!unsubscribeDefaultTroopLevel) {
            unsubscribeDefaultTroopLevel = Firebase.listenConfig(DEFAULT_TROOP_LEVEL, handleDefaultTroopLevelChanged);
        }
    }

    function stop() {
        if (unsubscribeTroopLevels) {
            unsubscribeTroopLevels();
            unsubscribeTroopLevels = null;
        }

        if (unsubscribeDefaultTroopLevel) {
            unsubscribeDefaultTroopLevel();
            unsubscribeDefaultTroopLevel = null;
        }

        troopLevels = [];
        defaultTroopLevel = null;

        notifyTroopLevelsChanged();
    }

    function getTroopLevels() {
        return troopLevels.map(level => ({ ...level }));
    }

    function getTroopLevelLabel(value) {
        validateLevelValue(value);

        const normalizedValue = String(value);

        const level = troopLevels.find(level => level.value === normalizedValue);

        return level ? level.label : normalizedValue;
    }

    function getDefaultTroopLevel() {
        return defaultTroopLevel;
    }

    function onTroopLevelsChanged(callback) {
        troopLevelListeners.push(callback);

        callback(getTroopLevels());

        return () => {
            const index = troopLevelListeners.indexOf(callback);

            if (index !== -1) {
                troopLevelListeners.splice(index, 1);
            }
        };
    }

    function handleTroopLevelsChanged(data) {
        troopLevels = normalizeTroopLevels(data);

        notifyTroopLevelsChanged();
    }

    function handleDefaultTroopLevelChanged(data) {
        if (data === null) {
            defaultTroopLevel = null;
            return;
        }

        validateLevelValue(data);

        defaultTroopLevel = String(data);
    }

    function normalizeTroopLevels(data) {
        if (data === null) {
            return [];
        }

        if (!Array.isArray(data) && (typeof data !== "object" || data === null)) {
            throw new TypeError("Troop levels configuration must be an array, object, or null.");
        }

        const levels = Array.isArray(data) ? data : Object.values(data);

        return levels.map(normalizeTroopLevel);
    }

    function normalizeTroopLevel(level) {
        if (typeof level === "string" || (typeof level === "number" && Number.isFinite(level))) {
            return {
                value: String(level),
                label: `Lv. ${level}`
            };
        }

        if (typeof level !== "object" || level === null || level.value === undefined || level.label === undefined) {
            throw new TypeError("Each troop level must contain a value and label.");
        }

        validateLevelValue(level.value);

        if (typeof level.label !== "string") {
            throw new TypeError("Troop level label must be a string.");
        }

        return {
            value: String(level.value),
            label: level.label
        };
    }

    function validateLevelValue(value) {
        const validString = typeof value === "string";
        const validNumber = typeof value === "number" && Number.isFinite(value);

        if (!validString && !validNumber) {
            throw new TypeError("Troop level value must be a string or finite number.");
        }
    }

    function notifyTroopLevelsChanged() {
        const levels = getTroopLevels();

        troopLevelListeners.forEach(callback => {
            callback(levels);
        });
    }

    return {
        start,
        stop,
        getTroopLevels,
        getTroopLevelLabel,
        getDefaultTroopLevel,
        onTroopLevelsChanged
    };
})();
