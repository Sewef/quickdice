// diceRoller.js
import OBR from "@owlbear-rodeo/sdk";

// Function to roll a specified number of dice and return the total and individual rolls
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

// Function to parse user input and extract attack and damage parameters
function parseInput(userInput) {
    // *** Change 1: Strip all spaces first ***
    const strippedInput = userInput.replace(/\s+/g, '');

    // Adjusted pattern to not expect spaces
    const pattern = /^(\d+)([nad])([+-]?\d+)?vs(\d+)([+-]?\d+)?dealing(.+)$/i;
    const match = strippedInput.match(pattern);
    if (!match) {
        console.error(`User input does not match the expected pattern.`);
        return null;
    }

    const num_attacks = parseInt(match[1], 10);
    const modifier = match[2].toLowerCase();
    const attack_bonus = match[3] ? parseInt(match[3], 10) : 0;
    const base_target_ac = parseInt(match[4], 10);
    const ac_modifier = match[5] ? parseInt(match[5], 10) : 0;
    const target_ac = base_target_ac + ac_modifier;
    const damage_expr = match[6].trim();

    if (!Number.isInteger(num_attacks) || num_attacks < 1) {
        console.error(`Invalid number of attacks: ${match[1]}`);
        return null;
    }

    if (!['n', 'a', 'd'].includes(modifier)) {
        console.error(`Invalid modifier: ${modifier}`);
        return null;
    }

    if (!Number.isInteger(base_target_ac)) {
        console.error(`Invalid base target AC: ${match[4]}`);
        return null;
    }

    const damage_components = parseDamageExpression(damage_expr);
    if (!damage_components) {
        console.error(`Failed to parse damage expression: "${damage_expr}"`);
        return null;
    }

    return {
        num_attacks,
        modifier,
        attack_bonus,
        base_target_ac,
        ac_modifier,
        target_ac,
        damage_components
    };
}

// *** Revised Function: Perform attacks and calculate damage ***
function performAttack(attackParams) {
    const attackRolls = [];
    const damageResults = [];

    for (let i = 0; i < attackParams.num_attacks; i++) {
        let roll1, roll2, attack_roll, natural_20 = false;

        if (attackParams.modifier === 'a') { // Advantage
            roll1 = Math.floor(Math.random() * 20) + 1;
            roll2 = Math.floor(Math.random() * 20) + 1;
            attack_roll = Math.max(roll1, roll2);
            natural_20 = (roll1 === 20 || roll2 === 20);
        } else if (attackParams.modifier === 'd') { // Disadvantage
            roll1 = Math.floor(Math.random() * 20) + 1;
            roll2 = Math.floor(Math.random() * 20) + 1;
            attack_roll = Math.min(roll1, roll2);
            natural_20 = (roll1 === 20 && roll2 === 20);
        } else { // Normal
            roll1 = Math.floor(Math.random() * 20) + 1;
            attack_roll = roll1;
            natural_20 = (roll1 === 20);
        }

        const total_attack = attack_roll + attackParams.attack_bonus;
        const isCrit = natural_20;

        // Determine hit or miss
        const hit = isCrit || total_attack >= attackParams.target_ac;

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

        // Determine damage
        if (hit) {
            const damageInstances = []; // Collect individual damage instances for this attack

            attackParams.damage_components.forEach(component => {
                let adjustedValue = 0;
                if (component.isDice) {
                    let count = component.count;
                    if (isCrit) {
                        count *= 2; // Double the number of dice on a critical hit
                    }
                    const { total } = rollDice(count, component.diceType);
                    if (isNaN(total)) {
                        console.error(`Rolled NaN for diceType d${component.diceType}`);
                        adjustedValue = 0;
                    } else {
                        adjustedValue = component.operator === '+' ? total : -total;
                    }
                } else {
                    adjustedValue = component.operator === '+' ? component.value : -component.value;
                }
                // Ensure damage is not negative
                if (adjustedValue < 0) {
                    adjustedValue = 0;
                }

                damageInstances.push({
                    value: adjustedValue,
                    damageType: component.damageType
                });
            });

            damageResults.push(damageInstances);
        } else {
            damageResults.push('m'); // 'm' signifies a miss
        }
    }

    return { attackRolls, damageResults };
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

// Function to set up the Dice Roller UI and interactions
export function setupDiceRoller() {
    const attackCommandInput = document.getElementById('attackCommand');
    const rollButton = document.getElementById('rollButton');
    const attackRollsDiv = document.getElementById('attackRolls');
    const damageResultsDiv = document.getElementById('damageResults');
    const rollHistoryUl = document.getElementById('rollHistory');
    const history = [];

    rollButton.addEventListener('click', () => {
        const userInput = attackCommandInput.value.trim();

        // *** Change 2: Remove all references to "exit" ***
        // Removed the 'exit' condition and its associated code.

        const attackParams = parseInput(userInput);
        if (!attackParams) {
            // *** Change 3: Remove all references to OBR.notification ***
            // Removed OBR.notification.show for invalid input.
            alert(`
Invalid input format. Please try again.
Expected format: '<num><modifier><+/-><bonus> vs <base_AC><+/-><ac_modifier> dealing <damage_expression>'
Examples:
  '5n+4 vs 16 dealing 1d6fi+3+2d8ne+1d4co+2pi+1d6+1d12fi'
  '3a-2 vs 13+3 dealing 1d8fi'
  '2d+5 vs 15-1 dealing 3d4+1'
  '4n vs 14 dealing 2d10'
            `);
            return;
        }

        const { attackRolls, damageResults } = performAttack(attackParams);

        // Display attack rolls
        attackRollsDiv.innerHTML = attackRolls.join(', ');

        // *** Revised Damage Display Logic ***
        // Display damage results with color coding and formatted with types, grouped by attack
        const damageExpressionParts = damageResults.map(result => {
            if (result === 'm') {
                return `<span class="damage-miss">m</span>`;
            }

            // Group damage by type and sum them
            const damageByType = {};
            result.forEach(d => {
                const type = d.damageType || 'untyped';
                if (type in damageByType) {
                    damageByType[type] += d.value;
                } else {
                    damageByType[type] = d.value;
                }
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
            if (sortedDamage.length > 1) {
                return `[${damageStrings}]`;
            } else {
                return damageStrings;
            }
        });

        // Calculate total damage per type across all attacks
        const totalDamageByType = {};
        damageResults.forEach(result => {
            if (result === 'm') return; // Skip misses
            // Group damage by type and sum
            result.forEach(d => {
                const type = d.damageType || 'untyped';
                if (type in totalDamageByType) {
                    totalDamageByType[type] += d.value;
                } else {
                    totalDamageByType[type] = d.value;
                }
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

        // Create the "= total" part with appropriate color
        let formattedTotalDamage;

        if (sortedTotalDamage.length > 1) {
            formattedTotalDamage = `${sortedTotalDamageStrings} = <span class="${getTotalDamageColor(overallTotalDamage)}">${overallTotalDamage}</span>`;
            // Combine individual damage expressions and total damage
            const formattedDamageDisplay = `${damageExpressionParts.join(' + ')} = ${formattedTotalDamage}`;
            damageResultsDiv.innerHTML = formattedDamageDisplay;
        } else if (sortedTotalDamage.length === 1) {
            // Only one damage type, include the type in the overall total
            const totalType = sortedTotalDamage[0].type !== 'untyped' ? sortedTotalDamage[0].type : '';
            formattedTotalDamage = `<span class="${getTotalDamageColor(overallTotalDamage)}">${overallTotalDamage}${totalType !== 'untyped' ? `<span class="damage-type">${totalType}</span>` : ''}</span>`;
            // Since only one damage type per attack, display without brackets and include type
            damageResultsDiv.innerHTML = `${damageExpressionParts.join(' + ')} = ${formattedTotalDamage}`;
        } else {
            // No damage dealt
            damageResultsDiv.innerHTML = `${damageExpressionParts.join(' + ')}`;
        }

        // *** Updated Notification to Include Attack Rolls and Damage on Separate Lines ***
        // Create damage expression for notification
        const damageOutputParts = damageResults.map(result => {
            if (result === 'm') return 'm';
            // Group and sum damage by type
            const damageByType = {};
            result.forEach(d => {
                const type = d.damageType || 'untyped';
                if (type in damageByType) {
                    damageByType[type] += d.value;
                } else {
                    damageByType[type] = d.value;
                }
            });

            // Convert to sorted array
            const sortedDamage = Object.entries(damageByType)
                .map(([type, value]) => ({ type, value }))
                .sort((a, b) => b.value - a.value);

            // Create damage strings
            const damageStrings = sortedDamage.map(d => {
                return d.type !== 'untyped' ? `${d.value}${d.type}` : `${d.value}`;
            }).join(' + ');

            // Determine if square brackets are needed
            if (sortedDamage.length > 1) {
                return `[${damageStrings}]`;
            } else {
                return damageStrings;
            }
        });
        
        // *** Updated Notification to Include Attack Rolls ***
        // Format:
        // "ATK 16, 4, 8, 20
        // DMG [5+3fi] + m + [2+8fi] = 11fi + 7 = 18"

        const atkValues = attackRolls.map(roll => {
            // Remove HTML tags for the notification
            return roll.replace(/<\/?[^>]+(>|$)/g, '');
        });
        const dmgOutput = damageOutputParts.join(' + ');

        // For damage, replicate the main UI's formatted damage display without HTML
        // Reuse the same logic to build the damage string

        // Build DMG part
        let dmgDisplay = '';

        damageResults.forEach((result, index) => {
            if (result === 'm') {
                dmgDisplay += 'm';
            } else {
                // Group damage by type and sum them
                const damageByType = {};
                result.forEach(d => {
                    const type = d.damageType || 'untyped';
                    if (type in damageByType) {
                        damageByType[type] += d.value;
                    } else {
                        damageByType[type] = d.value;
                    }
                });

                // Convert to sorted array
                const sortedDamage = Object.entries(damageByType)
                    .map(([type, value]) => ({ type, value }))
                    .sort((a, b) => b.value - a.value);

                // Create damage strings
                const damageStrings = sortedDamage.map(d => {
                    return d.type !== 'untyped' ? `${d.value}${d.type}` : `${d.value}`;
                }).join(' + ');

                // Determine if square brackets are needed
                if (sortedDamage.length > 1) {
                    dmgDisplay += `[${damageStrings}]`;
                } else {
                    dmgDisplay += `${damageStrings}`;
                }
            }

            if (index < damageResults.length - 1) {
                dmgDisplay += ' + ';
            }
        });

        // Calculate total damage per type across all attacks
        const totalDamageByTypeForNotification = {};
        damageResults.forEach(result => {
            if (result === 'm') return;
            result.forEach(d => {
                const type = d.damageType || 'untyped';
                if (type in totalDamageByTypeForNotification) {
                    totalDamageByTypeForNotification[type] += d.value;
                } else {
                    totalDamageByTypeForNotification[type] = d.value;
                }
            });
        });

        // Convert to sorted array
        const sortedTotalDamageForNotification = Object.entries(totalDamageByTypeForNotification)
            .map(([type, value]) => ({ type, value }))
            .sort((a, b) => b.value - a.value);

        // Create total damage strings
        const sortedTotalDamageStringsForNotification = sortedTotalDamageForNotification.map(d => {
            return d.type !== 'untyped' ? `${d.value}${d.type}` : `${d.value}`;
        }).join(' + ');

        // Calculate overall total damage
        const overallTotalDamageForNotification = sortedTotalDamageForNotification.reduce((acc, d) => acc + d.value, 0);

        // Append the total damage
        if (sortedTotalDamageForNotification.length > 1) {
            dmgDisplay += ` = ${sortedTotalDamageStringsForNotification} = ${overallTotalDamageForNotification}`;
        } else if (sortedTotalDamageForNotification.length === 1) {
            const totalType = sortedTotalDamageForNotification[0].type !== 'untyped' ? sortedTotalDamageForNotification[0].type : '';
            dmgDisplay += ` = ${overallTotalDamageForNotification}${totalType !== 'untyped' ? totalType : ''}`;
        }

        // Combine ATK and DMG with a newline
        const notificationMessage = `ATK ${atkValues.join(', ')}\nDMG ${dmgDisplay}`;

        OBR.notification.show(notificationMessage);

        // Add to history
        addToHistory(userInput, damageResults);
    });

    // Handle Enter key for submission
    attackCommandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            rollButton.click();
        }
    });

    // Function to add a roll to history
    function addToHistory(command, damageResults) {
        // Limit history to 20 entries
        if (history.length >= 20) {
            history.pop(); // Remove the oldest entry
            if (rollHistoryUl.lastChild) {
                rollHistoryUl.removeChild(rollHistoryUl.lastChild);
            }
        }

        history.unshift({ command, damageResults });

        const li = document.createElement('li');
        li.classList.add('history-item');
        li.style.cursor = 'pointer'; // Indicate that it's clickable

        // Set data attribute for the command
        li.setAttribute('data-command', command);

        // Create a container with flex to hold command and damage
        const container = document.createElement('div');
        container.classList.add('history-container');
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        container.style.width = '100%';

        const commandSpan = document.createElement('span');
        commandSpan.classList.add('history-command');
        commandSpan.textContent = command;

        const damageSpan = document.createElement('span');
        damageSpan.classList.add('history-damage');

        // Populate damageSpan with color-coded damage numbers and types, grouped by attack
        damageResults.forEach((result, index) => {
            if (result === 'm') {
                const span = document.createElement('span');
                span.classList.add('damage-miss');
                span.textContent = 'm';
                damageSpan.appendChild(span);
            } else {
                // Group damage by type and sum them
                const damageByType = {};
                result.forEach(d => {
                    const type = d.damageType || 'untyped';
                    if (type in damageByType) {
                        damageByType[type] += d.value;
                    } else {
                        damageByType[type] = d.value;
                    }
                });

                // Convert to sorted array
                const sortedDamage = Object.entries(damageByType)
                    .map(([type, value]) => ({ type, value }))
                    .sort((a, b) => b.value - a.value);

                // Create damage strings
                const damageStrings = sortedDamage.map(d => {
                    const colorClass = getDamageColor(d.value);
                    return `<span class="${colorClass}">${d.value}${d.type !== 'untyped' ? `<span class="damage-type">${d.type}</span>` : ''}</span>`;
                }).join(' + ');

                // Determine if square brackets are needed
                if (sortedDamage.length > 1) {
                    damageSpan.innerHTML += `[${damageStrings}]`;
                } else {
                    damageSpan.innerHTML += `${damageStrings}`;
                }
            }

            if (index < damageResults.length - 1) {
                const plus = document.createTextNode(' + ');
                damageSpan.appendChild(plus);
            }
        });

        // Calculate total damage per type across all attacks
        const totalDamageByType = {};
        damageResults.forEach(result => {
            if (result === 'm') return;
            result.forEach(d => {
                const type = d.damageType || 'untyped';
                if (type in totalDamageByType) {
                    totalDamageByType[type] += d.value;
                } else {
                    totalDamageByType[type] = d.value;
                }
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

        // Create the "= total" part with appropriate color
        if (sortedTotalDamage.length > 1) {
            damageSpan.innerHTML += ` = ${sortedTotalDamageStrings} = <span class="${getTotalDamageColor(overallTotalDamage)}">${overallTotalDamage}</span>`;
        } else if (sortedTotalDamage.length === 1) {
            // Include the damage type in the total
            const totalType = sortedTotalDamage[0].type !== 'untyped' ? sortedTotalDamage[0].type : '';
            damageSpan.innerHTML += ` = <span class="${getTotalDamageColor(overallTotalDamage)}">${overallTotalDamage}${totalType !== 'untyped' ? `<span class="damage-type">${totalType}</span>` : ''}</span>`;
        }

        container.appendChild(commandSpan);
        container.appendChild(damageSpan);
        li.appendChild(container);

        // Prepend the new history entry
        rollHistoryUl.prepend(li);
    }

    // Event delegation for history item clicks
    rollHistoryUl.addEventListener('click', (e) => {
        let target = e.target;

        // Traverse up to the li element
        while (target && target.nodeName !== 'LI') {
            target = target.parentElement;
        }

        if (target && target.getAttribute('data-command')) {
            const command = target.getAttribute('data-command');
            attackCommandInput.value = command;
            //rollButton.click();
        }
    });
}
