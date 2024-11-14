Quickdice
=========

Quickdice is an extension for the Owlbear Rodeo VTT. It is a simple CLI-style application designed for executing complex d20 attack rolls quickly.

Author: Robert Wegner
Contact: robert.wegner4@outlook.de

Usage:
A command for Quickdice should follow this format:
    (number of attack rolls)(n/a/d for normal, advantage, or disadvantage) + (attack bonus) vs (AC) + (AC bonus>) dmg (damage breakdown)

The damage breakdown consists of one or more damage instances separated by `+`. Damage instances can be simple numbers (e.g., `3`), dice rolls (e.g., `1d6`), or specific types (e.g., `2d6fi` for fire damage, `1d12co` for cold damage, `5ne` for necrosis damage).
Spaces are ignored.

Examples:
1. `2n+4 vs 12 dmg 1d6+4`  
2. `2a - 3 vs 17 + 1 dmg 1d6fi + 9ne + 4d12pi`  
3. `4d+1vs10dmg2d6+1d7+3d4co+1bl`

The tool calculates the number of attacks, compares each to the AC, and breaks down the damage by type. Natural 20 rolls are treated as automatic hits, doubling the dice rolled for that attack.
