import OBR from "@owlbear-rodeo/sdk";
import DiceBox from "@3d-dice/dice-box-deterministic";

let isRolling = false;
let popoverIds = [];
let isCleared = true;

function rollDice(number, diceType) {
    if (!Number.isInteger(number) || number < 1) {
        console.error(`Invalid number of dice: ${number}`);
        return { total: 0, individualRolls: [] };
    }
    if (!Number.isInteger(diceType) || diceType < 2) {
        console.error(`Invalid dice type: d${diceType}`);
        return { total: 0, individualRolls: [] };
    }
    let total = 0;
    let individualRolls = [];
    for (let i = 0; i < number; i++) {
        const roll = Math.floor(Math.random() * diceType) + 1;
        individualRolls.push(roll);
        total += roll;
    }
    return { total, individualRolls };
}

function createHistoryEntry(command, attackRolls, damageResults, hpResult) {
    const card = document.createElement('div');
    card.classList.add('card');
    const entry = document.createElement('div');
    entry.classList.add('history-entry');

    if (command !== null) {
        const commandDiv = document.createElement('div');
        commandDiv.innerText = textToEmoji(command);
        commandDiv.classList.add('code-font'); 
        entry.appendChild(commandDiv);
    }

    if (attackRolls !== null) {
        const attackDiv = document.createElement('div');
        attackDiv.innerHTML = attackRolls.join(', ');
        entry.appendChild(attackDiv);
    }

    if (damageResults !== null) {
        const damageDiv = document.createElement('div');

        const damageExpressionParts = damageResults.map(result => {
            if (result === 'm') {
                return `<span class="damage-miss">m</span>`;
            }

            const damageByType = {};
            result.forEach(d => {
                const type = d.damageType || 'untyped';
                damageByType[type] = (damageByType[type] || 0) + d.value;
            });

            const sortedDamage = Object.entries(damageByType)
                .map(([type, value]) => ({ type, value }))
                .sort((a, b) => b.value - a.value);

            const damageStrings = sortedDamage.map(d => {
                const colorClass = getDamageColor(d.value);
                return `<span class="${colorClass}">${d.value}${d.type !== 'untyped' ? `<span class="damage-type">${textToEmoji(d.type)}</span>` : ''}</span>`;
            }).join(' + ');

            return sortedDamage.length > 1 ? `[${damageStrings}]` : damageStrings;
        });

        const totalDamageByType = {};
        damageResults.forEach(result => {
            if (result === 'm') return;
            result.forEach(d => {
                const type = d.damageType || 'untyped';
                totalDamageByType[type] = (totalDamageByType[type] || 0) + d.value;
            });
        });

        const sortedTotalDamage = Object.entries(totalDamageByType)
            .map(([type, value]) => ({ type, value }))
            .sort((a, b) => b.value - a.value);

        const sortedTotalDamageStrings = sortedTotalDamage.map(d => {
            const colorClass = getDamageColor(d.value);
            return `<span class="${colorClass}">${d.value}${d.type !== 'untyped' ? `<span class="damage-type">${textToEmoji(d.type)}</span>` : ''}</span>`;
        }).join(' + ');

        const overallTotalDamage = sortedTotalDamage.reduce((acc, d) => acc + d.value, 0);

        if (damageExpressionParts.length === 1) {
            damageDiv.innerHTML = damageExpressionParts[0];
        } else if (sortedTotalDamage.length > 1) {
            const formattedTotalDamage = `${sortedTotalDamageStrings} = <span class="${getTotalDamageColor(overallTotalDamage)}">${overallTotalDamage}</span>`;
            const formattedDamageDisplay = `${damageExpressionParts.join(' + ')} = ${formattedTotalDamage}`;
            damageDiv.innerHTML = formattedDamageDisplay;
        } else if (sortedTotalDamage.length === 1) {
            const totalType = sortedTotalDamage[0].type !== 'untyped' ? textToEmoji(sortedTotalDamage[0].type) : '';
            const formattedTotalDamage = `<span class="${getTotalDamageColor(overallTotalDamage)}">${overallTotalDamage}${totalType !== 'untyped' ? `<span class="damage-type">${textToEmoji(totalType)}</span>` : ''}</span>`;
            damageDiv.innerHTML = `${damageExpressionParts.join(' + ')} = ${formattedTotalDamage}`;
        } else {
            damageDiv.innerHTML = `${damageExpressionParts.join(' + ')}`;
        }

        entry.appendChild(damageDiv);
    }

    if (hpResult !== null) {
        const hpDiv = document.createElement('div');
        hpDiv.style.color = 'white';
        hpDiv.style.fontWeight = 'bold';
        hpDiv.innerText = `${hpResult.old} → ${hpResult.new}`;
        entry.appendChild(hpDiv);
    }

    card.appendChild(entry);

    function handleCardInteraction() {
        if (command !== null) {
            const inputField = document.getElementById('attackCommand');
            if (inputField) {
                inputField.value = textToEmoji(command);
            }
        }
    }
    card.addEventListener('click', handleCardInteraction);
    card.addEventListener('touchend', handleCardInteraction);


    return card;
}

function time_config(t) {
    t = (1 - t / 100) * 0.5 + t / 100 * (2 - 0.5)

    // gravity: 1.6,
    // mass: 1,
    // friction: 0.6,
    // restitution: 0.1,
    // angularDamping: 0.4,
    // linearDamping: 0.4,
    // spinForce: 4,
    // throwForce: 4,
    // startingHeight: 10,
    // settleTimeout: 4500,
    // scale: 7,
    const originalConfig = {
        gravity: 1.6,
        mass: 1,
        friction: 0.6,
        restitution: 0.3,
        angularDamping: 0.2,
        linearDamping: 0.3,
        spinForce: 5,
        throwForce: 4,
        startingHeight: 10,
        settleTimeout: 4000,
        scale: 7,
        lightIntensity: 1,
        enableShadows: true,
        shadowTransparency: 0.8,
        theme: 'smooth',
        themeColor: '#eeeeee',
        preloadThemes: ['gemstone', 'dice-of-rolling', 'smooth', 'rock', 'rust', 'blue-green-metal']
    };

    return {
        assetPath: '/assets/dice-box/',
        container: '#container',
        id: 'dice-canvas',
        gravity: originalConfig.gravity / (t * t),
        mass: originalConfig.mass,
        friction: originalConfig.friction,
        restitution: originalConfig.restitution,
        angularDamping: originalConfig.angularDamping / t,
        linearDamping: originalConfig.linearDamping / t,
        spinForce: originalConfig.spinForce / t,
        throwForce: originalConfig.throwForce / t,
        startingHeight: originalConfig.startingHeight,
        settleTimeout: originalConfig.settleTimeout * t,
        delay: originalConfig.delay * t,
        scale: originalConfig.scale,
        theme: originalConfig.theme,
        themeColor: originalConfig.themeColor,
        preloadThemes: originalConfig.preloadThemes
    };
}

function createDiceBox() {
    const diceCanvas = document.getElementById("dice-canvas");
    if (diceCanvas) {
        diceCanvas.remove();
    }

    var diceBox = new DiceBox(time_config(parseInt(document.querySelector("#physicalSlider").value)));

    const canvas = document.getElementById('dice-canvas');
    canvas.style.pointerEvents = "none";
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '10';

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    diceBox.init().then(() => {

        document.getElementById('container').onclick = () => {
            if (!isRolling) {
                diceBox.clear();
                isCleared = true;
                isRolling = false;
            }
        };
            diceBox.onRollComplete = (result) => {
            isRolling = false;
        };
        diceBox.onBeforeRoll = (result) => {
            isRolling = true;
        };
    });

    return diceBox
}

async function closePopover(popoverId) {
    if (!isHidden) {
        OBR.popover.close(popoverId).catch((error) => {
            console.error("Error closing popover:", error);
        });
    }
}

function clearSharedDice(diceBox) {
    if (Array.isArray(popoverIds)) {
        while (popoverIds.length > 0) {
            const popoverId = popoverIds.shift();
            OBR.broadcast.sendMessage("quickdice.closePopover", {
                'id': popoverId
            }, { destination: 'REMOTE' })
            .catch(error => {
                console.error(`Failed to send closePopover message for ID ${popoverId}:`, error);
            });
        }
    }
}

async function rollSharedDice(id, dimensions, config, diceArray, seed, simSpeed) {
    OBR.broadcast.sendMessage("quickdice.rollPopoverDice", {
        'id': id, 
        'dimensions': dimensions, 
        'config': config,
        'diceArray': diceArray,
        'seed': seed,
        'simSpeed': simSpeed
    }, {destination: 'REMOTE'}).catch(error => {
        console.error("Failed to send broadcast message:", error);
    });
}

async function rollPopoverDice(id, dimensions, config, diceArray, seed, simSpeed) {
    try {
        // Serialize each object to a JSON string
        const serializedId = id;
        const serializedDimensions = JSON.stringify(dimensions);
        const serializedConfig = JSON.stringify(config);
        const serializedDiceArray = JSON.stringify(diceArray);
        const serializedSeed = JSON.stringify(seed);
        const serializedSimSpeed = JSON.stringify(simSpeed);

        // Encode each serialized string for safe URL inclusion
        const encodedId = encodeURIComponent(serializedId);
        const encodedDimensions = encodeURIComponent(serializedDimensions);
        const encodedConfig = encodeURIComponent(serializedConfig);
        const encodedDiceArray = encodeURIComponent(serializedDiceArray);
        const encodedSeed = encodeURIComponent(serializedSeed);
        const encodedSimSpeed = encodeURIComponent(serializedSimSpeed);

        // Construct the popover URL with query parameters
        const popoverURL = `/popover.html?id=${encodedId}&dimensions=${encodedDimensions}&config=${encodedConfig}&diceArray=${encodedDiceArray}&seed=${encodedSeed}&simSpeed=${encodedSimSpeed}`;

        // Open the popover with the constructed URL
        console.log("open popover")
        OBR.popover.open({
            id: id,
            url: popoverURL,
            width: dimensions.width, // 60% of the screen width
            height: dimensions.height, // 60% of the screen height
            anchorOrigin: {
                horizontal: "RIGHT",
                vertical: "BOTTOM",
            },
            transformOrigin: {
                horizontal: "CENTER",
                vertical: "CENTER",
            },
            hidePaper: true, // Makes the background transparent
            disableClickAway: false,
            marginThreshold: 70,
        });

    } catch (error) {
        console.error("Error opening popover:", error);
    }
}

let isHidden;
let isPhysical;
export function setupDiceRoller(userId) {

    updateCommandsList()

    var diceBox = createDiceBox();

    const attackCommandInput = document.getElementById('attackCommand');

    const examples = [
        '5a+4 vs {ac} dmg {count}d6fi+{bonus}bl+1d4',
        '4d+3 vs {ac} dmg {count}d8+{bonus}ne+2d4ac',
        '3a+2 vs {ac} dmg {count}d6co+{bonus}+1d6pi+5'
    ];
    
    const randomAC = Math.floor(Math.random() * 4) + 10;
    const randomBonus = Math.floor(Math.random() * 5) + 1;
    const randomCount = Math.floor(Math.random() * 3) + 1;

    const randomExample = examples[Math.floor(Math.random() * examples.length)]
        .replace('{ac}', randomAC)
        .replace('{bonus}', randomBonus)
        .replace('{count}', randomCount);

    attackCommandInput.value = textToEmoji(randomExample);
    const historyContainer = document.getElementById('history');
    const rollButton = document.getElementById('rollButton');

    const hiddenCheckbox = document.getElementById('hiddenRoll');
    const physicalCheckbox = document.getElementById('physicalRoll');

    rollButton.addEventListener('click', async () => {

        const userInput = emojiToText(attackCommandInput.value).trim();
        const parseResults = parseInput(userInput);
        const cleanedUserInput = parseResults?.cleanedUserInput;
        const attackParams = parseResults?.attackParams;
        if (!attackParams) {
            attackCommandInput.classList.add('input-error');
            setTimeout(() => {
                attackCommandInput.classList.remove('input-error');
            }, 500);

            return;
        }
        isHidden = hiddenCheckbox.checked;
        isPhysical = physicalCheckbox.checked;

        const { attackRolls, damageResults, hpResult } = await performAttack(attackParams, diceBox, isPhysical, isHidden);
        const historyEntry = createHistoryEntry(cleanedUserInput, attackRolls, damageResults, hpResult);
        if (historyEntry.textContent.length > 0) {
            historyContainer.prepend(historyEntry);
        }
        if (historyContainer.children.length >= 20) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
        if (!isHidden) {
            OBR.broadcast.sendMessage("quickdice.diceResults", {
                'command': cleanedUserInput, 
                'attackRolls': attackRolls, 
                'damageResults': damageResults,
                'hpResult': hpResult
            }, {destination: 'REMOTE'}).catch(error => {
                console.error("Failed to send broadcast message:", error);
            });
        }

        if (attackParams.save_content !== null) {
            const commandsJSON = localStorage.getItem('commands');
            let commands = commandsJSON ? JSON.parse(commandsJSON) : {};
            commands[attackParams.save_content] = cleanedUserInput;
            const sortedCommands = Object.keys(commands).sort().reduce((acc, key) => {
                acc[key] = commands[key];
                return acc;
            }, {});
            localStorage.setItem('commands', JSON.stringify(sortedCommands));
            updateCommandsList();
        }
        
        if (attackParams.load_content !== null) {
            const commandsJSON = localStorage.getItem('commands');
            if (commandsJSON) {
                const commands = JSON.parse(commandsJSON);
                if (attackParams.load_content in commands) {
                    attackCommandInput.value = textToEmoji(commands[attackParams.load_content]);
                }
            }
        }

        if (attackParams.delete_content !== null) {
            const commands = JSON.parse(localStorage.getItem('commands') || '{}');
            if (commands.hasOwnProperty(attackParams.delete_content)) {
                delete commands[attackParams.delete_content];
                localStorage.setItem('commands', JSON.stringify(commands));
                updateCommandsList();
            }
        }
    });

    OBR.broadcast.onMessage("quickdice.closePopover", (event) => {
        const { id } = event.data;
        closePopover(id);
    });

    OBR.broadcast.onMessage("quickdice.rollPopoverDice", (event) => {
        const { id, dimensions, config, diceArray, seed, simSpeed } = event.data;
        rollPopoverDice(id, dimensions, config, diceArray, seed, simSpeed);
    });

    OBR.broadcast.onMessage("quickdice.diceResults", (event) => {
        const { command, attackRolls, damageResults, hpResult } = event.data;

        const historyContainer = document.getElementById('history');
        const historyEntry = createHistoryEntry(command, attackRolls, damageResults, hpResult);
        if (historyEntry.textContent.length > 0) {
            historyContainer.prepend(historyEntry);
        }
        if (historyContainer.children.length >= 20) {
            historyContainer.removeChild(historyContainer.lastChild); 
        }
    });

    attackCommandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            rollButton.click();
        }
    });

    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
            event.preventDefault();
            const hiddenRollCheckbox = document.getElementById('hiddenRoll');
            hiddenRollCheckbox.checked = !hiddenRollCheckbox.checked;
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
            event.preventDefault(); 
            const physicalRollCheckbox = document.getElementById('physicalRoll');
            physicalRollCheckbox.checked = !physicalRollCheckbox.checked; 
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            diceBox.clear();
            isCleared = true;
            isRolling = false;
            clearSharedDice(diceBox);
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault(); 
            attackCommandInput.select();
        }
        if (event.key === 'Enter') {
            event.preventDefault(); 
            const rollButton = document.getElementById('rollButton');
            if (rollButton) {
                rollButton.click();
            }
        }
    });

    const physicalSlider = document.querySelector("#physicalSlider");
    physicalSlider.addEventListener("mouseup", () => {
        if (!isRolling) {
            diceBox = createDiceBox();
        }
    });
    physicalSlider.addEventListener("touchend", () => {
        if (!isRolling) {
            diceBox = createDiceBox();
        }
        else {
            diceBox.onRollComplete = () => {
                diceBox = createDiceBox();
            };
        }
    });

    attackCommandInput.addEventListener('input', function() {
        const { text, cursorPos } = textToEmojiGetCursor(attackCommandInput.value, attackCommandInput.selectionStart);
        attackCommandInput.value = text;
        attackCommandInput.setSelectionRange(cursorPos, cursorPos);
    });
}

function updateCommandsList() {
    const commandsList = document.getElementById('commandsList');
    commandsList.innerHTML = '';
    const commandsJSON = localStorage.getItem('commands');
    if (commandsJSON) {
        const commands = JSON.parse(commandsJSON);
        Object.entries(commands).forEach(([key, command]) => {
            const li = document.createElement('li');
            const spanKey = document.createElement('span');
            spanKey.textContent = `${key}:`;
            const spanCommand = document.createElement('span');
            spanCommand.textContent = ` ${textToEmoji(command)}`;
            spanCommand.classList.add('code-font');
            li.appendChild(spanKey);
            li.appendChild(spanCommand);
            commandsList.appendChild(li);
        });
    }
}

function parseDamageExpression(damageExpr) {
    const damageInstances = damageExpr.split('+').map(instance => instance.trim()).filter(instance => instance.length > 0);
    const components = [];

    for (let instance of damageInstances) {
        const regex = /^([+-]?)(\d+)(?:d(\d+))?([a-z]*)$/i;
        const match = instance.match(regex);
        if (!match) {
            console.error(`Invalid damage instance: "${instance}"`);
            return null;
        }

        let operator = match[1];
        if (operator === '') operator = '+'; 
        const number = parseInt(match[2], 10);
        const diceType = match[3] ? parseInt(match[3], 10) : null;
        const damageType = match[4] ? match[4].toLowerCase() : ''; 

        if (isNaN(number)) {
            console.error(`Invalid number in damage instance: "${match[2]}"`);
            return null;
        }

        if (match[3] && isNaN(diceType)) {
            console.error(`Invalid dice type in damage instance: "${match[3]}"`);
            return null;
        }

        components.push({
            operator,
            isDice: diceType !== null,
            count: diceType !== null ? number : null,
            diceType: diceType !== null ? diceType : null,
            value: diceType === null ? number : null,
            damageType
        });
    }

    return components;
}

function getThemeAndColor(damageType) {
    const mapping = {
        'ac': { theme: 'blue-green-metal' },            
        'co': { theme: 'smooth', themeColor: '#00ffff' },
        'fi': { theme: 'smooth', themeColor: '#ff4500' },
        'fo': { theme: 'smooth', themeColor: '#8b4513' },
        'li': { theme: 'rust', themeColor: '#ffff00' },
        'ne': { theme: 'smooth', themeColor: '#2f3f43' }, 
        'po': { theme: 'smooth', themeColor: '#008000' },
        'ps': { theme: 'smooth', themeColor: '#ee82ee' },
        'ra': { theme: 'smooth', themeColor: '#ffd700' },
        'th': { theme: 'smooth', themeColor: '#800080' },
        'bl': { theme: 'rock', themeColor: '#888888'},
        'pi': { theme: 'smooth', themeColor: '#c0c0c0' },
        'sl': { theme: 'smooth', themeColor: '#708090' },
        '':   { theme: 'smooth', themeColor: '#ffffff' },
    };
    const key = (damageType || '').substring(0, 2).toLowerCase();
    return mapping[key] || { theme: 'default', themeColor: '#ffffff' };
}

async function executeDiceRolls(diceList, physicalDiceRoll, diceBox, isHidden, wait = false) {

    if (!physicalDiceRoll) {
        diceList.forEach(attackDice => {
            attackDice.dice.forEach(dice => {
                const diceType = parseInt(dice.type.substring(1));
                const count = dice.count;
                const { total, rolls } = rollDice(count, diceType);
                dice.total = total;
            });
        });
    } else {
        if (wait) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const diceArray = [];
        const diceMapping = [];

        let groupIdCounter = 0;

        diceList.forEach((attackDice) => {
            attackDice.dice.forEach((dice) => {
                const diceType = parseInt(dice.type.substring(1));
                const count = dice.count;
                const diceObj = {
                    modifier: 0,
                    qty: count,
                    sides: diceType,
                };
                if (dice.damageType) {
                    const { theme, themeColor } = getThemeAndColor(dice.damageType);
                    diceObj.theme = theme;
                    diceObj.themeColor = themeColor;
                }
                diceArray.push(diceObj);
                diceMapping.push({ groupId: groupIdCounter, diceObj: dice });
                groupIdCounter++;
            });
        });

        try {
            const sampler = () => Math.round(99999 * Math.random());
            const seed = {a: sampler(), b: sampler(), c: sampler(), d: sampler()};
            const simSpeed = 20;
            popoverIds.push("myId-" + Math.round(Math.random()*1000000).toString());
            isCleared = false;
            if (!isHidden) {
                rollSharedDice(popoverIds[popoverIds.length - 1], 
                            {
                                width: document.getElementById("dice-canvas").width,
                                height: document.getElementById("dice-canvas").height
                            },
                            time_config(parseInt(document.querySelector("#physicalSlider").value)), 
                            diceArray, 
                            seed, 
                            simSpeed)
            }
            const results = await diceBox.roll(diceArray, {}, seed, simSpeed);
            const groupTotals = {};
            results.forEach((dieResult) => {
                const { groupId, value } = dieResult;
                if (!groupTotals[groupId]) {
                    groupTotals[groupId] = 0;
                }
                groupTotals[groupId] += value;
            });
            diceMapping.forEach((mapping) => {
                const { groupId, diceObj } = mapping;
                const total = groupTotals[groupId] || 0;
                diceObj.total = total;
            });
        } catch (error) {
            console.error("Error during dice roll:", error);
        }
    }

    return diceList;
}

async function performAttack(attackParams, diceBox, isPhysical, isHidden) {
    let attackRolls = [];
    let damageResults = [];
    let hpResult = null;
    let totalDamage = 0;

    let diceRolls = { attackDice: [], damageDice: [] };

    if (attackParams.hp !== null && attackParams.hp !== undefined) {
        hpResult = { old: attackParams.hp, new: attackParams.hp };
    }

    const res = attackParams.res || [];
    const vul = attackParams.vul || [];
    const imm = attackParams.imm || [];

    if (attackParams.damage_components === null || attackParams.damage_components === undefined) {
        damageResults = null;
    }

    const attack_bonus = attackParams.attack_bonus || [];

    let automaticHit = false;

    if (attackParams.num_attacks === null || attackParams.num_attacks === undefined) {
        attackParams.num_attacks = 1;
        automaticHit = true;
    } else if (attackParams.num_attacks <= 0) {
        attackParams.num_attacks = 0;
    }

    if (!automaticHit) {
        for (let i = 0; i < attackParams.num_attacks; i++) {
            let attackDice = { attackIndex: i, dice: [] };
            if (attackParams.modifier === 'a') {
                attackDice.dice.push({ type: 'd20', count: 1, description: `Attack ${i + 1} roll1`, damageType: attackParams.attack_color });
                attackDice.dice.push({ type: 'd20', count: 1, description: `Attack ${i + 1} roll2`, damageType: attackParams.attack_color });
            } else if (attackParams.modifier === 'd') {
                attackDice.dice.push({ type: 'd20', count: 1, description: `Attack ${i + 1} roll1`, damageType: attackParams.attack_color });
                attackDice.dice.push({ type: 'd20', count: 1, description: `Attack ${i + 1} roll2`, damageType: attackParams.attack_color });
            } else {
                attackDice.dice.push({ type: 'd20', count: 1, description: `Attack ${i + 1} roll`, damageType: attackParams.attack_color });
            }
            attack_bonus.forEach(bonus => {
                if (bonus.isDice) {
                    attackDice.dice.push({
                        type: `d${bonus.diceType}`,
                        count: bonus.count,
                        operator: bonus.operator,
                        description: `Attack ${i + 1} bonus`,
                        damageType: attackParams.attack_color
                    });
                }
            });

            diceRolls.attackDice.push(attackDice);
        }
    }
    if (!automaticHit && diceRolls.attackDice.length > 0) {

        if (!isHidden) {
            clearSharedDice(diceBox);
        }
        
        diceRolls.attackDice = await executeDiceRolls(diceRolls.attackDice, isPhysical, diceBox, isHidden);
    }

    for (let i = 0; i < attackParams.num_attacks; i++) {
        let hit = false;
        let isCrit = false;

        if (automaticHit) {
            // No attack roll is made
            hit = true;
            attackRolls = null; // Since no attack roll is made
            isCrit = false; // No critical hit possible
        } else {
            // Use the dice roll results from diceRolls.attackDice
            const attackDice = diceRolls.attackDice[i];
            let attack_roll = 0;
            let natural_20 = false;
            let roll1 = null;
            let roll2 = null;

            if (attackParams.modifier === 'a') { // Advantage
                roll1 = attackDice.dice[0].total;
                roll2 = attackDice.dice[1].total;
                attack_roll = Math.max(roll1, roll2);
                natural_20 = (roll1 === 20 || roll2 === 20);
            } else if (attackParams.modifier === 'd') { // Disadvantage
                roll1 = attackDice.dice[0].total;
                roll2 = attackDice.dice[1].total;
                attack_roll = Math.min(roll1, roll2);
                natural_20 = (roll1 === 20 && roll2 === 20);
            } else { // Normal
                roll1 = attackDice.dice[0].total;
                attack_roll = roll1;
                natural_20 = (roll1 === 20);
            }

            // Resolve attack bonuses
            let total_attack_bonus = 0;
            let bonusDiceIndex = (attackParams.modifier === 'a' || attackParams.modifier === 'd') ? 2 : 1; // Index where bonus dice start

            attack_bonus.forEach(bonus => {
                if (bonus.isDice) {
                    // Get the dice result from attackDice
                    const diceResult = attackDice.dice[bonusDiceIndex];
                    bonusDiceIndex++; // Move to next dice
                    const total = diceResult.total;
                    total_attack_bonus += (bonus.operator === '+' ? total : -total);
                } else {
                    // Apply numerical bonus
                    total_attack_bonus += (bonus.operator === '+' ? bonus.value : -bonus.value);
                }
            });

            const total_attack = attack_roll + total_attack_bonus;

            isCrit = natural_20;

            // Determine hit or miss
            if (attackParams.target_ac === null || attackParams.target_ac === undefined) {
                hit = true; // Attack hits automatically if target AC is null
            } else {
                hit = isCrit || (total_attack >= attackParams.target_ac);
            }

            // Format attack roll
            let attackStr;
            if (isCrit) {
                attackStr = `<span class="crit">${total_attack}</span>`;
            } else if (hit) {
                attackStr = `<span class="hit">${total_attack}</span>`;
            } else {
                attackStr = `${total_attack}`;
            }
            attackRolls.push(attackStr);
        }

        if (hit) {
            if (damageResults !== null) {
                // Collect damage dice rolls for this attack
                let damageDice = { attackIndex: i, dice: [], isCrit: isCrit, numericalComponents: [] };
                attackParams.damage_components.forEach(component => {
                    if (component.isDice) {
                        let count = component.count;
                        if (isCrit && !automaticHit) {
                            count *= 2; // Double the number of dice on a critical hit
                        }
                        damageDice.dice.push({
                            type: `d${component.diceType}`,
                            count: count,
                            operator: component.operator,
                            damageType: component.damageType,
                            description: `Damage for attack ${i + 1}`
                        });
                    } else {
                        // Numerical damage, store separately
                        let adjustedValue = component.operator === '+' ? component.value : -component.value;
                        damageDice.numericalComponents.push({
                            total: adjustedValue,
                            operator: component.operator,
                            damageType: component.damageType,
                            description: `Damage for attack ${i + 1} (numerical)`
                        });
                    }
                });
                diceRolls.damageDice.push(damageDice);
            }
        } else {
            if (damageResults !== null) {
                damageResults.push('m'); // 'm' signifies a miss
            }
        }
    }
    if (diceRolls.damageDice.some(attackRoll => attackRoll.dice.length > 0)) {
        diceRolls.damageDice = await executeDiceRolls(diceRolls.damageDice, isPhysical, diceBox, isHidden, true);
    }
    diceRolls.damageDice.forEach(damageDice => {
        let damageInstances = [];
        damageDice.dice.forEach(dice => {
            let adjustedValue = dice.total;
            if (dice.operator === '-') {
                adjustedValue = -adjustedValue;
            }
            if (adjustedValue < 0) {
                adjustedValue = 0;
            }

            let finalValue = adjustedValue;
            const damageType = dice.damageType;

            if (imm.includes(damageType)) {
                finalValue = 0;
            } else {
                if (res.includes(damageType)) {
                    finalValue = Math.floor(finalValue / 2);
                }
                if (vul.includes(damageType)) {
                    finalValue *= 2;
                }
            }

            totalDamage += finalValue;

            damageInstances.push({
                value: finalValue,
                damageType: damageType
            });
        });
        damageDice.numericalComponents.forEach(component => {
            let adjustedValue = component.total;
            if (component.operator === '-') {
                adjustedValue = -adjustedValue;
            }
            if (adjustedValue < 0) {
                adjustedValue = 0;
            }

            let finalValue = adjustedValue;
            const damageType = component.damageType;

            if (imm.includes(damageType)) {
                finalValue = 0;
            } else {
                if (res.includes(damageType)) {
                    finalValue = Math.floor(finalValue / 2);
                }
                if (vul.includes(damageType)) {
                    finalValue *= 2;
                }
            }

            totalDamage += finalValue;

            damageInstances.push({
                value: finalValue,
                damageType: damageType
            });
        });

        damageResults.push(damageInstances);
    });

    if (hpResult !== null) {
        hpResult.new = hpResult.old - totalDamage;
    }
    if (automaticHit || attackRolls.length === 0) {
        attackRolls = null;
    }
    return { attackRolls, damageResults, hpResult };
}

function parseInput(userInput) {
    const strippedInput = userInput.replace(/\s+/g, '').toLowerCase();

    const keywords = ['atk', 'vs', 'dmg', 'hp', 'res', 'vul', 'imm', 'save', 'load', 'delete'];
    const keywordPattern = /(atk|vs|dmg|hp|res|vul|imm|save|load|delete)/g;
    let match;
    const keywordMatches = [];
    while ((match = keywordPattern.exec(strippedInput)) !== null) {
        keywordMatches.push({ keyword: match[1], index: match.index });
    }
    keywordMatches.sort((a, b) => a.index - b.index);

    const components = [];
    let currentIndex = 0;

    for (let i = 0; i <= keywordMatches.length; i++) {
        let nextIndex = i < keywordMatches.length ? keywordMatches[i].index : strippedInput.length;
        let keyword = i < keywordMatches.length ? keywordMatches[i].keyword : null;

        if (currentIndex < nextIndex) {
            const text = strippedInput.slice(currentIndex, nextIndex);
            components.push({ keyword: null, text });
        }

        if (keyword) {
            const start = keywordMatches[i].index + keyword.length;
            let end = i + 1 < keywordMatches.length ? keywordMatches[i + 1].index : strippedInput.length;
            const text = strippedInput.slice(start, end);
            components.push({ keyword, text });
            currentIndex = end;
        } else {
            currentIndex = nextIndex;
        }
    }

    const cleanedComponents = components.filter(component => 
        component.keyword !== 'save' && component.keyword !== 'load' && component.keyword !== 'delete'
    );
    
    const cleanedUserInput = cleanedComponents
        .map(component => component.keyword ? component.keyword + ' ' + component.text : component.text)
        .join(' ');

    let num_attacks = null;
    let modifier = null;
    let attack_bonus = null;
    let attack_color = '';
    let base_target_ac = null;
    let ac_modifier = 0;
    let target_ac = null;
    let damage_components = null;
    let hp = null;
    let res = [];
    let vul = [];
    let imm = [];
    let save_content = null;
    let load_content = null;
    let delete_content = null;

    let attackRollDetected = false;
    let targetACDetected = false;
    let damageDetected = false;
    let hpDetected = false;
    let resDetected = false;
    let vulDetected = false;
    let immDetected = false;

    const unassignedComponents = [];

    function parseAttackRoll(text) {
        const attackRollPattern = /^(\d+)([nad])([a-z]*)([+-](?:\d+d\d+|\d+)(?:[+-](?:\d+d\d+|\d+))*)?$/i;

        const match = text.match(attackRollPattern);
        if (!match) {
            return null;
        }

        const num_attacks = parseInt(match[1], 10);
        const modifier = match[2].toLowerCase();
        const attack_color = match[3] || '';
        const attack_bonus_str = match[4] || '';

        const attack_bonus = [];
        if (attack_bonus_str) {
            const bonusPattern = /([+-])(?:\s*)(\d+d\d+|\d+)/gi;
            let bonusMatch;
            while ((bonusMatch = bonusPattern.exec(attack_bonus_str)) !== null) {
                const operator = bonusMatch[1];
                const value = bonusMatch[2];
                if (/^\d+d\d+$/i.test(value)) {
                    const [count, diceType] = value.toLowerCase().split('d').map(Number);
                    if (isNaN(count) || isNaN(diceType)) {
                        console.error(`Invalid dice notation in attack bonus: ${value}`);
                        return null;
                    }
                    attack_bonus.push({
                        operator,
                        isDice: true,
                        count,
                        diceType,
                    });
                } else {
                    const number = parseInt(value, 10);
                    if (isNaN(number)) {
                        console.error(`Invalid numerical value in attack bonus: ${value}`);
                        return null;
                    }
                    attack_bonus.push({
                        operator,
                        isDice: false,
                        value: number,
                    });
                }
            }
        }

        return {
            num_attacks,
            modifier,
            attack_bonus,
            attack_color,
        };
    }

    function parseTargetAC(text) {
        const targetACPattern = /^(\d+)((?:[+-]\d+)*)$/;
        const match = text.match(targetACPattern);
        if (!match) {
            return null;
        }
        const base_target_ac = parseInt(match[1], 10);
        const ac_modifiers_str = match[2];

        let ac_modifier = 0;
        if (ac_modifiers_str) {
            const acModifierPattern = /([+-]\d+)/g;
            const acMatches = ac_modifiers_str.match(acModifierPattern);
            if (acMatches) {
                for (const mod of acMatches) {
                    ac_modifier += parseInt(mod, 10);
                }
            }
        }
        const target_ac = base_target_ac + ac_modifier;

        return {
            base_target_ac,
            ac_modifier,
            target_ac,
        };
    }

    function parseHP(text) {
        const hpPattern = /^(\d+)$/;
        const match = text.match(hpPattern);
        if (!match) {
            return null;
        }
        return parseInt(match[1], 10);
    }

    function parseDamageTypeList(text) {
        const damageTypePattern = /^([a-z]+)(\+[a-z]+)*$/i;
        if (!damageTypePattern.test(text)) {
            return null;
        }
        return text.split('+');
    }

    function isAttackRoll(text) {
        const attackRollPattern = /^(\d+)([nad])([a-z]*)([+-](?:\d+d\d+|\d+)(?:[+-](?:\d+d\d+|\d+))*)?$/i;
        return attackRollPattern.test(text);
    }

    function isDamageExpression(text) {
        const damageExpressionPattern = /^([+-]?)(\d+d\d+|\d+)([a-z]*)/i;
        return damageExpressionPattern.test(text);
    }

    function isHP(text) {
        const hpPattern = /^\d+$/;
        return hpPattern.test(text);
    }

    function isDamageTypeList(text) {
        const damageTypePattern = /^([a-z]+)(\+[a-z]+)*$/i;
        return damageTypePattern.test(text);
    }

    for (const component of components) {
        const { keyword, text } = component;
        if (keyword === 'atk') {
            if (attackRollDetected) {
                console.error(`Multiple attack rolls detected.`);
                return null;
            }
            attackRollDetected = true;

            const result = parseAttackRoll(text);
            if (result) {
                num_attacks = result.num_attacks;
                modifier = result.modifier;
                attack_bonus = result.attack_bonus;
                attack_color = result.attack_color;
            } else {
                console.error(`Failed to parse attack roll: "${text}"`);
                return null;
            }
        } else if (keyword === 'vs') {
            if (targetACDetected) {
                console.error(`Multiple target ACs detected.`);
                return null;
            }
            targetACDetected = true;

            const result = parseTargetAC(text);
            if (result) {
                base_target_ac = result.base_target_ac;
                ac_modifier = result.ac_modifier;
                target_ac = result.target_ac;
            } else {
                console.error(`Failed to parse target AC: "${text}"`);
                return null;
            }
        } else if (keyword === 'dmg') {
            if (damageDetected) {
                console.error(`Multiple damage expressions detected.`);
                return null;
            }
            damageDetected = true;

            damage_components = parseDamageExpression(text);
            if (!damage_components) {
                console.error(`Failed to parse damage expression: "${text}"`);
                return null;
            }
        } else if (keyword === 'hp') {
            if (hpDetected) {
                console.error(`Multiple HP values detected.`);
                return null;
            }
            hpDetected = true;

            const result = parseHP(text);
            if (result !== null) {
                hp = result;
            } else {
                console.error(`Failed to parse HP: "${text}"`);
                return null;
            }
        } else if (keyword === 'res') {
            if (resDetected) {
                console.error(`Multiple resistance values detected.`);
                return null;
            }
            resDetected = true;

            const result = parseDamageTypeList(text);
            if (result) {
                res = result;
            } else {
                console.error(`Failed to parse resistances: "${text}"`);
                return null;
            }
        } else if (keyword === 'vul') {
            if (vulDetected) {
                console.error(`Multiple vulnerability values detected.`);
                return null;
            }
            vulDetected = true;

            const result = parseDamageTypeList(text);
            if (result) {
                vul = result;
            } else {
                console.error(`Failed to parse vulnerabilities: "${text}"`);
                return null;
            }
        } else if (keyword === 'imm') {
            if (immDetected) {
                console.error(`Multiple immunity values detected.`);
                return null;
            }
            immDetected = true;

            const result = parseDamageTypeList(text);
            if (result) {
                imm = result;
            } else {
                console.error(`Failed to parse immunities: "${text}"`);
                return null;
            }
        } else if (keyword === 'save') {
            save_content = text;
        } else if (keyword === 'load') {
            load_content = text;
        } else if (keyword === 'delete') {
            delete_content = text;
        } else {
            const possibleTypes = [];
            const parsedResults = {};

            if (!attackRollDetected && isAttackRoll(text)) {
                possibleTypes.push('attack');
                parsedResults['attack'] = parseAttackRoll(text);
            }

            if (!damageDetected && isDamageExpression(text)) {
                possibleTypes.push('damage');
                parsedResults['damage'] = parseDamageExpression(text);
            }

            if (!targetACDetected) {
                const targetACResult = parseTargetAC(text);
                if (targetACResult) {
                    possibleTypes.push('target_ac');
                    parsedResults['target_ac'] = targetACResult;
                }
            }

            if (!hpDetected && isHP(text)) {
                possibleTypes.push('hp');
                parsedResults['hp'] = parseHP(text);
            }

            if (isDamageTypeList(text)) {
                if (!resDetected) {
                    possibleTypes.push('res');
                    parsedResults['res'] = parseDamageTypeList(text);
                }
                if (!vulDetected) {
                    possibleTypes.push('vul');
                    parsedResults['vul'] = parseDamageTypeList(text);
                }
                if (!immDetected) {
                    possibleTypes.push('imm');
                    parsedResults['imm'] = parseDamageTypeList(text);
                }
            }

            if (possibleTypes.length === 1) {
                const type = possibleTypes[0];
                if (type === 'attack') {
                    num_attacks = parsedResults['attack'].num_attacks;
                    modifier = parsedResults['attack'].modifier;
                    attack_bonus = parsedResults['attack'].attack_bonus;
                    attack_color = parsedResults['attack'].attack_color;
                    attackRollDetected = true;
                } else if (type === 'damage') {
                    damage_components = parsedResults['damage'];
                    damageDetected = true;
                } else if (type === 'target_ac') {
                    base_target_ac = parsedResults['target_ac'].base_target_ac;
                    ac_modifier = parsedResults['target_ac'].ac_modifier;
                    target_ac = parsedResults['target_ac'].target_ac;
                    targetACDetected = true;
                } else if (type === 'hp') {
                    hp = parsedResults['hp'];
                    hpDetected = true;
                } else if (type === 'res') {
                    res = parsedResults['res'];
                    resDetected = true;
                } else if (type === 'vul') {
                    vul = parsedResults['vul'];
                    vulDetected = true;
                } else if (type === 'imm') {
                    imm = parsedResults['imm'];
                    immDetected = true;
                }
            } else {
                unassignedComponents.push({
                    text,
                    possibleTypes,
                    parsedResults,
                });
            }
        }
    }

    for (const component of unassignedComponents) {
        const { text, possibleTypes, parsedResults } = component;

        const remainingTypes = [];
        if (!attackRollDetected && possibleTypes.includes('attack')) remainingTypes.push('attack');
        if (!targetACDetected && possibleTypes.includes('target_ac')) remainingTypes.push('target_ac');
        if (!damageDetected && possibleTypes.includes('damage')) remainingTypes.push('damage');
        if (!hpDetected && possibleTypes.includes('hp')) remainingTypes.push('hp');
        if (!resDetected && possibleTypes.includes('res')) remainingTypes.push('res');
        if (!vulDetected && possibleTypes.includes('vul')) remainingTypes.push('vul');
        if (!immDetected && possibleTypes.includes('imm')) remainingTypes.push('imm');

        if (remainingTypes.length >= 1) {
            const priority = ['attack', 'target_ac', 'damage', 'hp', 'res', 'vul', 'imm'];
            const type = priority.find(t => remainingTypes.includes(t));
            if (type === 'attack') {
                num_attacks = parsedResults['attack'].num_attacks;
                modifier = parsedResults['attack'].modifier;
                attack_bonus = parsedResults['attack'].attack_bonus;
                attack_color = parsedResults['attack'].attack_color;
                attackRollDetected = true;
            } else if (type === 'target_ac') {
                base_target_ac = parsedResults['target_ac'].base_target_ac;
                ac_modifier = parsedResults['target_ac'].ac_modifier;
                target_ac = parsedResults['target_ac'].target_ac;
                targetACDetected = true;
            } else if (type === 'damage') {
                damage_components = parsedResults['damage'];
                damageDetected = true;
            } else if (type === 'hp') {
                hp = parsedResults['hp'];
                hpDetected = true;
            } else if (type === 'res') {
                res = parsedResults['res'];
                resDetected = true;
            } else if (type === 'vul') {
                vul = parsedResults['vul'];
                vulDetected = true;
            } else if (type === 'imm') {
                imm = parsedResults['imm'];
                immDetected = true;
            }
        } else {
            console.error(`Unable to determine the component type of: "${text}"`);
            return null;
        }
    }

    if (num_attacks !== null && (num_attacks < 1 || !Number.isInteger(num_attacks))) {
        console.error(`Invalid number of attacks: ${num_attacks}`);
        return null;
    }

    if (num_attacks !== null && !['n', 'a', 'd'].includes(modifier)) {
        console.error(`Invalid attack modifier: ${modifier}`);
        return null;
    }

    return {'attackParams': {
        num_attacks,
        modifier,
        attack_bonus,
        attack_color,
        base_target_ac,
        ac_modifier,
        target_ac,
        damage_components,
        hp,
        res,
        vul,
        imm,
        save_content,
        load_content,
        delete_content
    }, 'cleanedUserInput': cleanedUserInput};
}

function getDamageColor(damage) {
    if (damage === 'm') return 'damage-miss';
    if (damage >= 6 && damage <= 15) return 'damage-yellow';
    if (damage >= 16 && damage <= 25) return 'damage-red';
    if (damage >= 26 && damage <= 40) return 'damage-purple';
    if (damage >= 41 && damage <= 60) return 'damage-cyan';
    if (damage >= 61) return 'damage-neon-green';
    return 'damage-default';
}

function getTotalDamageColor(total) {
    if (total >= 6 && total <= 15) return 'damage-yellow';
    if (total >= 16 && total <= 25) return 'damage-red';
    if (total >= 26 && total <= 40) return 'damage-purple';
    if (total >= 41 && total <= 60) return 'damage-cyan';
    if (total >= 61) return 'damage-neon-green';
    return 'damage-default';
}

const damageTypeEmojis = {
    "ac": "🧪",
    "bl": "🔨",
    "co": "❄️",
    "fi": "🔥",
    "fo": "💥",
    "li": "⚡",
    "ne": "💀",
    "pi": "🗡️",
    "po": "☠️",
    "ps": "🧠",
    "ra": "🌟",
    "sl": "⚔️",
    "th": "🌩️" 
};

function textToEmoji(text) {
    const stopKeywords = ['save', 'load', 'delete'];
    const resumeKeywords = ['atk', 'vs', 'dmg', 'hp', 'res', 'vul', 'imm'];
    const entries = Object.entries(damageTypeEmojis);
    let result = '';
    let state = 'replace';
    let i = 0;
    while (i < text.length) {
        if (state === 'replace') {
            const stop = stopKeywords.find(kw => text.startsWith(kw, i));
            if (stop) {
                result += stop;
                i += stop.length;
                state = 'no-replace';
                continue;
            }
            let replaced = false;
            for (const [prefix, emoji] of entries) {
                if (text.startsWith(prefix, i)) {
                    result += emoji;
                    i += prefix.length;
                    replaced = true;
                    break;
                }
            }
            if (replaced) continue;
            result += text[i++];
        } else {
            const resume = resumeKeywords.find(kw => text.startsWith(kw, i));
            if (resume) {
                result += resume;
                i += resume.length;
                state = 'replace';
                continue;
            }
            result += text[i++];
        }
    }
    return result;
}

function textToEmojiGetCursor(text, cursorPos) {
    const stopKeywords = ['save', 'load', 'delete'];
    const resumeKeywords = ['atk', 'vs', 'dmg', 'hp', 'res', 'vul', 'imm'];
    const entries = Object.entries(damageTypeEmojis);
    let result = '';
    let diff = 0;
    let state = 'replace';
    let i = 0;
    while (i < text.length) {
        if (state === 'replace') {
            const stop = stopKeywords.find(kw => text.startsWith(kw, i));
            if (stop) {
                result += stop;
                i += stop.length;
                state = 'no-replace';
                continue;
            }
            let replaced = false;
            for (const [prefix, emoji] of entries) {
                if (text.startsWith(prefix, i)) {
                    result += emoji;
                    if (i < cursorPos) diff += emoji.length - prefix.length;
                    i += prefix.length;
                    replaced = true;
                    break;
                }
            }
            if (replaced) continue;
            result += text[i++];
        } else {
            const resume = resumeKeywords.find(kw => text.startsWith(kw, i));
            if (resume) {
                result += resume;
                i += resume.length;
                state = 'replace';
                continue;
            }
            result += text[i++];
        }
    }
    return { text: result, cursorPos: cursorPos + diff };
}

function emojiToText(text) {
    const emojiToPrefix = {};
    for (const [prefix, emoji] of Object.entries(damageTypeEmojis)) {
        emojiToPrefix[emoji] = prefix;
    }
    for (const [emoji, prefix] of Object.entries(emojiToPrefix)) {
        text = text.split(emoji).join(prefix);
    }
    return text;
}