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

        const troops = prepareTroops(data.troops);

        const totalAvailable = sumTroops(troops);

        const capacities = calculateCapacities(data.heroes, data.capacity, data.extra);

        const totalCapacity = capacities.reduce((sum, capacity) => sum + capacity, 0);

        if (totalAvailable > totalCapacity) {
            return fillFormations(data, troops, totalAvailable, capacities, totalCapacity);
        }

        return distributeAllTroops(data, troops, totalAvailable, capacities, totalCapacity);
    }

    /*
     * All available troops fit inside the combined formation capacity.
     *
     * Every troop is used.
     * Formations are filled progressively from the smallest capacity upward,
     * keeping equivalent active formations as balanced as possible.
     */
    function distributeAllTroops(data, troops, totalAvailable, capacities, totalCapacity) {
        const targets = calculateBalancedTargets(totalAvailable, capacities);

        const formations = createFormations(targets, capacities, data.heroes, data.ownQueue);

        const stages = createDistributionStages(targets);

        const remainingTroops = troops.map(troop => ({
            ...troop
        }));

        const ratios = calculateTypeRatios(troops, totalAvailable);

        const plan = findBalancedPlan(stages, 0, remainingTroops, ratios);

        applyDistributionPlan(plan.allocations, formations);

        distributeRemainingTroops(plan.remainingTroops, formations);

        finalizeFormations(formations);

        return createResult(formations, troops, totalAvailable, totalCapacity);
    }

    /*
     * More troops are available than the combined formation capacity.
     *
     * Every formation must be full.
     * Troops are selected according to configured percentages and priority,
     * using the highest troop levels first.
     */
    function fillFormations(data, troops, totalAvailable, capacities, totalCapacity) {
        const availableByType = sumByType(troops);

        const targetByType = calculateTargetTypeAmounts(totalCapacity, availableByType, data.percentages, data.priority);

        const targetTroops = selectHighestLevelTroops(troops, targetByType);

        const formations = createFormations(capacities, capacities, data.heroes, data.ownQueue);

        distributeTargetComposition(troops, targetTroops, formations, totalCapacity, data.priority);

        finalizeFormations(formations);

        return createResult(formations, troops, totalAvailable, totalCapacity);
    }

    function calculateTargetTypeAmounts(totalCapacity, availableByType, percentages, priority) {
        const selected = createTypeTotals();

        const reversePriority = [...priority].reverse();

        reversePriority.forEach(type => {
            const ideal = Math.floor((totalCapacity * percentages[type]) / 100);

            selected[type] = Math.min(availableByType[type], ideal);
        });

        let remaining = totalCapacity - sumTypeTotals(selected);

        priority.forEach(type => {
            if (remaining <= 0) {
                return;
            }

            const availableExtra = availableByType[type] - selected[type];

            const amount = Math.min(availableExtra, remaining);

            selected[type] += amount;

            remaining -= amount;
        });

        if (remaining !== 0) {
            throw new RangeError("Unable to fill troop capacity.");
        }

        return selected;
    }

    function selectHighestLevelTroops(troops, targetByType) {
        const selected = [];

        TROOP_TYPES.forEach(type => {
            let remaining = targetByType[type];

            const candidates = troops.filter(troop => troop.type === type && troop.amount > 0).sort((a, b) => b.levelNumber - a.levelNumber);

            for (const troop of candidates) {
                if (remaining === 0) {
                    break;
                }

                const amount = Math.min(troop.amount, remaining);

                if (amount <= 0) {
                    continue;
                }

                selected.push({
                    ...troop,
                    amount
                });

                remaining -= amount;
            }

            if (remaining !== 0) {
                throw new RangeError(`Unable to select enough ${type} troops.`);
            }
        });

        return selected.sort(compareTroops);
    }

    function distributeTargetComposition(availableTroops, targetTroops, formations, totalCapacity, priority) {
        const rows = createCompositionRows(availableTroops, targetTroops, formations, totalCapacity);

        const capacityGroups = createCapacityGroups(formations).sort((a, b) => {
            return a.capacity - b.capacity;
        });

        distributeProportionalBase(rows, formations, capacityGroups);

        capacityGroups.forEach(group => {
            fillEqualCapacityGroup(rows, formations, group, priority);
        });

        fillRemainingSlots(rows, formations, priority);

        formations.forEach(formation => {
            if (getFormationTotal(formation) !== formation.capacity) {
                throw new RangeError("Formation was not filled to capacity.");
            }
        });
    }

    function createCompositionRows(availableTroops, targetTroops, formations, totalCapacity) {
        const targetByKey = new Map();

        targetTroops.forEach(troop => {
            targetByKey.set(createTroopKey(troop.type, troop.level), troop.amount);
        });

        return availableTroops.map(troop => {
            const targetAmount = targetByKey.get(createTroopKey(troop.type, troop.level)) ?? 0;

            const ratio = targetAmount / totalCapacity;

            return {
                troop: {
                    ...troop
                },

                targetAmount,

                ratio,

                remaining: troop.amount,

                exact: formations.map(formation => {
                    return ratio * formation.capacity;
                }),

                assigned: formations.map(() => 0)
            };
        });
    }

    function distributeProportionalBase(rows, formations, capacityGroups) {
        rows.forEach(row => {
            capacityGroups.forEach(group => {
                const amountPerFormation = Math.floor(row.ratio * group.capacity);

                if (amountPerFormation === 0) {
                    return;
                }

                const required = amountPerFormation * group.indices.length;

                if (required > row.remaining) {
                    throw new RangeError("Proportional base exceeds available troops.");
                }

                group.indices.forEach(index => {
                    addTroopToFormation(formations[index], row.troop, amountPerFormation);

                    row.assigned[index] += amountPerFormation;
                });

                row.remaining -= required;
            });
        });
    }

    function fillEqualCapacityGroup(rows, formations, group, priority) {
        while (getGroupFreeSlots(formations, group) > 0) {
            const candidates = rows.filter(row => {
                return row.remaining >= group.indices.length;
            });

            if (candidates.length === 0) {
                return;
            }

            candidates.sort((a, b) => {
                return compareGroupCandidates(a, b, group, priority);
            });

            const row = candidates[0];

            group.indices.forEach(index => {
                addTroopToFormation(formations[index], row.troop, 1);

                row.assigned[index]++;
            });

            row.remaining -= group.indices.length;
        }
    }

    function getGroupFreeSlots(formations, group) {
        const first = formations[group.indices[0]];

        return first.capacity - getFormationTotal(first);
    }

    function compareGroupCandidates(a, b, group, priority) {
        const index = group.indices[0];

        const costA = calculateDeviationCost(a, index);

        const costB = calculateDeviationCost(b, index);

        if (costA !== costB) {
            return costA - costB;
        }

        return compareTroopPriority(a.troop, b.troop, priority);
    }

    function calculateDeviationCost(row, formationIndex) {
        const current = row.assigned[formationIndex];

        const exact = row.exact[formationIndex];

        const currentDifference = current - exact;

        const nextDifference = current + 1 - exact;

        return nextDifference * nextDifference - currentDifference * currentDifference;
    }

    function fillRemainingSlots(rows, formations, priority) {
        while (true) {
            const formationIndex = formations.findIndex(formation => {
                return getFormationTotal(formation) < formation.capacity;
            });

            if (formationIndex === -1) {
                return;
            }

            const candidates = rows.filter(row => {
                return row.remaining > 0;
            });

            if (candidates.length === 0) {
                throw new RangeError("Unable to fill remaining formation capacity.");
            }

            candidates.sort((a, b) => {
                const costA = calculateDeviationCost(a, formationIndex);

                const costB = calculateDeviationCost(b, formationIndex);

                if (costA !== costB) {
                    return costA - costB;
                }

                return compareTroopPriority(a.troop, b.troop, priority);
            });

            const row = candidates[0];

            addTroopToFormation(formations[formationIndex], row.troop, 1);

            row.assigned[formationIndex]++;

            row.remaining--;
        }
    }

    function createCapacityGroups(formations) {
        const groups = new Map();

        formations.forEach((formation, index) => {
            if (!groups.has(formation.capacity)) {
                groups.set(formation.capacity, []);
            }

            groups.get(formation.capacity).push(index);
        });

        return Array.from(groups.entries()).map(([capacity, indices]) => ({
            capacity,
            indices
        }));
    }

    function compareTroopPriority(a, b, priority) {
        const priorityDifference = priority.indexOf(a.type) - priority.indexOf(b.type);

        if (priorityDifference !== 0) {
            return priorityDifference;
        }

        return b.levelNumber - a.levelNumber;
    }

    function createTroopKey(type, level) {
        return `${type}:${level}`;
    }

    function calculateBalancedTargets(totalAvailable, capacities) {
        const targets = capacities.map(() => 0);

        const ordered = capacities
            .map((capacity, index) => ({
                index,
                capacity
            }))
            .sort((a, b) => {
                if (a.capacity !== b.capacity) {
                    return a.capacity - b.capacity;
                }

                return a.index - b.index;
            });

        let remaining = totalAvailable;

        let previousCapacity = 0;

        for (let position = 0; position < ordered.length; position++) {
            const active = ordered.slice(position);

            const capacity = ordered[position].capacity;

            const increment = capacity - previousCapacity;

            const required = increment * active.length;

            if (required === 0) {
                previousCapacity = capacity;

                continue;
            }

            if (remaining >= required) {
                active.forEach(item => {
                    targets[item.index] += increment;
                });

                remaining -= required;

                previousCapacity = capacity;

                continue;
            }

            const equalIncrement = Math.floor(remaining / active.length);

            active.forEach(item => {
                targets[item.index] += equalIncrement;
            });

            break;
        }

        return targets;
    }

    function createDistributionStages(targets) {
        const targetLevels = [...new Set(targets.filter(target => target > 0))].sort((a, b) => a - b);

        const stages = [];

        let previousTarget = 0;

        targetLevels.forEach(target => {
            const activeIndices = targets
                .map((formationTarget, index) => {
                    return formationTarget >= target ? index : -1;
                })
                .filter(index => index !== -1);

            stages.push({
                activeIndices,
                increment: target - previousTarget
            });

            previousTarget = target;
        });

        return stages;
    }

    function createFormations(targets, capacities, heroes, ownQueue) {
        return targets.map((target, index) => ({
            index,

            ownQueue: ownQueue && index === 0,

            queue: ownQueue ? index : index + 1,

            heroes: heroes[index],

            capacity: capacities[index],

            target,

            total: 0,

            troops: []
        }));
    }

    function calculateTypeRatios(troops, total) {
        const totals = sumByType(troops);

        const ratios = createTypeTotals();

        TROOP_TYPES.forEach(type => {
            ratios[type] = total === 0 ? 0 : totals[type] / total;
        });

        return ratios;
    }

    function findBalancedPlan(stages, stageIndex, troops, ratios) {
        if (stageIndex >= stages.length) {
            return {
                allocations: [],
                remainingTroops: troops,
                symmetricUsed: 0,
                score: 0
            };
        }

        const stage = stages[stageIndex];

        const activeCount = stage.activeIndices.length;

        const availableGroupsByType = calculateAvailableGroupsByType(troops, activeCount);

        const maxIncrement = sumTypeTotals(availableGroupsByType);

        const increment = Math.min(stage.increment, maxIncrement);

        if (increment === 0) {
            return {
                allocations: [],
                remainingTroops: troops,
                symmetricUsed: 0,
                score: 0
            };
        }

        let best = null;

        const candidates = createCompositionCandidates(increment, availableGroupsByType, ratios);

        for (const amounts of candidates) {
            const nextTroops = troops.map(troop => ({
                ...troop
            }));

            const stageAllocations = [];

            let valid = true;

            for (const type of TROOP_TYPES) {
                const allocations = consumeEqualTypeGroups(nextTroops, type, activeCount, amounts[type]);

                if (allocations === null) {
                    valid = false;

                    break;
                }

                allocations.forEach(allocation => {
                    stageAllocations.push({
                        ...allocation,
                        activeIndices: stage.activeIndices
                    });
                });
            }

            if (!valid) {
                continue;
            }

            let future = {
                allocations: [],
                remainingTroops: nextTroops,
                symmetricUsed: 0,
                score: 0
            };

            if (increment === stage.increment) {
                future = findBalancedPlan(stages, stageIndex + 1, nextTroops, ratios);
            }

            const symmetricUsed = increment * activeCount + future.symmetricUsed;

            const score = calculateCompositionScore(amounts, increment, ratios) + future.score;

            const result = {
                allocations: [...stageAllocations, ...future.allocations],
                remainingTroops: future.remainingTroops,
                symmetricUsed,
                score
            };

            if (!best || symmetricUsed > best.symmetricUsed || (symmetricUsed === best.symmetricUsed && score < best.score)) {
                best = result;
            }

            const maximumPossible = calculateRemainingStageCapacity(stages, stageIndex);

            if (best.symmetricUsed === maximumPossible) {
                break;
            }
        }

        return (
            best ?? {
                allocations: [],
                remainingTroops: troops,
                symmetricUsed: 0,
                score: Infinity
            }
        );
    }

    function calculateRemainingStageCapacity(stages, startIndex) {
        let total = 0;

        for (let index = startIndex; index < stages.length; index++) {
            total += stages[index].increment * stages[index].activeIndices.length;
        }

        return total;
    }

    function createCompositionCandidates(increment, availableGroupsByType, ratios) {
        const maxInfantry = Math.min(increment, availableGroupsByType.infantry);

        const maxCavalry = Math.min(increment, availableGroupsByType.cavalry);

        const maxArcher = Math.min(increment, availableGroupsByType.archer);

        const minInfantry = Math.max(0, increment - maxCavalry - maxArcher);

        const idealInfantry = increment * ratios.infantry;

        const infantryValues = getNearbyIntegerValues(minInfantry, maxInfantry, idealInfantry);

        const candidates = [];

        const seen = new Set();

        infantryValues.forEach(infantry => {
            const remaining = increment - infantry;

            const minCavalry = Math.max(0, remaining - maxArcher);

            const maxCavalryForInfantry = Math.min(maxCavalry, remaining);

            const idealCavalry = increment * ratios.cavalry;

            getNearbyIntegerValues(minCavalry, maxCavalryForInfantry, idealCavalry).forEach(cavalry => {
                const archer = remaining - cavalry;

                if (archer < 0 || archer > maxArcher) {
                    return;
                }

                const key = `${infantry}:${cavalry}:${archer}`;

                if (seen.has(key)) {
                    return;
                }

                seen.add(key);

                candidates.push({
                    infantry,
                    cavalry,
                    archer
                });
            });
        });

        return candidates.sort((a, b) => {
            return calculateCompositionScore(a, increment, ratios) - calculateCompositionScore(b, increment, ratios);
        });
    }

    function getNearbyIntegerValues(min, max, ideal) {
        if (min > max) {
            return [];
        }

        const values = new Set();

        const center = Math.max(min, Math.min(max, Math.round(ideal)));

        const radius = 64;

        values.add(min);
        values.add(max);
        values.add(center);

        for (let offset = 1; offset <= radius; offset++) {
            if (center - offset >= min) {
                values.add(center - offset);
            }

            if (center + offset <= max) {
                values.add(center + offset);
            }
        }

        return Array.from(values);
    }

    function calculateCompositionScore(amounts, increment, ratios) {
        return TROOP_TYPES.reduce((score, type) => {
            const expected = increment * ratios[type];

            const difference = amounts[type] - expected;

            return score + difference * difference;
        }, 0);
    }

    function calculateAvailableGroupsByType(troops, activeCount) {
        const groups = createTypeTotals();

        troops.forEach(troop => {
            groups[troop.type] += Math.floor(troop.amount / activeCount);
        });

        return groups;
    }

    function consumeEqualTypeGroups(troops, type, activeCount, amountPerFormation) {
        const allocations = [];

        let remaining = amountPerFormation;

        const candidates = troops
            .filter(troop => {
                return troop.type === type && troop.amount > 0;
            })
            .sort((a, b) => {
                return b.levelNumber - a.levelNumber;
            });

        for (const troop of candidates) {
            if (remaining === 0) {
                break;
            }

            const availablePerFormation = Math.floor(troop.amount / activeCount);

            const amount = Math.min(availablePerFormation, remaining);

            if (amount === 0) {
                continue;
            }

            troop.amount -= amount * activeCount;

            remaining -= amount;

            allocations.push({
                type: troop.type,
                level: troop.level,
                levelNumber: troop.levelNumber,
                amount
            });
        }

        return remaining === 0 ? allocations : null;
    }

    function applyDistributionPlan(allocations, formations) {
        allocations.forEach(allocation => {
            allocation.activeIndices.forEach(index => {
                addTroopToFormation(formations[index], allocation, allocation.amount);
            });
        });
    }

    function distributeRemainingTroops(troops, formations) {
        const remainingTroops = troops
            .filter(troop => {
                return troop.amount > 0;
            })
            .sort(compareTroops);

        remainingTroops.forEach(troop => {
            let remaining = troop.amount;

            for (const formation of formations) {
                if (remaining === 0) {
                    break;
                }

                const freeCapacity = formation.capacity - getFormationTotal(formation);

                if (freeCapacity <= 0) {
                    continue;
                }

                const amount = Math.min(remaining, freeCapacity);

                addTroopToFormation(formation, troop, amount);

                remaining -= amount;
            }

            if (remaining !== 0) {
                throw new RangeError("Unable to place all remaining troops.");
            }
        });
    }

    function createResult(formations, troops, totalAvailable, totalCapacity) {
        const availableByType = sumByType(troops);

        const usedTroops = formations.flatMap(formation => formation.troops);

        const usedByType = sumByType(usedTroops);

        const totalUsed = sumTroops(usedTroops);

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
            usedPercentages: calculatePercentages(usedByType, totalUsed),
            unusedByType
        };
    }

    function finalizeFormations(formations) {
        formations.forEach(formation => {
            formation.troops.sort(compareTroops);

            formation.total = getFormationTotal(formation);

            if (formation.total > formation.capacity) {
                throw new RangeError("Formation exceeds troop capacity.");
            }

            formation.percentages = calculatePercentages(sumByType(formation.troops), formation.total);
        });
    }

    function addTroopToFormation(formation, troop, amount) {
        const existing = formation.troops.find(entry => {
            return entry.type === troop.type && entry.level === troop.level;
        });

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

    function getFormationTotal(formation) {
        return sumTroops(formation.troops);
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
        if (a.levelNumber !== b.levelNumber) {
            return b.levelNumber - a.levelNumber;
        }

        return TROOP_TYPES.indexOf(a.type) - TROOP_TYPES.indexOf(b.type);
    }

    function calculateCapacities(heroes, capacity, extra) {
        return heroes.map(heroCount => {
            return capacity.base + heroCount * capacity.perHero + extra;
        });
    }

    function sumTroops(troops) {
        return troops.reduce((sum, troop) => {
            return sum + troop.amount;
        }, 0);
    }

    function sumByType(troops) {
        const totals = createTypeTotals();

        troops.forEach(troop => {
            totals[troop.type] += troop.amount;
        });

        return totals;
    }

    function sumTypeTotals(totals) {
        return TROOP_TYPES.reduce((sum, type) => {
            return sum + totals[type];
        }, 0);
    }

    function calculatePercentages(totals, total) {
        const percentages = createTypeTotals();

        if (total === 0) {
            return percentages;
        }

        TROOP_TYPES.forEach(type => {
            percentages[type] = Math.round((totals[type] / total) * 10000) / 100;
        });

        return percentages;
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

        if (Math.abs(total - 100) > 1e-9) {
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
