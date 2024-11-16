// diceRoller.js
import OBR from "@owlbear-rodeo/sdk";

import DiceBox from "@3d-dice/dice-box";

let cachedUserId = null;

let isRolling = false;

let speed = 1;

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
    // Create a card container
    const card = document.createElement('div');
    card.classList.add('card'); // Card class for styling

    // Create the entry container for history data
    const entry = document.createElement('div');
    entry.classList.add('history-entry');

    // 1. Command
    if (command !== null) {
        // Create the command display
        const commandDiv = document.createElement('div');
        commandDiv.innerText = command;
        commandDiv.classList.add('code-font'); // Apply code font to command display
        entry.appendChild(commandDiv);
    }

    // 2. Attack Rolls
    if (attackRolls !== null) {
        // Create attack roll display
        const attackDiv = document.createElement('div');
        attackDiv.innerHTML = attackRolls.join(', ');
        entry.appendChild(attackDiv);
    }

    // 3. Damage Results
    if (damageResults !== null) {
        // Create damage display
        const damageDiv = document.createElement('div');

        // Process damage results
        const damageExpressionParts = damageResults.map(result => {
            if (result === 'm') {
                return `<span class="damage-miss">m</span>`;
            }

            // Group damage by type and sum them
            const damageByType = {};
            result.forEach(d => {
                const type = d.damageType || 'untyped';
                damageByType[type] = (damageByType[type] || 0) + d.value;
            });

            // Convert damageByType to array and sort by descending damage
            const sortedDamage = Object.entries(damageByType)
                .map(([type, value]) => ({ type, value }))
                .sort((a, b) => b.value - a.value);

            // Create damage strings
            const damageStrings = sortedDamage.map(d => {
                const colorClass = getDamageColor(d.value);
                return `<span class="${colorClass}">${d.value}${d.type !== 'untyped' ? `<span class="damage-type">${d.type}</span>` : ''}</span>`;
            }).join(' + ');

            // Determine if square brackets are needed
            return sortedDamage.length > 1 ? `[${damageStrings}]` : damageStrings;
        });

        // Calculate total damage per type across all attacks
        const totalDamageByType = {};
        damageResults.forEach(result => {
            if (result === 'm') return; // Skip misses
            result.forEach(d => {
                const type = d.damageType || 'untyped';
                totalDamageByType[type] = (totalDamageByType[type] || 0) + d.value;
            });
        });

        // Convert totalDamageByType to array and sort by descending damage
        const sortedTotalDamage = Object.entries(totalDamageByType)
            .map(([type, value]) => ({ type, value }))
            .sort((a, b) => b.value - a.value);

        // Create total damage strings with color coding for both numbers and types
        const sortedTotalDamageStrings = sortedTotalDamage.map(d => {
            const colorClass = getDamageColor(d.value);
            return `<span class="${colorClass}">${d.value}${d.type !== 'untyped' ? `<span class="damage-type">${d.type}</span>` : ''}</span>`;
        }).join(' + ');

        // Calculate overall total damage
        const overallTotalDamage = sortedTotalDamage.reduce((acc, d) => acc + d.value, 0);

        // Adjust display based on the number of attack rolls
        if (damageExpressionParts.length === 1) {
            // Only one attack roll, display damage without '=' and total
            damageDiv.innerHTML = damageExpressionParts[0];
        } else if (sortedTotalDamage.length > 1) {
            // Multiple damage types
            const formattedTotalDamage = `${sortedTotalDamageStrings} = <span class="${getTotalDamageColor(overallTotalDamage)}">${overallTotalDamage}</span>`;
            // Combine individual damage expressions and total damage
            const formattedDamageDisplay = `${damageExpressionParts.join(' + ')} = ${formattedTotalDamage}`;
            damageDiv.innerHTML = formattedDamageDisplay;
        } else if (sortedTotalDamage.length === 1) {
            // Only one damage type, include the type in the overall total
            const totalType = sortedTotalDamage[0].type !== 'untyped' ? sortedTotalDamage[0].type : '';
            const formattedTotalDamage = `<span class="${getTotalDamageColor(overallTotalDamage)}">${overallTotalDamage}${totalType !== 'untyped' ? `<span class="damage-type">${totalType}</span>` : ''}</span>`;
            // Display the damage expressions and total
            damageDiv.innerHTML = `${damageExpressionParts.join(' + ')} = ${formattedTotalDamage}`;
        } else {
            // No damage dealt
            damageDiv.innerHTML = `${damageExpressionParts.join(' + ')}`;
        }

        entry.appendChild(damageDiv);
    }

    // 4. HP Result
    if (hpResult !== null) {
        // Create hp display
        const hpDiv = document.createElement('div');
        hpDiv.style.color = 'white';
        hpDiv.style.fontWeight = 'bold';
        hpDiv.innerText = `${hpResult.old} → ${hpResult.new}`;
        entry.appendChild(hpDiv);
    }

    // Append entry to the card container
    card.appendChild(entry);

    // Onclick handler
    card.onclick = function() {
        if (command !== null) {
            const inputField = document.getElementById('attackCommand');
            if (inputField) {
                inputField.value = command;
            }
        }
    };

    return card;
}


function time_config(t) {
    const originalConfig = {
        gravity: 1.6,
        mass: 1,
        friction: 0.5,
        restitution: 0.3,
        angularDamping: 0.3,
        linearDamping: 0.3,
        spinForce: 6,
        throwForce: 6,
        startingHeight: 10,
        settleTimeout: 4000,
        delay: 10,
        scale: 7,
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
        diceCanvas.remove(); // Removes the element from the DOM
    }

    var diceBox = new DiceBox(time_config(0.35 + parseInt(document.querySelector("#physicalSlider").value) / 100 * (1.65 - 0.35)));

    const canvas = document.getElementById('dice-canvas');
    canvas.style.pointerEvents = "none";
    canvas.style.position = 'absolute';
    canvas.style.top = '0'; // Align to the top
    canvas.style.left = '0'; // Align to the left
    canvas.style.width = '100%'; // Full width
    canvas.style.height = '100%'; // Full height
    canvas.style.zIndex = '10'; // Keep it above other elements

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
                diceBox.clear()
            }
        };
        console.log('DiceBox initialized');
            diceBox.onRollComplete = (result) => {
            isRolling = false
        };
        diceBox.onBeforeRoll = (result) => {
            isRolling = true
        };
    });

    return diceBox
}

// diceRoller.js
export function setupDiceRoller(userId) {
    var diceBox = createDiceBox();

    const attackCommandInput = document.getElementById('attackCommand');

    const examples = [
        '5a+4 vs {ac} dmg {count}d6fi+{bonus}bl+1d4',
        '4d+3 vs {ac} dmg {count}d8+{bonus}ne+2d4ac',
        '3a+2 vs {ac} dmg {count}d6co+{bonus}+1d6pi+5'
    ];
    
    // Generate random values for AC and bonus
    const randomAC = Math.floor(Math.random() * 4) + 10; // Random AC between 10 and 13
    const randomBonus = Math.floor(Math.random() * 5) + 1; // Random bonus between 1 and 5
    const randomCount = Math.floor(Math.random() * 3) + 1; // Random count between 1 and 3

    // Pick a random example and replace placeholders
    const randomExample = examples[Math.floor(Math.random() * examples.length)]
        .replace('{ac}', randomAC)
        .replace('{bonus}', randomBonus)
        .replace('{count}', randomCount);

    attackCommandInput.value = randomExample;
    const historyContainer = document.getElementById('history');
    const rollButton = document.getElementById('rollButton');

    // Get references to the new checkboxes
    const hiddenCheckbox = document.getElementById('hiddenRoll');
    const physicalCheckbox = document.getElementById('physicalRoll');

    rollButton.addEventListener('click', async () => {
        const userInput = attackCommandInput.value.trim();
        const attackParams = parseInput(userInput);
        if (!attackParams) {
            alert('Invalid input format. Please try again.');
            return;
        }
        
        // Retrieve the states of the checkboxes
        const isHidden = hiddenCheckbox.checked;
        const isPhysical = physicalCheckbox.checked;

        // You can now use these booleans as needed

        const { attackRolls, damageResults, hpResult } = await performAttack(attackParams, diceBox, isPhysical);
        const historyEntry = createHistoryEntry(userInput, attackRolls, damageResults, hpResult);
        historyContainer.prepend(historyEntry);
        if (historyContainer.children.length >= 20) {
            historyContainer.removeChild(historyContainer.lastChild); // Remove the oldest entry
        }
        if (!isHidden) {
            OBR.broadcast.sendMessage("rodeo.owlbear.diceResults", {
                'command': userInput, 
                'attackRolls': attackRolls, 
                'damageResults': damageResults,
                'hpResult': hpResult,
                'isHidden': isHidden,
                'isPhysical': isPhysical
            }).catch(error => {
                console.error("Failed to send broadcast message:", error);
            });
        }
    });

    OBR.broadcast.onMessage("rodeo.owlbear.diceResults", (event) => {
        const { command, attackRolls, damageResults, hpResult, isHidden, isPhysical } = event.data;

        const historyContainer = document.getElementById('history');
        const historyEntry = createHistoryEntry(command, attackRolls, damageResults, hpResult, { isHidden, isPhysical });
        historyContainer.prepend(historyEntry);
        if (historyContainer.children.length >= 20) {
            historyContainer.removeChild(historyContainer.lastChild); // Remove the oldest entry
        }
    });

    attackCommandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            rollButton.click();
        }
    });

    document.addEventListener('keydown', (event) => {
        // For both Windows/Linux (Ctrl) and macOS (Cmd), trigger on Ctrl + H or Cmd + H
        if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
            event.preventDefault(); // Prevent the default action
            const hiddenRollCheckbox = document.getElementById('hiddenRoll');
            hiddenRollCheckbox.checked = !hiddenRollCheckbox.checked; // Toggle checkbox
        }
      
        // For both Windows/Linux (Ctrl) and macOS (Cmd), trigger on Ctrl + P or Cmd + P
        if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
            event.preventDefault(); // Prevent the default action
            const physicalRollCheckbox = document.getElementById('physicalRoll');
            physicalRollCheckbox.checked = !physicalRollCheckbox.checked; // Toggle checkbox
        }

        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            event.preventDefault(); // Prevent the default action
            if (!isRolling) {
                diceBox.clear();
            }
        }

        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default action (form submission, etc.)
            const rollButton = document.getElementById('rollButton');
            if (rollButton) {
                rollButton.click(); // Trigger roll button click
            }
        }
    });

    const physicalSlider = document.querySelector("#physicalSlider");
    physicalSlider.addEventListener("mouseup", () => {
        if (!isRolling) {
            diceBox = createDiceBox();
        }
        else {
            diceBox.onRollComplete = () => {
                diceBox = createDiceBox();
            };
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
}

// *** Revised Function: Parse the damage expression into individual damage instances ***
function parseDamageExpression(damageExpr) {
    // Split the damage expression by '+' while keeping track of '-' operators
    const damageInstances = damageExpr.split('+').map(instance => instance.trim()).filter(instance => instance.length > 0);
    const components = [];

    for (let instance of damageInstances) {
        // Match patterns like "1d6fi", "3", "2d8ne", "1d4co", "2pi", "1d6", "1d12fi"
        const regex = /^([+-]?)(\d+)(?:d(\d+))?([a-z]*)$/i;
        const match = instance.match(regex);
        if (!match) {
            console.error(`Invalid damage instance: "${instance}"`);
            return null;
        }

        let operator = match[1];
        if (operator === '') operator = '+'; // Default operator is '+'
        const number = parseInt(match[2], 10);
        const diceType = match[3] ? parseInt(match[3], 10) : null;
        const damageType = match[4] ? match[4].toLowerCase() : ''; // Default to empty string if no type

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



// Helper function to map damage types to themes and colors
function getThemeAndColor(damageType) {
    const mapping = {
        'ac': { theme: 'blue-green-metal' },            // Acid
        'co': { theme: 'smooth', themeColor: '#00ffff' },// Cold
        'fi': { theme: 'smooth', themeColor: '#ff4500' },// Fire
        'fo': { theme: 'smooth', themeColor: '#8b4513' },// Force
        'li': { theme: 'smooth', themeColor: '#ffff00' },// Lightning
        'ne': { theme: 'smooth', themeColor: '#2f3f43' }, // Necrotic
        'po': { theme: 'smooth', themeColor: '#008000' },// Poison
        'ps': { theme: 'smooth', themeColor: '#ee82ee' },// Psychic
        'ra': { theme: 'smooth', themeColor: '#ffd700' },// Radiant
        'th': { theme: 'smooth', themeColor: '#800080' },// Thunder
        'bl': { theme: 'rock', themeColor: '#888888'},           // Bludgeoning
        'pi': { theme: 'smooth', themeColor: '#c0c0c0' },// Piercing
        'sl': { theme: 'smooth', themeColor: '#708090' },// Slashing
        '':   { theme: 'smooth', themeColor: '#ffffff' },// Neutral
    };
    return mapping[damageType] || { theme: 'default', themeColor: '#ffffff' };
}


// Updated executeDiceRolls function
async function executeDiceRolls(diceList, physicalDiceRoll, diceBox) {
    if (!physicalDiceRoll) {
        diceList.forEach(attackDice => {
            attackDice.dice.forEach(dice => {
                const diceType = parseInt(dice.type.substring(1)); // Remove 'd' from 'd20', etc.
                const count = dice.count;
                const { total, rolls } = rollDice(count, diceType);
                dice.total = total;
            });
        });
    } else {
        const diceArray = [];
        const diceMapping = [];

        diceList.forEach(diceGroup => {
            diceGroup.dice.forEach(dice => {
                const diceType = parseInt(dice.type.substring(1)); // e.g., 'd6' -> 6
                const count = dice.count;

                // Prepare the base dice object
                const diceObj = {
                    modifier: 0, // Assuming no modifier here; adjust if necessary
                    qty: count,
                    sides: diceType,
                };

                // Get theme and color based on damageType, if it exists
                if (dice.damageType) {
                    const { theme, themeColor } = getThemeAndColor(dice.damageType);
                    diceObj.theme = theme;
                    diceObj.themeColor = themeColor;
                }

                diceArray.push(diceObj);
                diceMapping.push({ diceObj: dice });
            });
        });

        // Await the dice roll
        const results = await diceBox.roll(diceArray);

        // Map results back to diceRolls
        diceMapping.forEach((mapping, index) => {
            const { diceObj } = mapping;
            const result = results[index];

            // Assign total value from the result
            diceObj.total = result.value;
        });
    }
    return diceList;
}



async function performAttack(attackParams, diceBox, isPhysical) {
    let attackRolls = [];
    let damageResults = [];
    let hpResult = null;
    let totalDamage = 0;

    let diceRolls = { attackDice: [], damageDice: [] };
    let physicalDiceRoll = false; // Assuming physicalDiceRoll is false for now

    // Initialize hpResult if hp is provided
    if (attackParams.hp !== null && attackParams.hp !== undefined) {
        hpResult = { old: attackParams.hp, new: attackParams.hp };
    }

    // Set default values for res, vul, imm
    const res = attackParams.res || [];
    const vul = attackParams.vul || [];
    const imm = attackParams.imm || [];

    // Handle null or undefined damage_components
    if (attackParams.damage_components === null || attackParams.damage_components === undefined) {
        damageResults = null;
    }

    // Set default for attack_bonus
    const attack_bonus = attackParams.attack_bonus || [];

    // Introduce automaticHit flag
    let automaticHit = false;

    // Determine the number of attacks
    if (attackParams.num_attacks === null || attackParams.num_attacks === undefined) {
        // No attack roll is made, but damage is rolled if damage_components is given
        attackParams.num_attacks = 1; // Treat as 1 automatic hit
        automaticHit = true;
    } else if (attackParams.num_attacks <= 0) {
        attackParams.num_attacks = 0; // No attacks are made
    }

    // Collect all dice rolls for attacks
    if (!automaticHit) {
        for (let i = 0; i < attackParams.num_attacks; i++) {
            // Collect dice rolls for attack
            let attackDice = { attackIndex: i, dice: [] };
            if (attackParams.modifier === 'a') { // Advantage
                // Roll two d20s
                attackDice.dice.push({ type: 'd20', count: 1, description: `Attack ${i + 1} roll1`, damageType: attackParams.attack_color });
                attackDice.dice.push({ type: 'd20', count: 1, description: `Attack ${i + 1} roll2`, damageType: attackParams.attack_color });
            } else if (attackParams.modifier === 'd') { // Disadvantage
                // Roll two d20s
                attackDice.dice.push({ type: 'd20', count: 1, description: `Attack ${i + 1} roll1`, damageType: attackParams.attack_color });
                attackDice.dice.push({ type: 'd20', count: 1, description: `Attack ${i + 1} roll2`, damageType: attackParams.attack_color });
            } else { // Normal
                // Roll one d20
                attackDice.dice.push({ type: 'd20', count: 1, description: `Attack ${i + 1} roll`, damageType: attackParams.attack_color });
            }

            // Collect dice rolls from attack_bonus
            attack_bonus.forEach(bonus => {
                if (bonus.isDice) {
                    // Add the dice to attackDice
                    attackDice.dice.push({
                        type: `d${bonus.diceType}`,
                        count: bonus.count,
                        operator: bonus.operator,
                        description: `Attack ${i + 1} bonus`,
                        damageType: attackParams.attack_color
                    });
                }
                // Numerical bonuses don't require dice rolls
            });

            diceRolls.attackDice.push(attackDice);
        }
    }

    // Roll all the dice for attacks if physicalDiceRoll is false
    if (!automaticHit && diceRolls.attackDice.length > 0) {
        diceRolls.attackDice = await executeDiceRolls(diceRolls.attackDice, isPhysical, diceBox);
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

    // Roll all the dice for damage if physicalDiceRoll is false
    if (diceRolls.damageDice.length > 0) {
        diceRolls.damageDice = await executeDiceRolls(diceRolls.damageDice, isPhysical, diceBox);
    }

    // Process damage results
    diceRolls.damageDice.forEach(damageDice => {
        let damageInstances = [];

        // Process dice-based damage components
        damageDice.dice.forEach(dice => {
            let adjustedValue = dice.total;
            if (dice.operator === '-') {
                adjustedValue = -adjustedValue;
            }

            // Ensure damage is not negative
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

        // Process numerical damage components
        damageDice.numericalComponents.forEach(component => {
            let adjustedValue = component.total;
            if (component.operator === '-') {
                adjustedValue = -adjustedValue;
            }

            // Ensure damage is not negative
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

    // If no attack rolls were made, set attackRolls to null
    if (automaticHit || attackRolls.length === 0) {
        attackRolls = null;
    }

    return { attackRolls, damageResults, hpResult };
}




function parseInput(userInput) {
    // Strip all spaces and convert to lowercase
    const strippedInput = userInput.replace(/\s+/g, '').toLowerCase();

    // Define keywords and their positions
    const keywords = ['atk', 'vs', 'dmg', 'hp', 'res', 'vul', 'imm'];
    const keywordPattern = /(atk|vs|dmg|hp|res|vul|imm)/g;
    let match;
    const keywordMatches = [];
    while ((match = keywordPattern.exec(strippedInput)) !== null) {
        keywordMatches.push({ keyword: match[1], index: match.index });
    }

    // Sort keyword matches by their index in the input
    keywordMatches.sort((a, b) => a.index - b.index);

    // Initialize components array
    const components = [];
    let currentIndex = 0;

    for (let i = 0; i <= keywordMatches.length; i++) {
        let nextIndex = i < keywordMatches.length ? keywordMatches[i].index : strippedInput.length;
        let keyword = i < keywordMatches.length ? keywordMatches[i].keyword : null;

        if (currentIndex < nextIndex) {
            // Text between currentIndex and nextIndex without a keyword
            const text = strippedInput.slice(currentIndex, nextIndex);
            components.push({ keyword: null, text });
        }

        if (keyword) {
            // Extract text for this keyword
            const start = keywordMatches[i].index + keyword.length;
            let end = i + 1 < keywordMatches.length ? keywordMatches[i + 1].index : strippedInput.length;
            const text = strippedInput.slice(start, end);
            components.push({ keyword, text });
            currentIndex = end;
        } else {
            currentIndex = nextIndex;
        }
    }

    // Initialize variables
    let num_attacks = null;
    let modifier = null;
    let attack_bonus = null;
    let attack_color = ''; // Added attack_color with default value
    let base_target_ac = null;
    let ac_modifier = 0;
    let target_ac = null;
    let damage_components = null;
    let hp = null;
    let res = [];
    let vul = [];
    let imm = [];

    // Flags to detect multiple components
    let attackRollDetected = false;
    let targetACDetected = false;
    let damageDetected = false;
    let hpDetected = false;
    let resDetected = false;
    let vulDetected = false;
    let immDetected = false;

    // Collect unassigned components
    const unassignedComponents = [];

    // Helper functions
    function parseAttackRoll(text) {
        // Modified regex to capture optional attack_color
        const attackRollPattern = /^(\d+)([nad])([a-z]*)([+-](?:\d+d\d+|\d+)*)?$/i;
        const match = text.match(attackRollPattern);
        if (!match) {
            return null;
        }

        const num_attacks = parseInt(match[1], 10);
        const modifier = match[2].toLowerCase();
        const attack_color = match[3] || ''; // Extract attack_color or set to ''

        const attack_bonus_str = match[4] || '';

        // Parse attack bonuses
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
            attack_color, // Include attack_color in the returned object
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

        // Calculate total AC modifier
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
        const attackRollPattern = /^(\d+)([nad])([a-z]*)([+-](?:\d+d\d+|\d+)*)?$/i;
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

    // Process each component
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
                attack_color = result.attack_color; // Assign attack_color
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

            // Assume parseDamageExpression is defined elsewhere
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
        } else {
            // No keyword, determine possible component types
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
                    attack_color = parsedResults['attack'].attack_color; // Assign attack_color
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

    // Now handle unassigned components
    for (const component of unassignedComponents) {
        const { text, possibleTypes, parsedResults } = component;

        // Determine which types are still missing
        const remainingTypes = [];
        if (!attackRollDetected && possibleTypes.includes('attack')) remainingTypes.push('attack');
        if (!targetACDetected && possibleTypes.includes('target_ac')) remainingTypes.push('target_ac');
        if (!damageDetected && possibleTypes.includes('damage')) remainingTypes.push('damage');
        if (!hpDetected && possibleTypes.includes('hp')) remainingTypes.push('hp');
        if (!resDetected && possibleTypes.includes('res')) remainingTypes.push('res');
        if (!vulDetected && possibleTypes.includes('vul')) remainingTypes.push('vul');
        if (!immDetected && possibleTypes.includes('imm')) remainingTypes.push('imm');

        if (remainingTypes.length >= 1) {
            // Choose the type with highest priority: atk > vs > dmg > hp > res > vul > imm
            const priority = ['attack', 'target_ac', 'damage', 'hp', 'res', 'vul', 'imm'];
            const type = priority.find(t => remainingTypes.includes(t));
            if (type === 'attack') {
                num_attacks = parsedResults['attack'].num_attacks;
                modifier = parsedResults['attack'].modifier;
                attack_bonus = parsedResults['attack'].attack_bonus;
                attack_color = parsedResults['attack'].attack_color; // Assign attack_color
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

    // Additional validation
    if (num_attacks !== null && (num_attacks < 1 || !Number.isInteger(num_attacks))) {
        console.error(`Invalid number of attacks: ${num_attacks}`);
        return null;
    }

    if (num_attacks !== null && !['n', 'a', 'd'].includes(modifier)) {
        console.error(`Invalid attack modifier: ${modifier}`);
        return null;
    }

    return {
        num_attacks,
        modifier,
        attack_bonus,
        attack_color, // Include attack_color in the output
        base_target_ac,
        ac_modifier,
        target_ac,
        damage_components,
        hp,
        res,
        vul,
        imm,
    };
}


// Function to determine damage color based on value
function getDamageColor(damage) {
    if (damage === 'm') return 'damage-miss';
    if (damage >= 6 && damage <= 15) return 'damage-yellow';
    if (damage >= 16 && damage <= 25) return 'damage-red';
    if (damage >= 26 && damage <= 40) return 'damage-purple';
    if (damage >= 41 && damage <= 60) return 'damage-cyan';
    if (damage >= 61) return 'damage-neon-green';
    return 'damage-default';
}

// Function to determine total damage color based on total value
function getTotalDamageColor(total) {
    if (total >= 6 && total <= 15) return 'damage-yellow';
    if (total >= 16 && total <= 25) return 'damage-red';
    if (total >= 26 && total <= 40) return 'damage-purple';
    if (total >= 41 && total <= 60) return 'damage-cyan';
    if (total >= 61) return 'damage-neon-green';
    return 'damage-default';
}
