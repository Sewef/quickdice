const readline = require('readline');

// Function to roll a specified number of dice and return the total
function rollDice(number, diceType) {
    let total = 0;
    for (let i = 0; i < number; i++) {
        total += Math.floor(Math.random() * diceType) + 1;
    }
    return total;
}

// Function to parse user input and extract attack and damage parameters
function parseInput(userInput) {
    const pattern = /^\s*(\d+)\s*([nad])(?:([+-]\d+))?\s+vs\s+(\d+)(?:([+-]\d+))?\s+dealing\s+(\d+)d(\d+)(?:([+-]\d+))?\s*$/i;
    const match = userInput.match(pattern);
    if (!match) {
        return null;
    }

    const num_attacks = parseInt(match[1], 10);
    const modifier = match[2].toLowerCase();
    const attack_bonus = match[3] ? parseInt(match[3], 10) : 0;
    const base_target_ac = parseInt(match[4], 10);
    const ac_modifier = match[5] ? parseInt(match[5], 10) : 0;
    const target_ac = base_target_ac + ac_modifier;
    const damage_num = parseInt(match[6], 10);
    const damage_type = parseInt(match[7], 10);
    const damage_bonus = match[8] ? parseInt(match[8], 10) : 0;

    return {
        num_attacks,
        modifier,
        attack_bonus,
        base_target_ac,
        ac_modifier,
        target_ac,
        damage_num,
        damage_type,
        damage_bonus
    };
}

// Function to perform attacks and calculate damage
function performAttack(attackParams) {
    const attackRolls = [];
    const damageResults = [];

    for (let i = 0; i < attackParams.num_attacks; i++) {
        let roll1, roll2, attack_roll, natural_20 = false;

        if (attackParams.modifier === 'a') { // Advantage
            roll1 = Math.floor(Math.random() * 20) + 1;
            roll2 = Math.floor(Math.random() * 20) + 1;
            attack_roll = Math.max(roll1, roll2);
            natural_20 = roll1 === 20 || roll2 === 20;
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

        // Format attack roll
        const attackStr = isCrit ? `[${total_attack}]` : `${total_attack}`;
        attackRolls.push(attackStr);

        // Determine hit or miss
        if (isCrit || total_attack >= attackParams.target_ac) {
            let current_damage_num = isCrit ? attackParams.damage_num * 2 : attackParams.damage_num;
            let damage = Math.max(0, rollDice(current_damage_num, attackParams.damage_type) + attackParams.damage_bonus);
            const damageStr = isCrit ? `[${damage}]` : `${damage}`;
            damageResults.push(damageStr);
        } else {
            damageResults.push('m');
        }
    }

    return { attackRolls, damageResults };
}

// Main function to handle user interaction
function main() {
    let debugMode = false;

    console.log("Welcome to the Dice Roller! Type 'exit' to quit or 'debug' to toggle debug mode.");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'Enter your command: '
    });

    rl.prompt();

    rl.on('line', (line) => {
        const userInput = line.trim();

        if (userInput.toLowerCase() === 'exit') {
            console.log("Exiting the Dice Roller. Goodbye!");
            rl.close();
            return;
        } else if (userInput.toLowerCase() === 'debug') {
            debugMode = !debugMode;
            const status = debugMode ? "ON" : "OFF";
            console.log(`Debug mode is now ${status}.`);
            rl.prompt();
            return;
        } else {
            const attackParams = parseInput(userInput);
            if (!attackParams) {
                console.log("Invalid input format. Please try again.");
                console.log("Expected format: '<num><modifier><+/-><bonus> vs <base_AC><+/-><ac_modifier> dealing <num>d<type><+/-><bonus>'");
                console.log("Examples:");
                console.log("  '5n+4 vs 16 dealing 2d6+3'");
                console.log("  '3a-2 vs 13+3 dealing 1d8'");
                console.log("  '2d+5 vs 15-1 dealing 3d4-1'");
                console.log("  '4n vs 14 dealing 2d10'");
                rl.prompt();
                return;
            }

            if (debugMode) {
                console.log("Parsed Parameters:");
                for (const [key, value] of Object.entries(attackParams)) {
                    console.log(`  ${key}: ${value}`);
                }
            }

            const { attackRolls, damageResults } = performAttack(attackParams);

            // Format attack output
            const attackOutput = attackRolls.join(', ');

            // Calculate total damage
            let total_damage = damageResults.reduce((acc, val) => {
                if (val === 'm') return acc;
                const num = parseInt(val.replace(/[\[\]]/g, ''), 10);
                return acc + num;
            }, 0);

            // Create damage expression
            const damageExpression = damageResults.join(' + ');
            const damageOutput = damageResults.filter(d => d !== 'm').length > 0 ? `${total_damage} = ${damageExpression}` : '0';

            console.log(attackOutput);
            console.log(damageOutput);
        }

        rl.prompt();
    }).on('close', () => {
        process.exit(0);
    });
}

main();
