const UITroopDividerConfig = (() => {
    const NUMBER_LOCALE = "en-GB";
    const TROOP_TYPES = ["infantry", "cavalry", "archer"];

    let closeCallback = null;

    let selectedProfileId = null;
    let creatingProfile = false;

    let deletePending = false;
    let deleteInProgress = false;

    let defaultLevel = null;

    let container;

    let defaultLevelSection;
    let profileSection;

    let btnClose;

    let defaultLevelSelect;

    let profileSelect;
    let btnAddProfile;
    let btnDeleteProfile;
    let btnSaveProfile;

    let inputProfileName;
    let inputQueues;
    let inputOwnQueue;

    let inputBaseCapacity;
    let inputPerHeroCapacity;
    let inputExtra;

    let inputInfantry;
    let inputCavalry;
    let inputArcher;
    let percentageTotal;

    let priority1;
    let priority2;
    let priority3;

    function start() {
        cacheDOM();
        bindEvents();
        renderIcons();

        renderDefaultLevel(Config.getDefaultTroopLevel());

        renderProfiles(Config.getTroopDividerProfiles());
    }

    function cacheDOM() {
        container = document.getElementById("troopDividerConfig");

        defaultLevelSection = document.getElementById("troopLevelsConfigSection");

        profileSection = document.getElementById("troopProfilesConfigSection");

        btnClose = document.getElementById("btnTroopDividerConfigClose");

        defaultLevelSelect = document.getElementById("troopConfigDefaultLevel");

        profileSelect = document.getElementById("troopConfigProfile");

        btnAddProfile = document.getElementById("btnTroopConfigProfileAdd");

        btnDeleteProfile = document.getElementById("btnTroopConfigProfileDelete");

        btnSaveProfile = document.getElementById("btnTroopConfigProfileSave");

        inputProfileName = document.getElementById("troopConfigProfileName");

        inputQueues = document.getElementById("troopConfigQueues");

        inputOwnQueue = document.getElementById("troopConfigOwnQueue");

        inputBaseCapacity = document.getElementById("troopCapacityBase");

        inputPerHeroCapacity = document.getElementById("troopCapacityPerHero");

        inputExtra = document.getElementById("troopConfigExtra");

        inputInfantry = document.getElementById("troopConfigInfantry");

        inputCavalry = document.getElementById("troopConfigCavalry");

        inputArcher = document.getElementById("troopConfigArcher");

        percentageTotal = document.getElementById("troopConfigPercentageTotal");

        priority1 = document.getElementById("troopConfigPriority1");

        priority2 = document.getElementById("troopConfigPriority2");

        priority3 = document.getElementById("troopConfigPriority3");
    }

    function bindEvents() {
        btnClose.addEventListener("click", close);

        defaultLevelSelect.addEventListener("change", saveDefaultLevel);

        profileSelect.addEventListener("change", handleProfileChange);

        btnAddProfile.addEventListener("click", startNewProfile);

        btnDeleteProfile.addEventListener("click", handleDeleteProfile);

        btnSaveProfile.addEventListener("click", saveProfile);

        bindIntegerInput(inputBaseCapacity);
        bindIntegerInput(inputPerHeroCapacity);
        bindIntegerInput(inputExtra);

        inputInfantry.addEventListener("input", renderPercentageTotal);
        inputCavalry.addEventListener("input", renderPercentageTotal);
        inputArcher.addEventListener("input", renderPercentageTotal);

        priority1.addEventListener("change", renderPriorityState);
        priority2.addEventListener("change", renderPriorityState);
        priority3.addEventListener("change", renderPriorityState);

        defaultLevelSection.addEventListener("animationend", handleDefaultLevelAnimationEnd);

        profileSection.addEventListener("animationend", handleProfileAnimationEnd);

        Config.onDefaultTroopLevelChanged(renderDefaultLevel);

        Config.onTroopDividerProfilesChanged(renderProfiles);
    }

    function renderIcons() {
        btnClose.replaceChildren(Icons.create(Icons.CANCEL));

        btnAddProfile.replaceChildren(Icons.create(Icons.ADD));

        btnDeleteProfile.replaceChildren(Icons.create(Icons.DELETE));

        btnSaveProfile.replaceChildren(Icons.create(Icons.ACCEPT));
    }

    function onClose(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Close callback must be a function.");
        }

        closeCallback = callback;
    }

    function open() {
        cancelDeleteConfirmation();

        renderDefaultLevel(Config.getDefaultTroopLevel());

        renderProfiles(Config.getTroopDividerProfiles());

        container.hidden = false;
    }

    function close() {
        if (container.hidden) {
            return;
        }

        cancelDeleteConfirmation();

        container.hidden = true;

        if (closeCallback) {
            closeCallback();
        }
    }

    function bindIntegerInput(input) {
        input.addEventListener("input", () => {
            input.classList.remove("invalid");

            formatIntegerInput(input);
        });
    }

    function formatIntegerInput(input) {
        const digits = getDigits(input.value);

        if (digits === "") {
            input.value = "";

            return;
        }

        input.value = formatNumber(Number(digits));
    }

    function renderDefaultLevel(value) {
        defaultLevel = String(value);

        renderDefaultLevelOptions();
    }

    function renderDefaultLevelOptions() {
        const levels = Config.getTroopLevels();

        defaultLevelSelect.replaceChildren();

        levels.forEach(level => {
            const option = document.createElement("option");

            option.value = level.value;
            option.textContent = level.label;

            defaultLevelSelect.appendChild(option);
        });

        const configuredExists = levels.some(level => level.value === defaultLevel);

        defaultLevelSelect.value = configuredExists ? defaultLevel : Config.getDefaultTroopLevel();
    }

    async function saveDefaultLevel() {
        try {
            await Config.updateDefaultTroopLevel(defaultLevelSelect.value);

            showSuccess(defaultLevelSection);
        } catch (error) {
            ErrorHandler.handle(error, "Saving default troop level");
        }
    }

    function renderProfiles(profiles) {
        if (!Array.isArray(profiles)) {
            throw new TypeError("Troop Divider profiles must be an array.");
        }

        const previousId = selectedProfileId;

        profileSelect.replaceChildren();

        profiles.forEach(profile => {
            const option = document.createElement("option");

            option.value = profile.id;
            option.textContent = profile.label;

            profileSelect.appendChild(option);
        });

        if (creatingProfile) {
            appendNewProfileOption();

            renderProfileActions();

            return;
        }

        if (profiles.length === 0) {
            selectedProfileId = null;

            profileSelect.disabled = true;

            clearProfileForm();

            renderProfileActions();

            return;
        }

        profileSelect.disabled = false;

        const previousExists = profiles.some(profile => profile.id === previousId);

        selectedProfileId = previousExists ? previousId : profiles[0].id;

        profileSelect.value = selectedProfileId;

        renderSelectedProfile();

        renderProfileActions();
    }

    function appendNewProfileOption() {
        const option = document.createElement("option");

        option.value = "";
        option.textContent = "New profile";

        option.disabled = true;
        option.hidden = true;
        option.selected = true;

        profileSelect.prepend(option);

        profileSelect.disabled = false;
        profileSelect.value = "";
    }

    function handleProfileChange() {
        cancelDeleteConfirmation();

        if (profileSelect.value === "") {
            return;
        }

        creatingProfile = false;

        selectedProfileId = profileSelect.value;

        renderProfiles(Config.getTroopDividerProfiles());
    }

    function renderSelectedProfile() {
        const profile = getSelectedProfile();

        if (!profile) {
            clearProfileForm();

            return;
        }

        inputProfileName.value = profile.label;

        inputQueues.value = String(profile.queues);

        inputOwnQueue.checked = profile.ownQueue;

        inputBaseCapacity.value = formatNumber(profile.capacity.base);

        inputPerHeroCapacity.value = formatNumber(profile.capacity.perHero);

        inputExtra.value = formatNumber(profile.extra);

        inputInfantry.value = String(profile.percentages.infantry);

        inputCavalry.value = String(profile.percentages.cavalry);

        inputArcher.value = String(profile.percentages.archer);

        priority1.value = profile.priority[0];

        priority2.value = profile.priority[1];

        priority3.value = profile.priority[2];

        clearProfileInvalidState();

        renderPercentageTotal();

        renderPriorityState();
    }

    function getSelectedProfile() {
        if (!selectedProfileId) {
            return null;
        }

        return (
            Config.getTroopDividerProfiles().find(profile => {
                return profile.id === selectedProfileId;
            }) ?? null
        );
    }

    function startNewProfile() {
        cancelDeleteConfirmation();

        creatingProfile = true;
        selectedProfileId = null;

        renderProfiles(Config.getTroopDividerProfiles());

        inputProfileName.value = "";

        inputQueues.value = "1";

        inputOwnQueue.checked = false;

        inputBaseCapacity.value = "0";

        inputPerHeroCapacity.value = "0";

        inputExtra.value = "0";

        inputInfantry.value = "33";
        inputCavalry.value = "33";
        inputArcher.value = "34";

        priority1.value = "archer";
        priority2.value = "cavalry";
        priority3.value = "infantry";

        clearProfileInvalidState();

        renderPercentageTotal();

        renderPriorityState();

        renderProfileActions();

        inputProfileName.focus();
    }

    async function saveProfile() {
        try {
            cancelDeleteConfirmation();

            const profile = readProfile();

            if (selectedProfileId && !creatingProfile) {
                await Config.updateTroopDividerProfile({
                    id: selectedProfileId,

                    ...profile
                });

                showSuccess(profileSection);

                return;
            }

            const id = await Config.addTroopDividerProfile(profile);

            creatingProfile = false;
            selectedProfileId = id;

            renderProfiles(Config.getTroopDividerProfiles());

            showSuccess(profileSection);
        } catch (error) {
            ErrorHandler.handle(error, "Saving Troop Divider profile");
        }
    }

    function handleDeleteProfile() {
        if (!selectedProfileId || creatingProfile || deleteInProgress) {
            return;
        }

        if (!deletePending) {
            startDeleteConfirmation();

            return;
        }

        deleteProfile();
    }

    function startDeleteConfirmation() {
        deletePending = true;

        restartFeedback(profileSection, "feedback-danger");

        restartFeedback(btnDeleteProfile, "feedback-danger-button");
    }

    async function deleteProfile() {
        if (!deletePending || !selectedProfileId) {
            return;
        }

        deletePending = false;
        deleteInProgress = true;

        const id = selectedProfileId;

        try {
            await Config.removeTroopDividerProfile(id);

            selectedProfileId = null;
            creatingProfile = false;

            cancelDeleteConfirmation();
        } catch (error) {
            cancelDeleteConfirmation();

            ErrorHandler.handle(error, "Deleting Troop Divider profile");
        } finally {
            deleteInProgress = false;
        }
    }

    function cancelDeleteConfirmation() {
        deletePending = false;

        profileSection.classList.remove("feedback-danger");

        btnDeleteProfile.classList.remove("feedback-danger-button");
    }

    function readProfile() {
        const label = inputProfileName.value.trim();

        if (label === "") {
            inputProfileName.classList.add("invalid");

            throw new TypeError("Profile name must be a non-empty string.");
        }

        inputProfileName.classList.remove("invalid");

        const percentages = {
            infantry: readPercentage(inputInfantry, "Infantry percentage"),

            cavalry: readPercentage(inputCavalry, "Cavalry percentage"),

            archer: readPercentage(inputArcher, "Archer percentage")
        };

        const percentageSum = Object.values(percentages).reduce((sum, value) => {
            return sum + value;
        }, 0);

        if (percentageSum !== 100) {
            throw new RangeError("Troop percentages must add up to 100.");
        }

        return {
            label,

            queues: Number(inputQueues.value),

            ownQueue: inputOwnQueue.checked,

            capacity: {
                base: readNonNegativeInteger(inputBaseCapacity, "Base troop capacity"),

                perHero: readNonNegativeInteger(inputPerHeroCapacity, "Troop capacity per hero")
            },

            extra: readNonNegativeInteger(inputExtra, "Extra troop capacity"),

            percentages,

            priority: readPriority()
        };
    }

    function readPercentage(input, name) {
        const value = Number(input.value);

        const valid = Number.isFinite(value) && value >= 0 && value <= 100;

        input.classList.toggle("invalid", !valid);

        if (!valid) {
            throw new RangeError(`${name} must be between 0 and 100.`);
        }

        return value;
    }

    function readPriority() {
        const priority = [priority1.value, priority2.value, priority3.value];

        const valid = priority.every(type => TROOP_TYPES.includes(type)) && new Set(priority).size === TROOP_TYPES.length;

        priority1.classList.toggle("invalid", !valid);
        priority2.classList.toggle("invalid", !valid);
        priority3.classList.toggle("invalid", !valid);

        if (!valid) {
            throw new RangeError("Troop priority must contain every troop type exactly once.");
        }

        return priority;
    }

    function renderPriorityState() {
        const priority = [priority1.value, priority2.value, priority3.value];

        const valid = priority.every(type => TROOP_TYPES.includes(type)) && new Set(priority).size === TROOP_TYPES.length;

        priority1.classList.toggle("invalid", !valid);
        priority2.classList.toggle("invalid", !valid);
        priority3.classList.toggle("invalid", !valid);
    }

    function readNonNegativeInteger(input, name) {
        const digits = getDigits(input.value);

        if (digits === "") {
            input.classList.add("invalid");

            throw new TypeError(`${name} must be an integer.`);
        }

        const value = Number(digits);

        const valid = Number.isInteger(value) && value >= 0;

        input.classList.toggle("invalid", !valid);

        if (!valid) {
            throw new RangeError(`${name} must be non-negative.`);
        }

        return value;
    }

    function clearProfileForm() {
        inputProfileName.value = "";

        inputQueues.value = "1";

        inputOwnQueue.checked = false;

        inputBaseCapacity.value = "0";

        inputPerHeroCapacity.value = "0";

        inputExtra.value = "0";

        inputInfantry.value = "";

        inputCavalry.value = "";

        inputArcher.value = "";

        priority1.value = "archer";
        priority2.value = "cavalry";
        priority3.value = "infantry";

        clearProfileInvalidState();

        renderPercentageTotal();

        renderPriorityState();
    }

    function clearProfileInvalidState() {
        [
            inputProfileName,
            inputBaseCapacity,
            inputPerHeroCapacity,
            inputExtra,
            inputInfantry,
            inputCavalry,
            inputArcher,
            priority1,
            priority2,
            priority3
        ].forEach(element => {
            element.classList.remove("invalid");
        });
    }

    function renderPercentageTotal() {
        const total = readOptionalPercentage(inputInfantry) + readOptionalPercentage(inputCavalry) + readOptionalPercentage(inputArcher);

        percentageTotal.textContent = `Total ${total}%`;

        percentageTotal.classList.toggle("valid", total === 100);

        percentageTotal.classList.toggle("invalid", total !== 100);
    }

    function readOptionalPercentage(input) {
        if (input.value === "") {
            return 0;
        }

        const value = Number(input.value);

        return Number.isFinite(value) ? value : 0;
    }

    function renderProfileActions() {
        const canDelete = selectedProfileId !== null && !creatingProfile;

        btnDeleteProfile.disabled = !canDelete;

        btnDeleteProfile.title = canDelete ? "Delete profile" : "No saved profile selected";

        btnSaveProfile.title = creatingProfile ? "Create profile" : "Save profile";
    }

    function showSuccess(section) {
        restartFeedback(section, "feedback-success");
    }

    function restartFeedback(element, className) {
        element.classList.remove(className);

        void element.offsetWidth;

        element.classList.add(className);
    }

    function handleDefaultLevelAnimationEnd(event) {
        if (event.target === defaultLevelSection && event.animationName === "feedbackSuccessFade") {
            defaultLevelSection.classList.remove("feedback-success");
        }
    }

    function handleProfileAnimationEnd(event) {
        if (event.target !== profileSection) {
            return;
        }

        if (event.animationName === "feedbackSuccessFade") {
            profileSection.classList.remove("feedback-success");

            return;
        }

        if (event.animationName === "feedbackDangerFade") {
            cancelDeleteConfirmation();
        }
    }

    function getDigits(value) {
        return value.replace(/\D/g, "");
    }

    function formatNumber(value) {
        return value.toLocaleString(NUMBER_LOCALE);
    }

    return {
        start,
        onClose,
        open,
        close
    };
})();
