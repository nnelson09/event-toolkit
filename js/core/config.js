const Config = (() => {
    const DEFAULT_TROOP_LEVEL = "defaultTroopLevel";
    const TROOP_DIVIDER_PROFILES = "troopDividerProfiles";

    const TROOP_TYPES = ["infantry", "cavalry", "archer"];

    const FALLBACK_TROOP_LEVEL = "10";

    const TROOP_LEVELS = Array.from(
        {
            length: 10
        },
        (_, index) => {
            const value = String(10 - index);

            return {
                value,
                label: `T${value}`
            };
        }
    );

    const defaultTroopLevelListeners = [];
    const troopDividerProfileListeners = [];

    let defaultTroopLevel = null;
    let troopDividerProfiles = [];

    let unsubscribeDefaultTroopLevel = null;
    let unsubscribeTroopDividerProfiles = null;

    function start() {
        if (!unsubscribeDefaultTroopLevel) {
            unsubscribeDefaultTroopLevel = Firebase.listenConfig(DEFAULT_TROOP_LEVEL, handleDefaultTroopLevelChanged);
        }

        if (!unsubscribeTroopDividerProfiles) {
            unsubscribeTroopDividerProfiles = Firebase.listenConfig(TROOP_DIVIDER_PROFILES, handleTroopDividerProfilesChanged);
        }
    }

    function stop() {
        if (unsubscribeDefaultTroopLevel) {
            unsubscribeDefaultTroopLevel();
            unsubscribeDefaultTroopLevel = null;
        }

        if (unsubscribeTroopDividerProfiles) {
            unsubscribeTroopDividerProfiles();
            unsubscribeTroopDividerProfiles = null;
        }

        defaultTroopLevel = null;
        troopDividerProfiles = [];

        notifyDefaultTroopLevelChanged();
        notifyTroopDividerProfilesChanged();
    }

    function getTroopLevels() {
        return TROOP_LEVELS.map(level => ({
            ...level
        }));
    }

    function getTroopLevelLabel(value) {
        const normalizedValue = normalizeLevelValue(value);

        const level = TROOP_LEVELS.find(level => level.value === normalizedValue);

        return level.label;
    }

    function getDefaultTroopLevel() {
        return defaultTroopLevel ?? FALLBACK_TROOP_LEVEL;
    }

    function getTroopDividerProfiles() {
        return troopDividerProfiles
            .map(profile => ({
                ...profile,

                capacity: {
                    ...profile.capacity
                },

                percentages: {
                    ...profile.percentages
                },

                priority: [...profile.priority]
            }))
            .sort(compareProfiles);
    }

    function compareProfiles(a, b) {
        const labelComparison = a.label.localeCompare(b.label, undefined, {
            sensitivity: "base"
        });

        if (labelComparison !== 0) {
            return labelComparison;
        }

        return a.id.localeCompare(b.id);
    }

    function onTroopLevelsChanged(callback) {
        validateCallback(callback);

        callback(getTroopLevels());

        return () => {};
    }

    function onDefaultTroopLevelChanged(callback) {
        validateCallback(callback);

        defaultTroopLevelListeners.push(callback);

        callback(getDefaultTroopLevel());

        return () => {
            removeListener(defaultTroopLevelListeners, callback);
        };
    }

    function onTroopDividerProfilesChanged(callback) {
        validateCallback(callback);

        troopDividerProfileListeners.push(callback);

        callback(getTroopDividerProfiles());

        return () => {
            removeListener(troopDividerProfileListeners, callback);
        };
    }

    async function updateDefaultTroopLevel(value) {
        const normalized = normalizeLevelValue(value);

        await Firebase.setConfig(DEFAULT_TROOP_LEVEL, normalized);
    }

    async function addTroopDividerProfile(data) {
        const id = crypto.randomUUID();

        const normalized = normalizeTroopDividerProfile(id, data);

        await Firebase.setConfig(`${TROOP_DIVIDER_PROFILES}/${id}`, serializeTroopDividerProfile(normalized));

        return id;
    }

    async function updateTroopDividerProfile(profile) {
        if (typeof profile !== "object" || profile === null || Array.isArray(profile)) {
            throw new TypeError("Troop Divider profile must be an object.");
        }

        const normalized = normalizeTroopDividerProfile(profile.id, profile);

        await Firebase.setConfig(`${TROOP_DIVIDER_PROFILES}/${normalized.id}`, serializeTroopDividerProfile(normalized));
    }

    async function removeTroopDividerProfile(id) {
        validateProfileId(id);

        const exists = troopDividerProfiles.some(profile => profile.id === id);

        if (!exists) {
            return;
        }

        await Firebase.setConfig(`${TROOP_DIVIDER_PROFILES}/${id}`, null);
    }

    function handleDefaultTroopLevelChanged(data) {
        if (data === null) {
            defaultTroopLevel = null;

            notifyDefaultTroopLevelChanged();

            return;
        }

        defaultTroopLevel = normalizeLevelValue(data);

        notifyDefaultTroopLevelChanged();
    }

    function handleTroopDividerProfilesChanged(data) {
        troopDividerProfiles = normalizeTroopDividerProfiles(data);

        notifyTroopDividerProfilesChanged();
    }

    function normalizeLevelValue(value) {
        const number = Number(value);

        if (!Number.isInteger(number) || number < 1 || number > 10) {
            throw new RangeError("Troop level must be an integer between 1 and 10.");
        }

        return String(number);
    }

    function normalizeTroopDividerProfiles(data) {
        if (data === null) {
            return [];
        }

        if (typeof data !== "object" || Array.isArray(data)) {
            throw new TypeError("Troop Divider profiles configuration must be an object or null.");
        }

        return Object.entries(data).map(([id, profile]) => {
            return normalizeTroopDividerProfile(id, profile);
        });
    }

    function normalizeTroopDividerProfile(id, profile) {
        validateProfileId(id);

        if (typeof profile !== "object" || profile === null || Array.isArray(profile)) {
            throw new TypeError("Troop Divider profile must be an object.");
        }

        if (typeof profile.label !== "string" || profile.label.trim() === "") {
            throw new TypeError("Troop Divider profile label must be a non-empty string.");
        }

        const queues = normalizeQueueCount(profile.queues);

        const ownQueue = normalizeOwnQueue(profile.ownQueue);

        const capacity = normalizeTroopCapacity(profile.capacity);

        const extra = normalizeExtra(profile.extra);

        const percentages = normalizePercentages(profile.percentages);

        const priority = normalizePriority(profile.priority);

        return {
            id,
            label: profile.label.trim(),
            queues,
            ownQueue,
            capacity,
            extra,
            percentages,
            priority
        };
    }

    function normalizeTroopCapacity(capacity) {
        if (typeof capacity !== "object" || capacity === null || Array.isArray(capacity)) {
            throw new TypeError("Troop capacity must be an object.");
        }

        const base = Number(capacity.base);

        const perHero = Number(capacity.perHero);

        validateCapacityValue(base, "Base troop capacity");

        validateCapacityValue(perHero, "Troop capacity per hero");

        return {
            base,
            perHero
        };
    }

    function serializeTroopDividerProfile(profile) {
        return {
            label: profile.label,
            queues: profile.queues,
            ownQueue: profile.ownQueue,

            capacity: {
                ...profile.capacity
            },

            extra: profile.extra,

            percentages: {
                ...profile.percentages
            },

            priority: [...profile.priority]
        };
    }

    function normalizeQueueCount(value) {
        const queues = Number(value);

        if (!Number.isInteger(queues)) {
            throw new TypeError("Troop Divider queue count must be an integer.");
        }

        if (queues < 1 || queues > 6) {
            throw new RangeError("Troop Divider queue count must be between 1 and 6.");
        }

        return queues;
    }

    function normalizeOwnQueue(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("Troop Divider own queue must be a boolean.");
        }

        return value;
    }

    function normalizeExtra(value) {
        const extra = Number(value);

        if (!Number.isInteger(extra)) {
            throw new TypeError("Troop Divider extra capacity must be an integer.");
        }

        if (extra < 0) {
            throw new RangeError("Troop Divider extra capacity must be non-negative.");
        }

        return extra;
    }

    function normalizePercentages(percentages) {
        if (typeof percentages !== "object" || percentages === null || Array.isArray(percentages)) {
            throw new TypeError("Troop Divider percentages must be an object.");
        }

        const normalized = {};

        TROOP_TYPES.forEach(type => {
            const percentage = Number(percentages[type]);

            if (!Number.isFinite(percentage)) {
                throw new TypeError(`Troop percentage for ${type} must be a finite number.`);
            }

            if (percentage < 0 || percentage > 100) {
                throw new RangeError(`Troop percentage for ${type} must be between 0 and 100.`);
            }

            normalized[type] = percentage;
        });

        const total = Object.values(normalized).reduce((sum, value) => {
            return sum + value;
        }, 0);

        if (total !== 100) {
            throw new RangeError("Troop Divider profile percentages must add up to 100.");
        }

        return normalized;
    }

    function normalizePriority(priority) {
        if (!Array.isArray(priority)) {
            throw new TypeError("Troop Divider priority must be an array.");
        }

        if (priority.length !== TROOP_TYPES.length) {
            throw new RangeError("Troop Divider priority must contain every troop type.");
        }

        const unique = new Set(priority);

        if (unique.size !== TROOP_TYPES.length) {
            throw new RangeError("Troop Divider priority cannot contain duplicates.");
        }

        TROOP_TYPES.forEach(type => {
            if (!unique.has(type)) {
                throw new RangeError(`Troop Divider priority must contain ${type}.`);
            }
        });

        return [...priority];
    }

    function validateProfileId(id) {
        if (typeof id !== "string" || id === "") {
            throw new TypeError("Troop Divider profile id must be a non-empty string.");
        }
    }

    function validateCapacityValue(value, name) {
        if (!Number.isInteger(value)) {
            throw new TypeError(`${name} must be an integer.`);
        }

        if (value < 0) {
            throw new RangeError(`${name} must be non-negative.`);
        }
    }

    function validateCallback(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Config callback must be a function.");
        }
    }

    function removeListener(listeners, callback) {
        const index = listeners.indexOf(callback);

        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    function notifyDefaultTroopLevelChanged() {
        const value = getDefaultTroopLevel();

        defaultTroopLevelListeners.forEach(callback => {
            callback(value);
        });
    }

    function notifyTroopDividerProfilesChanged() {
        const profiles = getTroopDividerProfiles();

        troopDividerProfileListeners.forEach(callback => {
            callback(profiles);
        });
    }

    return {
        start,
        stop,

        getTroopLevels,
        getTroopLevelLabel,
        getDefaultTroopLevel,
        getTroopDividerProfiles,

        onTroopLevelsChanged,
        onDefaultTroopLevelChanged,
        onTroopDividerProfilesChanged,

        updateDefaultTroopLevel,

        addTroopDividerProfile,
        updateTroopDividerProfile,
        removeTroopDividerProfile
    };
})();
