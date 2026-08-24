const TroopDivider = (() => {
    const TROOP_TYPES = ["infantry", "cavalry", "archer"];

    const MIN_QUEUES = 1;
    const MAX_QUEUES = 6;

    const MIN_HEROES = 0;
    const MAX_HEROES = 3;

    function divide(data) {
        validateData(data);

        const formationCount = data.queues + (data.ownQueue ? 1 : 0);

        if (data.heroes.length !== formationCount) {
            throw new RangeError("Hero count must contain one value for every formation.");
        }

        const capacities = calculateCapacities(data.heroes, data.capacity, data.extra);

        const totalCapacity = capacities.reduce((sum, value) => sum + value, 0);

        const availableTroops = prepareTroops(data.troops);

        const totalAvailable = availableTroops.reduce((sum, troop) => sum + troop.amount, 0);

        const totalUsed = Math.min(totalAvailable, totalCapacity);

        const selectedTroops = selectTroops(availableTroops, totalUsed, data.percentages, data.priority);

        const formations = distributeSelectedTroops(selectedTroops, capacities, data.heroes, data.ownQueue, totalUsed, totalCapacity);

        const availableByType = sumByType(availableTroops);

        const usedByType = sumByType(selectedTroops);

        const usedPercentages = calculatePercentages(usedByType, totalUsed);

        const unusedByType = createTypeTotals();

        TROOP_TYPES.forEach(type => {
            unusedByType[type] = availableByType[type] - usedByType[type];
        });

        return {
            formations,
            totalCapacity,
            totalAvailable,
            totalUsed,
            availableByType,
            usedByType,
            usedPercentages,
            unusedByType
        };
    }

    function prepareTroops(troops) {
        return troops
            .map(troop => ({
                type: troop.type,
                level: String(troop.level),
                levelNumber: parseLevel(troop.level),
                amount: troop.amount
            }))
            .sort(compareTroops);
    }

    function compareTroops(a, b) {
        if (a.type !== b.type) {
            return TROOP_TYPES.indexOf(a.type) - TROOP_TYPES.indexOf(b.type);
        }

        return b.levelNumber - a.levelNumber;
    }

    function selectTroops(troops, totalUsed, percentages, priority) {
        const remainingTroops = troops.map(troop => ({
            ...troop
        }));

        const selected = [];

        const targets = calculateTargets(totalUsed, percentages, priority);

        TROOP_TYPES.forEach(type => {
            takeTroops(remainingTroops, selected, type, targets[type]);
        });

        let remaining = totalUsed - selected.reduce((sum, troop) => sum + troop.amount, 0);

        priority.forEach(type => {
            if (remaining <= 0) {
                return;
            }

            remaining -= takeTroops(remainingTroops, selected, type, remaining);
        });

        if (remaining !== 0) {
            throw new RangeError("Unable to select enough troops to fill the requested capacity.");
        }

        return mergeSelectedTroops(selected);
    }

    function calculateTargets(total, percentages, priority) {
        const exactTargets = {};
        const targets = {};

        let assigned = 0;

        TROOP_TYPES.forEach(type => {
            const exact = (total * percentages[type]) / 100;

            exactTargets[type] = exact;

            targets[type] = Math.floor(exact);

            assigned += targets[type];
        });

        let remainder = total - assigned;

        const priorityIndex = new Map(priority.map((type, index) => [type, index]));

        const order = [...TROOP_TYPES].sort((a, b) => {
            const fractionA = exactTargets[a] - Math.floor(exactTargets[a]);

            const fractionB = exactTargets[b] - Math.floor(exactTargets[b]);

            if (fractionA !== fractionB) {
                return fractionB - fractionA;
            }

            return priorityIndex.get(a) - priorityIndex.get(b);
        });

        let index = 0;

        while (remainder > 0) {
            targets[order[index % order.length]]++;

            remainder--;
            index++;
        }

        return targets;
    }

    function takeTroops(remainingTroops, selected, type, requestedAmount) {
        let remaining = requestedAmount;
        let takenTotal = 0;

        const candidates = remainingTroops.filter(troop => troop.type === type && troop.amount > 0).sort((a, b) => b.levelNumber - a.levelNumber);

        for (const troop of candidates) {
            if (remaining <= 0) {
                break;
            }

            const taken = Math.min(troop.amount, remaining);

            if (taken <= 0) {
                continue;
            }

            selected.push({
                type: troop.type,
                level: troop.level,
                levelNumber: troop.levelNumber,
                amount: taken
            });

            troop.amount -= taken;

            remaining -= taken;
            takenTotal += taken;
        }

        return takenTotal;
    }

    function mergeSelectedTroops(troops) {
        const merged = new Map();

        troops.forEach(troop => {
            const key = `${troop.type}:${troop.level}`;

            const existing = merged.get(key);

            if (existing) {
                existing.amount += troop.amount;

                return;
            }

            merged.set(key, {
                ...troop
            });
        });

        return Array.from(merged.values()).sort(compareTroops);
    }

    function calculateCapacities(heroes, capacity, extra) {
        return heroes.map(heroCount => {
            return capacity.base + heroCount * capacity.perHero + extra;
        });
    }

    function distributeSelectedTroops(selectedTroops, capacities, heroes, ownQueue, totalUsed, totalCapacity) {
        const formations = capacities.map((capacity, index) => ({
            index,

            ownQueue: ownQueue && index === 0,

            queue: ownQueue ? index : index + 1,

            heroes: heroes[index],

            capacity,

            total: 0,

            troops: []
        }));

        if (totalUsed === 0) {
            formations.forEach(formation => {
                formation.percentages = createTypeTotals();
            });

            return formations;
        }

        const sinkIndex = 0;

        const groups = createUniformGroups(capacities, sinkIndex, totalUsed, totalCapacity);

        const categoryTotals = selectedTroops.map(troop => troop.amount);

        const groupCompositions = allocateGroupCompositions(groups, categoryTotals, totalUsed, capacities[sinkIndex]);

        const usedByCategory = categoryTotals.map(() => 0);

        groups.forEach((group, groupIndex) => {
            const composition = groupCompositions[groupIndex];

            group.indices.forEach(formationIndex => {
                composition.forEach((amount, categoryIndex) => {
                    if (amount > 0) {
                        addTroopToFormation(formations[formationIndex], selectedTroops[categoryIndex], amount);
                    }

                    usedByCategory[categoryIndex] += amount;
                });

                formations[formationIndex].total = group.perFormationTotal;
            });
        });

        const sinkTroops = categoryTotals.map((total, categoryIndex) => {
            return total - usedByCategory[categoryIndex];
        });

        if (sinkTroops.some(amount => amount < 0)) {
            throw new RangeError("Uniform distribution used more troops than available.");
        }

        sinkTroops.forEach((amount, categoryIndex) => {
            if (amount > 0) {
                addTroopToFormation(formations[sinkIndex], selectedTroops[categoryIndex], amount);
            }
        });

        formations[sinkIndex].total = sinkTroops.reduce((sum, amount) => sum + amount, 0);

        if (formations[sinkIndex].total > formations[sinkIndex].capacity) {
            throw new RangeError("Remainder formation exceeds its capacity.");
        }

        formations.forEach(formation => {
            formation.troops.sort(compareTroops);

            const actualTotal = formation.troops.reduce((sum, troop) => sum + troop.amount, 0);

            if (actualTotal !== formation.total || formation.total > formation.capacity) {
                throw new RangeError("Troop distribution produced an invalid formation total.");
            }

            formation.percentages = calculatePercentages(sumByType(formation.troops), formation.total);
        });

        const distributedTotal = formations.reduce((sum, formation) => sum + formation.total, 0);

        if (distributedTotal !== totalUsed) {
            throw new RangeError("Troop distribution did not preserve the total used troops.");
        }

        return formations;
    }

    function createUniformGroups(capacities, sinkIndex, totalUsed, totalCapacity) {
        const usage = totalCapacity === 0 ? 0 : totalUsed / totalCapacity;

        const groupsByCapacity = new Map();

        capacities.forEach((capacity, index) => {
            if (index === sinkIndex) {
                return;
            }

            if (!groupsByCapacity.has(capacity)) {
                groupsByCapacity.set(capacity, []);
            }

            groupsByCapacity.get(capacity).push(index);
        });

        const groups = Array.from(groupsByCapacity.entries()).map(([capacity, indices]) => ({
            capacity,
            indices,
            count: indices.length,
            exactTotal: capacity * usage,
            perFormationTotal: Math.min(capacity, Math.round(capacity * usage))
        }));

        let sinkTotal = calculateSinkTotal(groups, totalUsed);

        let guard = 0;

        while ((sinkTotal < 0 || sinkTotal > capacities[sinkIndex]) && guard < 10000) {
            if (sinkTotal < 0) {
                const candidates = groups.filter(group => group.perFormationTotal > 0);

                if (candidates.length === 0) {
                    break;
                }

                const group = candidates.sort(compareDecreasePenalty)[0];

                group.perFormationTotal--;

                sinkTotal += group.count;
            } else {
                const candidates = groups.filter(group => group.perFormationTotal < group.capacity);

                if (candidates.length === 0) {
                    break;
                }

                const group = candidates.sort(compareIncreasePenalty)[0];

                group.perFormationTotal++;

                sinkTotal -= group.count;
            }

            guard++;
        }

        if (sinkTotal < 0 || sinkTotal > capacities[sinkIndex]) {
            throw new RangeError("Unable to preserve equal usage across formation groups.");
        }

        return groups;
    }

    function calculateSinkTotal(groups, totalUsed) {
        return totalUsed - groups.reduce((sum, group) => sum + group.perFormationTotal * group.count, 0);
    }

    function compareDecreasePenalty(a, b) {
        const penaltyA = Math.abs(a.perFormationTotal - 1 - a.exactTotal) - Math.abs(a.perFormationTotal - a.exactTotal);

        const penaltyB = Math.abs(b.perFormationTotal - 1 - b.exactTotal) - Math.abs(b.perFormationTotal - b.exactTotal);

        return penaltyA - penaltyB;
    }

    function compareIncreasePenalty(a, b) {
        const penaltyA = Math.abs(a.perFormationTotal + 1 - a.exactTotal) - Math.abs(a.perFormationTotal - a.exactTotal);

        const penaltyB = Math.abs(b.perFormationTotal + 1 - b.exactTotal) - Math.abs(b.perFormationTotal - b.exactTotal);

        return penaltyA - penaltyB;
    }

    function allocateGroupCompositions(groups, categoryTotals, totalUsed, sinkCapacity) {
        const usedByCategory = categoryTotals.map(() => 0);

        const compositions = [];

        let sinkTotal = totalUsed - groups.reduce((sum, group) => sum + group.perFormationTotal * group.count, 0);

        groups.forEach(group => {
            const exact = categoryTotals.map(total => {
                return (group.perFormationTotal * total) / totalUsed;
            });

            const composition = exact.map((value, categoryIndex) => {
                const availablePerFormation = Math.floor((categoryTotals[categoryIndex] - usedByCategory[categoryIndex]) / group.count);

                return Math.min(Math.floor(value), availablePerFormation);
            });

            composition.forEach((amount, categoryIndex) => {
                usedByCategory[categoryIndex] += amount * group.count;
            });

            let remaining = group.perFormationTotal - composition.reduce((sum, amount) => sum + amount, 0);

            while (remaining > 0) {
                const candidates = categoryTotals
                    .map((total, categoryIndex) => ({
                        categoryIndex,

                        available: total - usedByCategory[categoryIndex],

                        score: exact[categoryIndex] - composition[categoryIndex]
                    }))
                    .filter(candidate => candidate.available >= group.count)
                    .sort((a, b) => {
                        if (a.score !== b.score) {
                            return b.score - a.score;
                        }

                        if (a.available !== b.available) {
                            return b.available - a.available;
                        }

                        return a.categoryIndex - b.categoryIndex;
                    });

                if (candidates.length === 0) {
                    if (sinkTotal + group.count > sinkCapacity || group.perFormationTotal <= 0) {
                        throw new RangeError("Unable to keep equivalent formations identical.");
                    }

                    group.perFormationTotal--;

                    sinkTotal += group.count;

                    remaining--;

                    continue;
                }

                const categoryIndex = candidates[0].categoryIndex;

                composition[categoryIndex]++;

                usedByCategory[categoryIndex] += group.count;

                remaining--;
            }

            compositions.push(composition);
        });

        return compositions;
    }

    function addTroopToFormation(formation, troop, amount) {
        const existing = formation.troops.find(entry => entry.type === troop.type && entry.level === troop.level);

        if (existing) {
            existing.amount += amount;

            return;
        }

        formation.troops.push({
            type: troop.type,
            level: troop.level,
            levelNumber: troop.levelNumber,
            amount
        });
    }

    function calculatePercentages(totals, total) {
        const percentages = createTypeTotals();

        if (total === 0) {
            return percentages;
        }

        TROOP_TYPES.forEach(type => {
            percentages[type] = roundPercentage((totals[type] / total) * 100);
        });

        return percentages;
    }

    function roundPercentage(value) {
        return Math.round(value * 100) / 100;
    }

    function sumByType(troops) {
        const totals = createTypeTotals();

        troops.forEach(troop => {
            totals[troop.type] += troop.amount;
        });

        return totals;
    }

    function createTypeTotals() {
        return {
            infantry: 0,
            cavalry: 0,
            archer: 0
        };
    }

    function parseLevel(level) {
        const value = Number(level);

        if (!Number.isFinite(value)) {
            throw new TypeError("Troop level must be numeric.");
        }

        return value;
    }

    function validateData(data) {
        if (typeof data !== "object" || data === null || Array.isArray(data)) {
            throw new TypeError("Troop Divider data must be an object.");
        }

        validateTroops(data.troops);

        validateQueues(data.queues);

        validateOwnQueue(data.ownQueue);

        validateHeroes(data.heroes);

        validateCapacity(data.capacity);

        validateExtra(data.extra);

        validatePercentages(data.percentages);

        validatePriority(data.priority);
    }

    function validateTroops(troops) {
        if (!Array.isArray(troops)) {
            throw new TypeError("Troops must be an array.");
        }

        troops.forEach(troop => {
            if (typeof troop !== "object" || troop === null || Array.isArray(troop)) {
                throw new TypeError("Each troop must be an object.");
            }

            if (!TROOP_TYPES.includes(troop.type)) {
                throw new RangeError(`Unsupported troop type: ${troop.type}`);
            }

            parseLevel(troop.level);

            if (!Number.isInteger(troop.amount)) {
                throw new TypeError("Troop amount must be an integer.");
            }

            if (troop.amount < 0) {
                throw new RangeError("Troop amount must be non-negative.");
            }
        });
    }

    function validateQueues(queues) {
        if (!Number.isInteger(queues)) {
            throw new TypeError("Queue count must be an integer.");
        }

        if (queues < MIN_QUEUES || queues > MAX_QUEUES) {
            throw new RangeError("Queue count must be between 1 and 6.");
        }
    }

    function validateOwnQueue(ownQueue) {
        if (typeof ownQueue !== "boolean") {
            throw new TypeError("Own queue must be a boolean.");
        }
    }

    function validateHeroes(heroes) {
        if (!Array.isArray(heroes)) {
            throw new TypeError("Heroes must be an array.");
        }

        heroes.forEach(count => {
            if (!Number.isInteger(count)) {
                throw new TypeError("Hero count must be an integer.");
            }

            if (count < MIN_HEROES || count > MAX_HEROES) {
                throw new RangeError("Hero count must be between 0 and 3.");
            }
        });
    }

    function validateCapacity(capacity) {
        if (typeof capacity !== "object" || capacity === null || Array.isArray(capacity)) {
            throw new TypeError("Troop capacity must be an object.");
        }

        validateCapacityValue(capacity.base, "Base troop capacity");

        validateCapacityValue(capacity.perHero, "Troop capacity per hero");
    }

    function validateCapacityValue(value, name) {
        if (!Number.isInteger(value)) {
            throw new TypeError(`${name} must be an integer.`);
        }

        if (value < 0) {
            throw new RangeError(`${name} must be non-negative.`);
        }
    }

    function validateExtra(extra) {
        if (!Number.isInteger(extra)) {
            throw new TypeError("Extra troop capacity must be an integer.");
        }

        if (extra < 0) {
            throw new RangeError("Extra troop capacity must be non-negative.");
        }
    }

    function validatePercentages(percentages) {
        if (typeof percentages !== "object" || percentages === null || Array.isArray(percentages)) {
            throw new TypeError("Troop percentages must be an object.");
        }

        let total = 0;

        TROOP_TYPES.forEach(type => {
            const value = percentages[type];

            if (typeof value !== "number" || !Number.isFinite(value)) {
                throw new TypeError(`Troop percentage for ${type} must be a finite number.`);
            }

            if (value < 0 || value > 100) {
                throw new RangeError(`Troop percentage for ${type} must be between 0 and 100.`);
            }

            total += value;
        });

        if (total !== 100) {
            throw new RangeError("Troop percentages must add up to 100.");
        }
    }

    function validatePriority(priority) {
        if (!Array.isArray(priority)) {
            throw new TypeError("Troop priority must be an array.");
        }

        if (priority.length !== TROOP_TYPES.length) {
            throw new RangeError("Troop priority must contain every troop type.");
        }

        const unique = new Set(priority);

        if (unique.size !== TROOP_TYPES.length) {
            throw new RangeError("Troop priority cannot contain duplicates.");
        }

        TROOP_TYPES.forEach(type => {
            if (!unique.has(type)) {
                throw new RangeError(`Troop priority must contain ${type}.`);
            }
        });
    }

    return {
        divide
    };
})();
