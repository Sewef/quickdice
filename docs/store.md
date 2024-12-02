---
title: Quickdice
description: Quickdice is a simple CLI-style application for complex d20 attack rolls.
author: Robert Wegner
image: https://quickdice.onrender.com/icon.svg
icon: https://quickdice.onrender.com/icon.svg
tags:
  - die
  - dice
  - quick
  - simple
  - command
  - roll
  - rolls
  - damage types
  - dombat
manifest: https://quickdice.onrender.com/manifest.json
learn-more: robert.wegner4@outlook.de
---

# Quickdice

# Interface Overview

## Container

### Controls
- **Input**
  - Placeholder: e.g., `5<n/a/d>+4 vs 16 dmg 2d6fi+3bl+1d4`
- **Button**
  - Roll
- **Options**
  - **View Selector**
    - Log
    - Info
    - Commands
  - **Checkbox**
    - Hidden
  - **Checkbox**
    - Physical
  - **Slider**
    - Physical (0-100, default 50)

## Sections

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
