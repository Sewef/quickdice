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

A command must have the form
(number of attack rolls)(n/a/d for normal, advantage or disadvantage)+(attack bonus) vs (AC)+(AC bonus>) dmg (damage part)
where the damage part is a number of damage instances with '+' inbetween. Examples of damage instances are 3, 1d6, 2d6fi, 1d12co, 5ne.
Giving an attack bonus or AC bonus is optional. Spaces are ignored. Examples of commands are:
2n+4 vs 12 dmg 1d6+4
2a - 3 vs 17 + 1 dmg 1d6fi + 9ne + 4d12pi
4d+1vs10dmg2d6+1d7+3d4co+1bl
The desired number of attack rolls is then computed, compared to the AC, and the damage is calcualted and broken down. 
Natural 20's are guaranteed hits and double the number of dice in that attack roll.