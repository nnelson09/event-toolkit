const UITroopDivider = (() => {
    const troops = new Map();

    const NUMBER_LOCALE = "en-GB";
    const COPY_FEEDBACK_DURATION = 700;
    const HERO_COUNTS = [3, 2, 1, 0];
    const TROOP_TYPES = ["infantry", "cavalry", "archer"];

    let closeCallback = null;
    let configCallback = null;

    let profiles = [];

    let container;
    let btnClose;
    let btnConfig;

    let profileSelect;
    let queueSelect;
    let ownQueueInput;

    let heroAssigned;
    let heroGroupInputs;

    let typeSelect;
    let levelSelect;
    let amountInput;
    let btnAdd;
    let enteredTroops;
    let enteredTroopList;

    let summaryCapacity;
    let summaryUsed;
    let summaryUsagePercentage;
    let finalPercentages;

    let results;

    function start() {
        cacheDOM();
        bindEvents();
        renderIcons();

        renderTroopLevels(Config.getTroopLevels());

        renderProfiles(Config.getTroopDividerProfiles());

        render();
    }

    function cacheDOM() {
        container = document.getElementById("troopDivider");

        btnClose = document.getElementById("btnTroopDividerClose");

        btnConfig = document.getElementById("btnTroopDividerConfig");

        profileSelect = document.getElementById("troopProfile");

        queueSelect = document.getElementById("troopQueues");

        ownQueueInput = document.getElementById("troopOwnQueue");

        heroAssigned = document.getElementById("troopHeroesAssigned");

        heroGroupInputs = new Map(HERO_COUNTS.map(count => [count, document.getElementById(`troopHeroes${count}`)]));

        typeSelect = document.getElementById("troopType");

        levelSelect = document.getElementById("troopLevel");

        amountInput = document.getElementById("troopAmount");

        btnAdd = document.getElementById("btnTroopAdd");

        enteredTroops = document.getElementById("troopEntered");

        enteredTroopList = document.getElementById("troopEnteredList");

        summaryCapacity = document.getElementById("troopSummaryCapacity");

        summaryUsed = document.getElementById("troopSummaryUsed");

        summaryUsagePercentage = document.getElementById("troopSummaryUsagePercentage");

        finalPercentages = document.getElementById("troopFinalPercentages");

        results = document.getElementById("troopResults");
    }

    function bindEvents() {
        btnClose.addEventListener("click", close);

        btnConfig.addEventListener("click", notifyConfig);

        btnAdd.addEventListener("click", addTroop);

        profileSelect.addEventListener("change", handleProfileChange);

        queueSelect.addEventListener("change", handleQueueChange);

        ownQueueInput.addEventListener("change", render);

        heroGroupInputs.forEach(input => {
            input.addEventListener("change", handleHeroGroupChange);
        });

        amountInput.addEventListener("input", handleAmountInput);

        amountInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                addTroop();
            }
        });

        Config.onTroopLevelsChanged(renderTroopLevels);

        Config.onDefaultTroopLevelChanged(() => {
            applyDefaultLevel();
        });

        Config.onTroopDividerProfilesChanged(renderProfiles);
    }

    function renderIcons() {
        btnClose.replaceChildren(Icons.create(Icons.CANCEL));

        btnConfig.replaceChildren(Icons.create(Icons.SETTINGS));

        btnAdd.replaceChildren(Icons.create(Icons.ADD));
    }

    function onClose(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Close callback must be a function.");
        }

        closeCallback = callback;
    }

    function onConfig(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Config callback must be a function.");
        }

        configCallback = callback;
    }

    function notifyConfig() {
        if (configCallback) {
            configCallback();
        }
    }

    function open() {
        applyDefaultLevel();

        container.hidden = false;
    }

    function close() {
        if (container.hidden) {
            return;
        }

        container.hidden = true;

        if (closeCallback) {
            closeCallback();
        }
    }

    function renderProfiles(newProfiles) {
        profiles = newProfiles;

        const currentId = profileSelect.value;

        profileSelect.replaceChildren();

        profiles.forEach(profile => {
            const option = document.createElement("option");

            option.value = profile.id;
            option.textContent = profile.label;

            profileSelect.appendChild(option);
        });

        if (profiles.length === 0) {
            render();

            return;
        }

        const currentExists = profiles.some(profile => profile.id === currentId);

        if (currentExists) {
            profileSelect.value = currentId;
        } else {
            profileSelect.value = profiles[0].id;

            applyProfileDefaults(profiles[0]);
        }

        render();
    }

    function handleProfileChange() {
        const profile = getSelectedProfile();

        if (!profile) {
            render();

            return;
        }

        applyProfileDefaults(profile);

        render();
    }

    function applyProfileDefaults(profile) {
        queueSelect.value = String(profile.queues);

        ownQueueInput.checked = profile.ownQueue;

        resetHeroGroups();
    }

    function handleQueueChange() {
        resetHeroGroups();

        render();
    }

    function resetHeroGroups() {
        heroGroupInputs.forEach(input => {
            input.value = "0";

            input.classList.remove("invalid");
        });

        renderHeroGroupOptions();
    }

    function handleHeroGroupChange() {
        renderHeroGroupOptions();

        render();
    }

    function renderHeroGroupOptions() {
        const queues = Number(queueSelect.value);

        HERO_COUNTS.forEach(currentCount => {
            const select = heroGroupInputs.get(currentCount);

            const currentValue = Number(select.value);

            const usedByOthers = HERO_COUNTS.reduce((sum, count) => {
                if (count === currentCount) {
                    return sum;
                }

                return sum + readHeroGroupValue(heroGroupInputs.get(count));
            }, 0);

            const maxValue = Math.max(0, queues - usedByOthers);

            select.replaceChildren();

            for (let value = 0; value <= maxValue; value++) {
                const option = document.createElement("option");

                option.value = String(value);
                option.textContent = String(value);

                select.appendChild(option);
            }

            select.value = String(Math.min(currentValue, maxValue));
        });
    }

    function readHeroGroupValue(select) {
        const value = Number(select.value);

        return Number.isInteger(value) && value >= 0 ? value : 0;
    }

    function getSelectedProfile() {
        const id = profileSelect.value;

        return profiles.find(profile => profile.id === id) ?? null;
    }

    function applyDefaultLevel() {
        const levels = Config.getTroopLevels();

        if (levels.length === 0) {
            levelSelect.value = "";

            return;
        }

        const defaultLevel = Config.getDefaultTroopLevel();

        const defaultExists = levels.some(level => level.value === defaultLevel);

        levelSelect.value = defaultExists ? defaultLevel : levels[0].value;
    }

    function addTroop() {
        const type = readSelectValue(typeSelect);

        const level = readSelectValue(levelSelect);

        const amount = readAmount();

        const validLevel = level !== null;

        const validAmount = amount !== null && Number.isInteger(amount) && amount > 0;

        amountInput.classList.toggle("invalid", !validAmount);

        if (!type || !validLevel || !validAmount) {
            return;
        }

        const key = createKey(type, level);

        if (troops.has(key)) {
            highlightEnteredTroop(key, "feedback-danger");

            return;
        }

        troops.set(key, {
            type,
            level,
            amount
        });

        amountInput.value = "";

        amountInput.classList.remove("invalid");

        render();

        highlightEnteredTroop(key, "feedback-success");
    }

    function removeTroop(key) {
        if (!troops.has(key)) {
            return;
        }

        troops.delete(key);

        render();
    }

    function renderEnteredTroops() {
        enteredTroopList.replaceChildren();

        if (troops.size === 0) {
            enteredTroops.hidden = true;

            return;
        }

        enteredTroops.hidden = false;

        getSortedEnteredTroops().forEach(troop => {
            enteredTroopList.appendChild(createEnteredTroopRow(troop));
        });
    }

    function getSortedEnteredTroops() {
        return Array.from(troops.values()).sort(compareEnteredTroops);
    }

    function compareEnteredTroops(a, b) {
        const levelDifference = Number(a.level) - Number(b.level);

        if (levelDifference !== 0) {
            return levelDifference;
        }

        return TROOP_TYPES.indexOf(a.type) - TROOP_TYPES.indexOf(b.type);
    }

    function createEnteredTroopRow(troop) {
        const key = createKey(troop.type, troop.level);

        const row = document.createElement("div");

        row.className = "troop-entered-row";
        row.dataset.key = key;

        const name = document.createElement("div");

        name.className = "troop-entered-name";

        name.textContent = `${formatType(troop.type)} ` + Config.getTroopLevelLabel(troop.level);

        const amount = document.createElement("div");

        amount.className = "troop-entered-amount";

        amount.textContent = formatNumber(troop.amount);

        const btnDelete = document.createElement("button");

        btnDelete.type = "button";
        btnDelete.className = "troop-entered-delete";
        btnDelete.title = "Delete";

        btnDelete.appendChild(Icons.create(Icons.DELETE));

        btnDelete.addEventListener("click", () => {
            removeTroop(key);
        });

        row.addEventListener("animationend", handleEnteredTroopAnimationEnd);

        row.append(name, amount, btnDelete);

        return row;
    }

    function highlightEnteredTroop(key, className) {
        const row = Array.from(enteredTroopList.children).find(element => {
            return element.dataset.key === key;
        });

        if (!row) {
            return;
        }

        restartFeedback(row, className);
    }

    function restartFeedback(element, className) {
        element.classList.remove("feedback-success", "feedback-danger");

        void element.offsetWidth;

        element.classList.add(className);
    }

    function handleEnteredTroopAnimationEnd(event) {
        if (event.target !== event.currentTarget) {
            return;
        }

        if (event.animationName === "feedbackSuccessFade") {
            event.currentTarget.classList.remove("feedback-success");

            return;
        }

        if (event.animationName === "feedbackDangerFade") {
            event.currentTarget.classList.remove("feedback-danger");
        }
    }

    function renderTroopLevels(levels) {
        const currentValue = readSelectValue(levelSelect);

        levelSelect.replaceChildren();

        levels.forEach(level => {
            const option = document.createElement("option");

            option.value = level.value;
            option.textContent = level.label;

            levelSelect.appendChild(option);
        });

        if (levels.length === 0) {
            return;
        }

        const currentExists = currentValue !== null && levels.some(level => level.value === currentValue);

        if (currentExists) {
            levelSelect.value = currentValue;

            return;
        }

        applyDefaultLevel();
    }

    function handleAmountInput() {
        amountInput.classList.remove("invalid");

        const digits = getDigits(amountInput.value);

        if (digits === "") {
            amountInput.value = "";

            return;
        }

        amountInput.value = formatNumber(Number(digits));
    }

    function readAmount() {
        const digits = getDigits(amountInput.value);

        if (digits === "") {
            return null;
        }

        const amount = Number(digits);

        return Number.isFinite(amount) ? amount : null;
    }

    function readSelectValue(select) {
        return select.value === "" ? null : select.value;
    }

    function getDigits(value) {
        return value.replace(/\D/g, "");
    }

    function render() {
        results.replaceChildren();

        renderEnteredTroops();

        const profile = getSelectedProfile();

        const heroConfig = readHeroConfiguration();

        renderHeroStatus(heroConfig);

        if (!profile) {
            renderUnavailable();
            clearSummary();

            return;
        }

        if (!heroConfig.valid) {
            renderHeroConfigurationRequired();
            clearSummary();

            return;
        }

        if (troops.size === 0) {
            renderEmpty();
            clearSummary();

            return;
        }

        try {
            const result = TroopDivider.divide({
                troops: Array.from(troops.values()),

                queues: Number(queueSelect.value),

                ownQueue: ownQueueInput.checked,

                heroes: heroConfig.heroes,

                capacity: profile.capacity,

                extra: profile.extra,

                percentages: profile.percentages,

                priority: profile.priority
            });

            renderSummary(result);

            renderResults(result);
        } catch (error) {
            clearSummary();

            ErrorHandler.handle(error, "Rendering Troop Divider");
        }
    }

    function readHeroConfiguration() {
        const queues = Number(queueSelect.value);

        const groups = {};

        let assigned = 0;

        HERO_COUNTS.forEach(count => {
            const select = heroGroupInputs.get(count);

            const value = Number(select.value);

            const valid = Number.isInteger(value) && value >= 0 && value <= queues;

            select.classList.toggle("invalid", !valid);

            groups[count] = valid ? value : 0;

            assigned += valid ? value : 0;
        });

        const valid = assigned === queues;

        const heroes = [];

        if (ownQueueInput.checked) {
            heroes.push(3);
        }

        HERO_COUNTS.forEach(count => {
            for (let index = 0; index < groups[count]; index++) {
                heroes.push(count);
            }
        });

        return {
            valid,
            assigned,
            queues,
            groups,
            heroes
        };
    }

    function renderHeroStatus(config) {
        heroAssigned.textContent = `${config.assigned}/${config.queues}`;

        heroAssigned.classList.toggle("invalid", !config.valid);
    }

    function renderSummary(result) {
        const usagePercentage = result.totalCapacity === 0 ? 0 : (result.totalUsed / result.totalCapacity) * 100;

        summaryCapacity.textContent = formatNumber(result.totalCapacity);

        summaryUsed.textContent = formatNumber(result.totalUsed);

        summaryUsagePercentage.textContent = formatUsagePercentage(usagePercentage);

        const percentages = result.usedPercentages;

        finalPercentages.textContent =
            `I ${formatPercentage(percentages.infantry)} · ` + `C ${formatPercentage(percentages.cavalry)} · ` + `A ${formatPercentage(percentages.archer)}`;
    }

    function clearSummary() {
        summaryCapacity.textContent = "—";

        summaryUsed.textContent = "—";

        summaryUsagePercentage.textContent = "—";

        finalPercentages.textContent = "—";
    }

    function renderResults(result) {
        const groups = groupFormations(result.formations);

        groups.forEach(group => {
            results.appendChild(createFormationGroup(group));
        });
    }

    function groupFormations(formations) {
        const groups = new Map();

        formations.forEach(formation => {
            const key = createFormationSignature(formation);

            if (!groups.has(key)) {
                groups.set(key, {
                    capacity: formation.capacity,
                    formations: []
                });
            }

            groups.get(key).formations.push(formation);
        });

        return Array.from(groups.values());
    }

    function createFormationSignature(formation) {
        const troopSignature = formation.troops
            .slice()
            .sort(compareResultTroops)
            .map(troop => {
                return `${troop.level}:${troop.type}:${troop.amount}`;
            })
            .join("|");

        return `${formation.capacity}|${formation.total}|${troopSignature}`;
    }

    function compareResultTroops(a, b) {
        const levelA = a.levelNumber !== undefined ? a.levelNumber : Number(a.level);

        const levelB = b.levelNumber !== undefined ? b.levelNumber : Number(b.level);

        if (levelA !== levelB) {
            return levelB - levelA;
        }

        return TROOP_TYPES.indexOf(a.type) - TROOP_TYPES.indexOf(b.type);
    }

    function createFormationGroup(group) {
        const card = document.createElement("div");

        card.className = "troop-formation-group";

        const header = document.createElement("div");

        header.className = "troop-formation-group-header";

        const title = document.createElement("div");

        title.className = "troop-formation-group-title";

        title.textContent = formatGroupTitle(group);

        const capacityElement = document.createElement("div");

        capacityElement.className = "troop-formation-group-capacity";

        capacityElement.textContent = formatNumber(group.capacity);

        header.append(title, capacityElement);

        card.appendChild(header);

        const levelGroups = groupTroopsByLevel(group.formations[0].troops);

        levelGroups.forEach(levelGroup => {
            card.appendChild(createLevelRow(levelGroup));
        });

        return card;
    }

    function formatGroupTitle(group) {
        const hasOwn = group.formations.some(formation => {
            return formation.ownQueue;
        });

        const queues = group.formations
            .filter(formation => !formation.ownQueue)
            .map(formation => formation.queue)
            .sort((a, b) => a - b);

        const parts = [];

        if (hasOwn) {
            parts.push("Own");
        }

        if (queues.length > 0) {
            parts.push(formatQueueRange(queues));
        }

        return parts.join(" · ");
    }

    function formatQueueRange(queues) {
        if (queues.length === 1) {
            return `Q${queues[0]}`;
        }

        const ranges = [];

        let start = queues[0];
        let previous = queues[0];

        for (let index = 1; index <= queues.length; index++) {
            const current = queues[index];

            if (current === previous + 1) {
                previous = current;

                continue;
            }

            ranges.push(start === previous ? `Q${start}` : `Q${start}–Q${previous}`);

            start = current;
            previous = current;
        }

        return ranges.join(", ");
    }

    function groupTroopsByLevel(troopEntries) {
        const grouped = new Map();

        troopEntries
            .slice()
            .sort(compareResultTroops)
            .forEach(troop => {
                if (!grouped.has(troop.level)) {
                    grouped.set(troop.level, {
                        level: troop.level,

                        levelNumber: troop.levelNumber !== undefined ? troop.levelNumber : Number(troop.level),

                        troops: new Map()
                    });
                }

                grouped.get(troop.level).troops.set(troop.type, troop.amount);
            });

        return Array.from(grouped.values()).sort((a, b) => {
            return b.levelNumber - a.levelNumber;
        });
    }

    function createLevelRow(levelGroup) {
        const row = document.createElement("div");

        row.className = "troop-level-row";

        const level = document.createElement("div");

        level.className = "troop-level-row-level";

        level.textContent = Config.getTroopLevelLabel(levelGroup.level);

        row.appendChild(level);

        TROOP_TYPES.forEach(type => {
            const amount = levelGroup.troops.get(type) ?? 0;

            row.appendChild(createLevelTroopValue(type, amount));
        });

        return row;
    }

    function createLevelTroopValue(type, value) {
        const container = document.createElement("div");

        container.className = "troop-level-value";

        if (value === 0) {
            container.classList.add("empty");

            return container;
        }

        const label = document.createElement("span");

        label.className = "troop-level-type";

        label.textContent = formatTypeShort(type);

        const number = document.createElement("span");

        number.className = "troop-result-number";

        number.textContent = formatNumber(value);

        number.title = `Copy ${formatType(type)}`;

        number.tabIndex = 0;

        const feedback = document.createElement("span");

        feedback.className = "troop-copy-feedback";

        feedback.textContent = "Copied";

        number.addEventListener("click", () => {
            copyResult(number, feedback, value);
        });

        number.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();

                copyResult(number, feedback, value);
            }
        });

        container.append(label, number, feedback);

        return container;
    }

    async function copyResult(number, feedback, value) {
        const copied = await copyText(String(value));

        if (!copied) {
            return;
        }

        showCopyFeedback(number, feedback);
    }

    async function copyText(text) {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);

                return true;
            } catch (error) {
                ErrorHandler.handle(error, "Copying with Clipboard API");
            }
        }

        const textarea = document.createElement("textarea");

        textarea.value = text;

        textarea.style.position = "fixed";

        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        try {
            textarea.select();

            return document.execCommand("copy");
        } catch (error) {
            ErrorHandler.handle(error, "Copying with fallback");

            return false;
        } finally {
            textarea.remove();
        }
    }

    function showCopyFeedback(number, feedback) {
        number.classList.add("copied");

        feedback.classList.add("visible");

        setTimeout(() => {
            number.classList.remove("copied");

            feedback.classList.remove("visible");
        }, COPY_FEEDBACK_DURATION);
    }

    function renderEmpty() {
        renderMessage("Add troops to calculate the split.");
    }

    function renderUnavailable() {
        renderMessage("Troop Divider configuration is unavailable.");
    }

    function renderHeroConfigurationRequired() {
        renderMessage("Assign every queue to a hero group.");
    }

    function renderMessage(text) {
        const empty = document.createElement("div");

        empty.className = "troop-results-empty";

        empty.textContent = text;

        results.appendChild(empty);
    }

    function createKey(type, level) {
        return `${type}:${level}`;
    }

    function formatType(type) {
        switch (type) {
            case "infantry":
                return "Infantry";

            case "cavalry":
                return "Cavalry";

            case "archer":
                return "Archers";

            default:
                throw new RangeError(`Unsupported troop type: ${type}`);
        }
    }

    function formatTypeShort(type) {
        switch (type) {
            case "infantry":
                return "I";

            case "cavalry":
                return "C";

            case "archer":
                return "A";

            default:
                throw new RangeError(`Unsupported troop type: ${type}`);
        }
    }

    function formatNumber(value) {
        return value.toLocaleString(NUMBER_LOCALE);
    }

    function formatPercentage(value) {
        return `${value}%`;
    }

    function formatUsagePercentage(value) {
        return `${Math.round(value * 10) / 10}%`;
    }

    return {
        start,
        onClose,
        onConfig,
        open,
        close
    };
})();
