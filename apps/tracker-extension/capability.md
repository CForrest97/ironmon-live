# IronMON Tracker Lua Extension Capabilities

Lua extensions can read live game data, react to tracker events, write files and settings, and access lower-level tracker state where needed.

## Extension lifecycle and event hooks

An extension can run code:

- Before game data loads: `beforeGameDataLoad()`
- When enabled: `startup()`
- When disabled: `unload()`
- Every frame: `afterEachFrame()`
- Every 30 frames after general game data updates: `afterProgramDataUpdate()`
- Every 30 frames during battles: `afterBattleDataUpdate()`
- After tracker redraws: `afterRedraw()`
- When a battle starts or ends: `afterBattleBegins()`, `afterBattleEnds()`
- Before Tracker UI buttons are processed: `onButtonClicked(button)`
- Every frame for emulator-specific input:
  - BizHawk: `inputCheckBizhawk()`
  - mGBA: `inputCheckMGBA()`

## ROM, emulator, and run-level data

- ROM/game name: `GameSettings.gamename`
- Game code: `GameSettings.gamecode`
- Full ROM/version label: `GameSettings.fullVersionName`
- Game/version group: `GameSettings.versiongroup`
- Tracker version: `Main.TrackerVersion` / `Main.Version`
- Current tracker message/status: `Tracker.DataMessage`
- Game-started state: `TrackerAPI.hasGameStarted()`
- Game-over state: `GameOverScreen.status`
- Tracker timer / pause state: `Program.GameTimer`
- Tracker-recorded playtime: `Tracker.Data.playtime`

## Player and opponent Pokemon

For each player-party or enemy-party slot:

- Species ID and name
- Nickname
- Level
- Current and maximum HP
- Major stats: HP, Attack, Defence, Sp. Atk, Sp. Def, Speed
- Stat stages: Attack through Evasion/Accuracy
- Types, including live battle changes
- Status condition
- Ability / ability slot
- Move IDs, PP, and learned-level data
- Held item
- IVs and EVs
- Nature
- Friendship
- Experience
- Gender
- Shiny state
- PokeRus state

Relevant APIs:

- `TrackerAPI.getPlayerPokemon(slot)`
- `TrackerAPI.getEnemyPokemon(slot)`
- `TrackerAPI.getActiveBattlePokemon()`
- `TrackerAPI.getPokemonTypes(isPlayer, isOnLeft)`
- `TrackerAPI.getAbilityIdOfPokemon(pokemon)`
- `TrackerAPI.isShiny(slot, isEnemy)`
- `TrackerAPI.hasPokerus(slot, isEnemy)`

## Battle data

- Whether a battle is active
- Wild versus trainer battle
- Single versus double battle
- Active combatants
- Opponent trainer ID
- Opponent trainer name, class, party, moves, held items, and battle items
- Battle outcome: in progress, won, lost, fled, or caught

Relevant APIs:

- `TrackerAPI.inActiveBattle()`
- `TrackerAPI.getOpponentTrainerId()`
- `TrackerAPI.getTrainerGameData(trainerId)`
- `TrackerAPI.getBattleOutcome()`

## Location, routes, and trainers

- Current map ID
- Route/area name and route metadata
- Trainers associated with the current route
- Trainer class, name, portrait, gender, party size, battle items, and double-battle flag
- Whether each trainer is defeated
- Each route trainer's party, including Pokemon, levels, IVs, moves, and held items
- Gym TM/HM rewards

Relevant APIs:

- `TrackerAPI.getMapId()`
- `TrackerAPI.getRouteInfo(routeId)`
- `TrackerAPI.getTrainersOnRoute(routeId)`
- `TrackerAPI.getTrainerInfo(trainerId)`
- `TrackerAPI.hasDefeatedTrainer(trainerId)`
- `TrackerAPI.getGymTMs(gymNumber)`

### Not natively available

The tracker does not currently expose overworld item-ball/hidden-item locations or whether a particular overworld item has been collected.

## Inventory and items

- Player bag contents grouped by category
- Item ID and quantity
- Localized item names
- TM/HM number-to-move mapping
- Pokemon and trainer held items

Relevant APIs:

- `TrackerAPI.getBagItems()`
- `TrackerAPI.getItemName(itemId, ignoreLanguage)`
- `TrackerAPI.getMoveIdFromTMHMNumber(tmhmNumber, isHM)`

## Progress and gameplay counters

- Badge list
- Centre-heal count: `Tracker.Data.centerHeals`
- Tracked playtime: `Tracker.Data.playtime`
- Wild battle count: `Program.GameData.wildBattles`
- Trainer battle count: `Program.GameData.trainerBattles`
- Fishing count: `Tracker.Data.gameStatsFishing`
- Rock Smash count: `Tracker.Data.gameStatsRockSmash`
- Encounter notes/history and other tracker-maintained data via `Tracker.Data`

## Static game-data lookups

The extension can query the tracker’s loaded data tables for:

- Pokemon names, types, base stats, abilities, and static attributes
- Move names, types, category, power, accuracy, PP, and descriptions
- Ability names and descriptions
- Route definitions
- Trainer definitions
- Localized text/resources
- Item names
- Current Tracker options and theme

Relevant APIs:

- `TrackerAPI.getPokemonInfo(pokemonId)`
- `TrackerAPI.getMoveInfo(moveId)`
- `TrackerAPI.getAbilityInfo(abilityId)`
- `TrackerAPI.getRouteInfo(routeId)`
- `TrackerAPI.getTrainerInfo(trainerId)`
- `TrackerAPI.getOption(key)`
- `TrackerAPI.getTheme(themeName)`
- `TrackerAPI.getLanguage(language)`

## Randomizer-log data

When a randomizer log is loaded, an extension can inspect `RandomizerLog.Data` for:

- Randomized wild encounters by route and encounter method
- Randomized trainer parties
- Randomized Pokemon types, abilities, movesets, and evolutions
- TM move mappings and compatibility
- Randomizer seed, version, settings string, and target game
- Pickup ability item table

This data is spoiler-sensitive and should only be exported with an explicit user opt-in.

## File, JSON, settings, and extension management

An extension can:

- Read/write local files and JSON using `FileManager`
- Export data, as the React Companion does to `react-companion-state.json`
- Persist its own string, number, and boolean settings
- Read other extensions' objects and enabled state
- Declare extension dependencies
- Change Tracker screen, language, theme, and options
- Load custom ROM address definitions / Tracker overrides from JSON
- Install or update extensions from GitHub

Relevant APIs:

- `TrackerAPI.saveExtensionSetting()` / `TrackerAPI.getExtensionSetting()`
- `TrackerAPI.isExtensionEnabled()` / `TrackerAPI.getExtensionSelf()`
- `TrackerAPI.changeScreen()`
- `TrackerAPI.setOption()`, `TrackerAPI.setTheme()`, `TrackerAPI.setLanguage()`
- `TrackerAPI.loadGameSettingsFromJson()`
- `TrackerAPI.loadTrackerOverridesFromJson()`
- `TrackerAPI.installNewExtension()` / `TrackerAPI.updateExtension()`

## Existing React Companion export

`extensions/ReactCompanion.lua` currently exports a spoiler-safe subset to `react-companion-state.json`:

- ROM metadata and tracker status
- Player party, enemy party, and battle state
- Current location and route trainers
- Bag inventory
- Playtime, badges, heals, and gameplay counters
- Tracker-known encounter data
