---
title: Quickdice
description: Quickdice is a simple dice rolling console that supports complex d20 attack rolls.
author: Robert Wegner
image: https://quickdice.onrender.com/hero.gif
icon: https://quickdice.onrender.com/icon.svg
tags:
  - die
  - tool
  - combat
  - automation
manifest: https://quickdice.onrender.com/manifest.json
learn-more: robert.wegner4@outlook.de
---

# Quickdice

### 1. Ability Checks/Attack Rolls
- Use `1n`, `1a`, or `1d` for a d20 roll that is normal, with advantage, or with disadvantage, respectively.
- Use `3n` for 3 rolls.
- Use `3n+2+1d4` or `3n + 2 + 1d4` for 3 rolls, each with a bonus of +2 and +1d4.
- Spaces are always ignored.

### 2. Difficulty/Armor Class
- The keyword `vs` specifies that a difficulty class follows.
  - For example, `2n+1 vs 13` will roll 2 ability checks with +1 against a difficulty class of 13.
- Successful rolls are highlighted in green, and critical successes in gold.
- You can also use the keyword `atk` to explicitly signify the ability check/attack roll.
  - The commands `13 atk 2n+1`, `atk 2n+1 vs 13`, and `vs 13 atk 2n+1` are all equivalent.

### 3. Damage Rolls
- Use `1d6`, `3d8`, `2d12`, `4d7`, etc., for damage rolls.
- You can also add them together like `1d6 + 3d8 + 2d12 + 3`.
- Spaces are always ignored.
- Use the keyword `dmg` to combine damage rolls with attack rolls:
  - For example, `2n+1 vs 13 dmg 1d8+2` or `1d8+2 atk 2n+1 vs 13`.
- Only those attacks which hit will have damage rolled, and those with crits will have double the number of damage dice.
- The first keyword can usually be left out, and the first component is interpreted according to the priorities:
  - `atk > vs > dmg > hp > res > vul > imm`
- The resulting damage is first summed up for each attack roll, and then totaled.
- The damage numbers are colored according to their magnitude.

### 4. Damage Types
- A damage type can be any string, but the intended usage is that the first two letters of the standard D&D damage types indicate it.
  - For example, `fi` for fire, `co` for cold, and so on.
- When specifying a damage roll, you can add them behind each damage instance:
  - For example, `1d6fi + 3d8co + 2d12 + 3ac`.
- The resulting damage will be grouped by these damage types.
- You can also add "meaningless" damage types to the ability check/attack roll to choose one of a set of colors for the physical dice.
  - This looks like `2nfi` for 2 rolls with "fire dice".
- Note that if there is a bonus die, you should still write `2nfi+1d4+1d8+2`; then all attack roll dice will be fire-themed.

### 5. Hitpoints
- With `2d12+1d4 hp 87`, you can roll damage against 87 hitpoints, and the reduced hitpoints will be displayed.
- You can of course combine this into previous rolls:
  - For example, `58 atk 3d+1d4 vs 17 dmg 3d8fi+1d12co` will perform 3 attacks with disadvantage and +1d4 against 17 AC, roll for damage, and subtract it all from 58 hitpoints.
- Again, the `hp` keyword could be left out because the parser can still interpret the command.

### 6. Resistances, Vulnerabilities, and Immunities
- Consider the command `3d+1d4 vs 17 dmg 3d8fi+1d12co+3bl+1d6ne hp 107 res fi vul co+bl imm ne`.
  - Here, the new hitpoints will be computed respecting fire resistance, cold and bludgeoning vulnerability, and acid immunity.

### 7. Roll Log and Keyboard Shortcuts
- The roll log is shared with other players if the "hidden" checkbox is not selected.
- You can click on entries to load their command into the command input.
- When the extension is in focus:
  - **CTRL+S** to select the command input.
  - **CTRL+H** to toggle whether the roll results will be shared with other players.
  - **CTRL+P** to toggle the usage of physical dice rolls.

### 8. Saving and Loading Commands
- Use `save mycommand`, `load mycommand`, and `delete mycommand` to save, load, and delete commands.
- Your saved commands can be seen in the dropdown menu under "Commands".

### 9. Usage of the Quickdice API

Quickdice provides an API that allows integration with other Owlbear Rodeo (OBR) extensions. You can interact with the API using the broadcast messaging system provided by OBR.

- **Initiate a Roll**

  Send a message on the `quickdice.api.roll` channel with the necessary parameters:

  ```javascript
  OBR.broadcast.sendMessage("quickdice.api.roll", {
    id: "myUniqueRollId", // A unique identifier for the roll
    command: "5n+1d6 vs 12 dmg 3d8fi+1d4+2ne hp 100", // 5 natural attacks with +1d6 vs 12 AC dealing 3d8 fire + 1d4 neutral + 2 necrotic damage against 100 hp
    isHidden: false,     // Set to true to hide the roll from other players
    isPhysical: true,    // Set to true to use the physical dice simulation
    attackSeed: { a: 12134, b: 72312, c: 58283, d: 96853 },  // Optional seed for attack rolls. Same seed implies same result
    damageSeed: { a: 29524, b: 69375, c: 83349, d: 54335 }   // Optional seed for damage rolls. Same seed implies same result
  }, { destination: "LOCAL" });
  ```

- **Listen for Results**

  Listen on on the `quickdice.api.results` channel for all results and on
  the `quickdice.api.result.myUniqueRollId` channel for a particular roll.

   ```javascript
  OBR.broadcast.onMessage("quickdice.api.results", (event) => {
    yourCallback(event.data); //event.data.id is myUniqueRollId
  });
  ```
  ```javascript
  OBR.broadcast.onMessage("quickdice.api.results.myUniqueRollId", (event) => {
    yourCallback(event.data); //event.data.id is myUniqueRollId
  });
  ```

- **Listen for Errors**

  Listen on the `quickdice.api.error` channel for errors.

  ```javascript
  OBR.broadcast.onMessage("quickdice.api.error", (event) => {
    yourErrorCallback(event.data.id); //event.data.id is myUniqueRollId
  });
  ```