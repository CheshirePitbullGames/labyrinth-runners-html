# Maze Adventure Game

## Game Design Document

## 1. Project Overview

### Working Title

**Maze Adventure Game**

### Genre

- Online multiplayer action-adventure
- Room-based maze crawler
- PvPvE
- Extraction / survival elements
- Light roguelite session structure

### Platform

- HTML5 browser game
- Desktop browsers first
- Mobile browsers possible later, but not a primary target for the first release

### Technology Stack

#### Client

- HTML5
- TypeScript
- Phaser 3 or PixiJS plus a custom gameplay layer
- WebSocket client for real-time multiplayer
- REST API for account and meta actions

#### Server

- Node.js
- TypeScript
- WebSocket server with Socket.IO or `ws`
- REST API with Fastify, Express, or NestJS
- Redis for transient state, matchmaking, pub/sub, and session cache
- PostgreSQL or MySQL for persistent data
- Optional object storage and CDN for assets

### High Concept

Players enter dangerous procedurally generated mazes made of interconnected
rooms. Their objective is to reach the center, defeat or bypass the boss, and
claim the main chest. Along the way they fight monsters, avoid traps, loot
gear, solve room challenges, encounter merchants, and decide whether to
cooperate with or betray other players. Winners may continue deeper into higher
rounds while a deadly hazard closes in from the outer edges of the maze.

## 2. Design Pillars

### 2.1 Tension Through Space

The maze itself is the main source of pressure:

- locked and opening doors
- unknown neighboring rooms
- procedural layouts
- environmental hazards
- shrinking danger from edges toward center

### 2.2 Choice Between Cooperation and Betrayal

Players should constantly choose whether to:

- fight now
- avoid conflict
- cooperate for survival
- betray for loot or position

### 2.3 Session-Based High Stakes

Each run should feel meaningful:

- useful items are temporary during the match
- cosmetics and account progression persist
- death resets match-specific progression
- surviving deeper rounds feels valuable

### 2.4 Readable, Fast Web Gameplay

For HTML5, gameplay must stay:

- responsive
- visually readable
- network efficient
- mechanically deep without overcomplicated controls

## 3. Core Gameplay Loop

1. Player enters lobby
2. Selects character, cosmetics, and appearance loadout
3. Joins matchmaking
4. Enters a procedurally generated maze
5. Explores rooms
6. Fights enemies and players
7. Opens chests, solves puzzles, and interacts with merchants
8. Gains loot, gold, experience, and temporary power
9. Moves toward center while the outer hazard advances inward
10. Reaches the center room
11. Defeats the boss or exploits chaos around it
12. Claims the chest
13. If victorious, may advance to the next round with other winners
14. Eventually dies, extracts, or loses
15. Returns to the meta progression loop

## 4. Narrative and Setting

### 4.1 World

The game takes place in a fantasy realm where mazes exist as brutal public
spectacles. Entire cities and regions host massive maze complexes where heroes
are watched by crowds. These mazes are part entertainment, part prison, and
part ritual.

The world is fantasy-first, but not limited to medieval fantasy. Weapons,
abilities, and enemies may include:

- swords
- bows
- knives
- shields
- magic
- alchemical devices
- primitive guns
- advanced lost technology
- lasers and arcane-tech hybrids

This allows broad content variety without strict lore constraints.

### 4.2 Premise

The mazes are treated as sport. Spectators idolize powerful participants and
consume these violent events as entertainment. Winners move deeper into
connected levels, chasing treasure, power, glory, or escape.

### 4.3 Myth

There is a myth that every maze has a final depth. At the end waits the
creator: a cruel god-like being who feeds on the energy of both fighters and
spectators. He guards the ultimate treasure and holds power over the entire
system.

Different players may seek:

- wealth
- artifacts
- divine power
- freedom from the maze cycle
- destruction of the whole spectacle

### 4.4 Narrative Trigger

When a player completes a maze level for the first time, they receive a vision
or cutscene showing:

- their family endlessly watching the spectacle
- loved ones fading under its influence
- greedy and senseless violence between competitors
- the moral corruption of the maze system

This reveals that the spectacle itself is evil, and that true victory may
require cooperation rather than endless bloodshed.

## 5. Target Audience

### Primary Audience

- PC browser players
- fans of PvPvE survival games
- roguelite and extraction game players
- players who enjoy tense social dynamics
- indie multiplayer audiences

### Secondary Audience

- casual competitive browser players
- stream-friendly and spectator-friendly audiences
- players interested in tactical top-down action

## 6. Gameplay Structure

### 6.1 Match Format

A match consists of:

- one maze instance
- multiple players entering at different or symmetric edge positions
- progression toward the central room
- environmental pressure increasing over time
- a win condition centered on the center-room objective

### 6.2 Room-Based Maze

The maze is composed of discrete rooms connected by doors.

#### Room Rules

- only one room is fully visible to the player at a time
- neighboring room information is partial
- doors are on timers:
  - closed for approximately 30 seconds
  - open for approximately 5 seconds
- players must time movement and decisions around door states

### 6.3 Room Content Types

Each room can contain one or more of:

- enemies
- treasure chest
- puzzle
- merchant
- environmental obstacles
- hidden traps
- other players
- boss encounter
- hazard event

Examples of obstacles:

- fallen floor
- lava tiles
- spike mechanisms
- poison vents
- slow terrain
- collapsing bridges

### 6.4 PvPvE Interaction

Players may:

- fight monsters
- fight each other
- ignore each other
- cooperate temporarily
- share resources
- betray alliances

The game should allow emergent social behavior instead of forcing one correct
approach.

## 7. Player Characters

### 7.1 Character Identity

Characters are customizable heroes, not story-specific protagonists.

There are no fixed named heroes required for the initial version.

### 7.2 Character Model

Each character has:

- appearance customization
- temporary match stats
- temporary inventory
- temporary level
- class identity
- skills and powers
- action bar slots

### 7.3 Character Classes

The initial version should use a small set of readable archetypes, for example:

- Warrior
- Ranger
- Rogue
- Mage

Possible future hybrid classes:

- Engineer
- Alchemist
- Techno-Mystic
- Heavy Guardian

#### Class Differences

Classes differ in:

- base stats
- starting skill
- movement feel
- weapon affinities
- utility role

### 7.4 Stats

Classic RPG stats for temporary in-match progression:

- HP
- MP / Energy
- Strength
- Agility
- Vitality
- Intelligence
- Defense
- Luck

#### Notes

- account progression does **not** increase combat stats permanently
- stats reset each new match
- stat points are assigned only during the current run

## 8. Combat

### 8.1 Perspective

- 2D top-down real-time combat

### 8.2 Core Combat Principles

Combat should be:

- readable
- fast
- deadly enough to create tension
- simple to input
- deep through positioning, timing, item usage, and player interaction

### 8.3 Weapon Types

Initial equipment families:

- swords
- bows
- knives
- shields
- armor pieces

Armor classes:

- light
- medium
- heavy

### 8.4 Rarity

Items use rarity tiers influenced by drop table and luck:

- Common
- Uncommon
- Rare
- Epic
- Legendary

### 8.5 Temporary Nature

All usable gear is match-bound:

- lost on death
- not carried permanently outside the run
- surviving loot may carry into chained winner rounds if that mode is active

### 8.6 Combat Feedback

On hit:

- a damage number appears
- an HP change indicator appears
- a hit reaction animation plays
- a sound effect triggers
- an optional status effect indicator appears

## 9. Items, Loot, and Economy

### 9.1 Loot Sources

Players obtain gold and items from:

- chests
- monsters
- other players
- merchants
- room completion
- maze completion
- boss rewards

### 9.2 Item Behavior

Players can:

- equip items
- use consumables
- drop items
- place items into chests
- sell items to merchants
- buy items from merchants

### 9.3 Merchant Rooms

Some rooms contain merchants that allow:

- buying gear
- selling loot
- buying consumables
- limited special offers
- risk versus reward decisions when spending gold before center

### 9.4 Gold

Gold is earned during a run through:

- loot
- combat
- selling gear
- room objectives
- end-of-maze rewards

Gold usage:

- **in match**: buy functional items from merchants
- **out of match**: buy cosmetic items only

## 10. Progression

### 10.1 Match-Only Character Progression

During a run, the character can:

- gain EXP
- level up
- gain stat points
- become stronger for that run only

EXP is gained by:

- killing enemies
- fighting players
- clearing rooms
- completing puzzles
- surviving progression milestones
- finishing maze objectives

#### Important Rule

When the character dies or the match ends, match-level progression resets:

- level resets
- stats reset
- temporary inventory resets

### 10.2 Account Progression

Persistent progression exists at account level:

- account EXP gained from matches
- each account level grants cosmetic rewards
- no permanent gameplay power is granted

### 10.3 Cosmetics

Cosmetics may include:

- skin tone
- glasses
- eyes
- facial expressions and emotions
- icon or avatar
- death animation
- win animation
- visual emotes
- outfit appearance layers

## 11. Match Progression and Win Flow

### 11.1 Main Objective

Reach the center room where the main chest is guarded by a boss.

### 11.2 Center Room Dynamic

When players arrive at the center:

- they may fight each other first
- they may cooperate against the boss
- they may wait for others to weaken the boss
- they may steal the reward opportunity

### 11.3 Winner Advancement

When a player or surviving team wins:

- winners may advance into another round
- the next round combines winners from other completed mazes
- this creates a tournament-like progression or win-streak structure

This system can be introduced after the core MVP if needed.

## 12. Environmental Pressure

### 12.1 Outer Hazard

After some time, the maze becomes increasingly deadly from the outer edges
inward.

Possible hazard themes:

- poison gas
- lava spread
- darkness corruption
- monster invasion
- cursed fog
- mechanical purge

### 12.2 Purpose

The hazard prevents passive stalling and forces:

- movement
- confrontation
- route decisions
- urgency

### 12.3 Hazard Behavior

- begins after a grace period
- expands by room ring or tile layer
- damages or kills players who remain in contaminated zones
- is visually telegraphed before activation

## 13. World and Regions

### 13.1 Structure

The world contains multiple themed regions, each with large sets of mazes.

### 13.2 Example Region Themes

- Ancient stone city
- Dark gothic black-metal city
- Forest or nature city
- Industrial city

### 13.3 Depth Progression

As players descend deeper:

- visual themes may blend
- regions may cross-contaminate
- the maze may transition into more hostile forms
- lava, underworld, and endgame themes may appear

## 14. Level Design

### 14.1 Generation Style

Mazes are procedurally generated.

### 14.2 Variables

Maze generation depends on:

- player count
- selected match size
- region theme
- target match duration
- room density
- special room rate
- difficulty tier

### 14.3 Room Grid / Graph

For the HTML5 version, the recommended model is:

- maze represented as a graph of rooms
- each room internally represented by a tile grid
- players move inside room space in real time
- doors connect adjacent rooms

This gives a strong balance between:

- room-level procedural generation
- tile-level interaction and visuals
- manageable networking

### 14.4 Room Types

Suggested room taxonomy:

- Start Room
- Combat Room
- Chest Room
- Puzzle Room
- Trap Room
- Merchant Room
- Event Room
- Boss Room
- Dead Zone / Hazard Room

## 15. Art and Visuals (NTBD)

### Current Direction

- 2D visuals
- one full room visible at a time
- room built from tiles for modular rendering and logic
- each region has a distinct style
- rooms should not feel static

### Visual Principles

- strong readability over detail overload
- simple environmental animations such as:
  - waving grass
  - moving shadows
  - torch flicker
  - smoke
  - ambient wind
- interactable objects should always have visual feedback
- damage and health indicators should be visible during combat

### Technical Recommendation for HTML5

- use tilemaps for room floors and walls
- use sprite layers for interactables
- use lightweight particles for combat and hazards
- prioritize performance and readability over heavy effects

### NTBD

Needs deeper definition for:

- exact art style
- character proportions
- animation budget
- asset pipeline
- region tileset specifications
- UI visual language
- VFX limitations for browser

## 16. Audio and Music (NTBD)

### Current Direction

- audio should stay simple but responsive
- every important interaction should have sound feedback
- each room should have contextual audio mood

Examples:

- intense combat music for danger or fight rooms
- mystical tones for chest rooms
- calmer neutral state after fights
- unique regional ambience per biome or theme

### Audio Layers

- movement and footsteps
- hits, damage, and skill sounds
- doors
- traps
- enemy cues
- room ambience
- region ambience
- short adaptive music layers

### NTBD

Needs deeper definition for:

- music system complexity
- adaptive music transitions
- sound variation count
- performance budget for web audio
- audio priority system for crowded rooms

## 17. User Interface

### 17.1 Main Menu

Main menu should include:

- character list
- character creation
- customization menu
- play and matchmaking section
- store
- inventory
- season pass
- settings

### 17.2 Gameplay UI

Gameplay UI should stay minimalistic but informative.

Display:

- HP
- MP / Energy
- equipped items
- action bar
- skill slots
- quick consumables
- door timer
- overall hazard timer
- small map overlay with nearby rooms
- menu and settings access

### 17.3 Character Menu

Character menu should include:

- inventory
- stats
- skill tree or level-up panel
- full map
- current match data

### 17.4 Interaction Feedback

- highlighted interactables
- chest open animation
- merchant indicator
- trap telegraphing when discovered
- damage popups
- status indicators

## 18. Controls

### 18.1 Desktop Controls

Recommended:

- WASD for movement
- mouse aim and click for attack or interact
- number keys for action bar
- tab or map toggle
- inventory key
- skill hotkeys

Alternative:

- full keyboard only
- controller support later

### 18.2 Mobile Browser

Possible later adaptation:

- virtual joystick
- context-sensitive skill buttons
- simplified UI scaling

Not recommended for MVP.

## 19. Multiplayer Architecture

### 19.1 Network Model

The game should be **server authoritative**.

The server is responsible for:

- room state
- movement validation
- combat resolution
- loot generation
- enemy AI
- door timers
- hazard progression
- match outcome

The client is responsible for:

- input sending
- rendering
- prediction and interpolation where needed
- UI
- local effects

### 19.2 Communication Model

Use:

- **WebSocket** for real-time gameplay
- **REST API** for:
  - login and auth
  - profile
  - cosmetics
  - inventory meta
  - store
  - matchmaking entry
  - season pass progression

### 19.3 Server Room Model

A good scalable approach is:

- one match instance manages the full maze
- each room can be processed as a logical sub-unit
- visibility and events can be scoped by room proximity
- the server can broadcast only relevant updates to each player

This keeps architecture manageable without prematurely over-splitting
infrastructure.

#### Recommendation

Do **not** physically split each room into a separate Node process at the MVP
stage. Instead:

- keep one match process or instance per maze
- internally separate room logic modules
- optimize visibility and update routing by room

Later, if needed:

- shard by match
- shard by region
- use Redis pub/sub between services

### 19.4 Matchmaking

Initial matchmaking modes:

- Quick Match
- Private Match
- Possibly team queue later

Possible parameters:

- map size
- player count
- region
- ranked or unranked
- event mode

## 20. Backend Architecture

### 20.1 Recommended Stack

- Node.js
- TypeScript
- Fastify or NestJS
- Socket.IO or `ws`
- Redis
- PostgreSQL

### 20.2 Core Services

Suggested backend modules:

- Auth Service
- Profile Service
- Matchmaking Service
- Match Server
- Reward and Progression Service
- Store and Cosmetics Service
- Analytics and Telemetry Service
- Admin Tools

### 20.3 Data Split

#### Persistent Data

Stored in SQL:

- accounts
- cosmetics
- account level
- season pass progress
- purchased items
- match history
- analytics aggregates

#### Ephemeral Data

Stored in memory or Redis:

- active sessions
- live match state cache
- room timers
- current matchmaking queues
- reconnect state

### 20.4 Reconnection

Must support short disconnect recovery:

- reconnect token or session
- return to live match if still alive
- timeout before character becomes abandoned or dead

## 21. Client Architecture

### 21.1 Recommended Client Modules

- Boot and preload
- Login and menu scene
- Lobby and matchmaking scene
- Room gameplay scene
- UI overlay system
- Input system
- Prediction and interpolation layer
- Audio manager
- Asset manager
- Network state synchronizer

### 21.2 Rendering Approach

- room tilemap layer
- obstacles and interactable layer
- entity layer
- VFX layer
- UI layer

### 21.3 State Handling

Suggested split:

- local visual state
- server snapshot state
- interpolated entity state
- UI, store, and profile state

## 22. Technical Constraints for HTML5

### 22.1 Performance Goals

- stable framerate on a mid-range desktop browser
- low-latency WebSocket updates
- limited overdraw and particles
- small initial bundle size
- lazy loading where possible

### 22.2 Browser Constraints

Need to account for:

- inconsistent performance across browsers
- audio unlock and user gesture restrictions
- mobile browser memory limits
- asset loading delays
- WebSocket reconnect edge cases

### 22.3 MVP Technical Limits

To keep the MVP realistic:

- 2D only
- limited players per match
- limited enemy count per room
- simple AI first
- limited skill count
- no overly complex physics

## 23. Monetization

### 23.1 Purchasable Content

Players can buy with hard currency:

- cosmetic items
- season pass

### 23.2 Non-Pay-to-Win Rule

No purchases should affect gameplay power.

Do not sell:

- stronger weapons
- permanent stat boosts
- better drop rates that affect fairness in competitive play

### 23.3 Store Structure

Store sections:

- character cosmetics
- emotes
- icons
- special death and win effects
- seasonal cosmetics
- pass bundles

## 24. Testing and QA

### 24.1 Core Principle

The game should be built in a modular way so systems can be tested in isolation.

### 24.2 Testable Systems

Need test coverage or simulation coverage for:

- room generation
- maze generation
- pathing
- combat calculations
- enemy AI states
- loot tables
- door timing logic
- hazard spread logic
- reconnect logic
- inventory operations

### 24.3 Test Environments

Should include:

- local test scenes for rooms
- enemy sandbox room
- movement and control sandbox
- procedural generation visualizer
- network simulation test mode

### 24.4 QA Process

- early self-testing
- friend playtests
- later external testers
- iterative balancing from real match data

## 25. Live Ops and Analytics

### 25.1 Metrics to Track

- session duration
- room completion rate
- average survival time
- player kill frequency
- boss reach rate
- boss win rate
- loot economy
- disconnect rate
- browser and device distribution
- retention
- cosmetic conversion

### 25.2 Event Logging

Track events such as:

- room entered
- door crossed
- item looted
- item sold
- player killed
- boss engaged
- boss defeated
- hazard death
- match abandoned

## 26. MVP Scope

### 26.1 MVP Goal

Deliver one playable browser-based online maze run with:

- account login
- one region tileset
- one generated maze format
- 2 to 4 players
- basic enemies
- basic chest, merchant, and trap rooms
- basic PvP
- center boss room
- hazard timer
- temporary match progression
- cosmetic account progression stub

### 26.2 MVP Features

- top-down movement
- room-based maze
- door timers
- one or two classes
- basic combat
- loot pickups
- simple merchant
- minimap
- death and reset loop
- matchmaking or private room code
- basic cosmetics

### 26.3 Post-MVP Features

- more regions
- more classes
- expanded skill trees
- chained winner rounds
- season pass
- richer puzzle systems
- social features
- spectating
- ranked systems
- advanced AI
- guilds and clans
- narrative progression scenes

## 27. Content Roadmap Suggestion

### Phase 1: Prototype

- movement
- room transitions
- door timers
- one enemy
- one weapon type
- chest interaction
- simple procedural maze

### Phase 2: Vertical Slice

- one region theme
- basic combat loop
- merchant
- boss room
- temporary progression
- PvP enabled
- hazard mechanic

### Phase 3: MVP

- account system
- matchmaking
- cosmetics
- account rewards
- network stability
- polished UI
- basic live analytics

### Phase 4: Expansion

- more content
- more classes
- more regions
- winner chaining
- seasonal systems

## 28. Risks

### 28.1 Major Risks

- browser multiplayer performance
- scope creep
- solo developer overload
- balancing PvP and PvE
- procedural content feeling repetitive
- netcode complexity
- cheating if the client is trusted too much

### 28.2 Mitigation

- keep the server authoritative
- reduce MVP class and item count
- focus on one highly replayable loop
- test generation tools early
- keep visuals readable and lightweight
- prioritize deterministic or simple combat rules

## 29. Open Questions / NTBD

- exact class roster
- exact combat targeting model
- exact maze size rules
- how winner chaining is implemented technically
- whether players spawn simultaneously or staggered
- amount of social features at launch
- puzzle complexity for a browser audience
- anti-cheat scope for MVP
- art production pipeline
- audio content budget

## 30. Final Product Vision

Maze Adventure Game aims to deliver a tense, replayable browser PvPvE
experience where players navigate dangerous procedural mazes, make uneasy
alliances, betray each other when necessary, and push toward a central
objective under constant pressure. The long-term identity of the game is a mix
of:

- survival tension
- readable action combat
- roguelite session structure
- social mind games
- mythic fantasy spectacle
- lightweight but scalable web delivery
