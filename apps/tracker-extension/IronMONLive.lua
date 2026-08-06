local function IronMONLive()
	local self = {}
	self.version = "0.2.0"
	self.name = "IronMON Live 2"
	self.author = "IronMON Live"
	self.description = "Exports Tracker state for the IronMON Live companion."
	self.requiredExtKeys = {}

	local SCHEMA_VERSION = 2
	local WRITE_INTERVAL_SECONDS = 2
	local OUTPUT_FILE = "tracker.json"
	local TEMP_FILE = OUTPUT_FILE .. ".tmp"
	local lastPayload = nil
	local lastWriteAt = 0
	local forceWrite = true
	local active = false

	local STAT_KEYS = { "hp", "atk", "def", "spa", "spd", "spe" }
	local STAGE_KEYS = { "atk", "def", "spa", "spd", "spe", "acc", "eva" }

	local function defaultOutputDirectory()
		local home = os.getenv("HOME") or os.getenv("USERPROFILE")
		if not home or home == "" then return nil end
		local separator = os.getenv("HOME") and "/" or "\\"
		return home .. separator .. ".ironmon-live" .. separator
	end

	local function outputPath(filename)
		local directory = defaultOutputDirectory()
		if directory then return directory .. filename end
		return FileManager.prependDir(filename)
	end

	local function observedAt()
		return os.date("!%Y-%m-%dT%H:%M:%SZ")
	end

	local function available(value)
		return { availability = "available", value = value }
	end

	local function unavailable()
		return { availability = "unavailable" }
	end

	local function availableString(value)
		if value == nil then return unavailable() end
		value = tostring(value)
		if value == "" then return unavailable() end
		return available(value)
	end

	local function availableNumber(value)
		if type(value) ~= "number" then return unavailable() end
		return available(value)
	end

	local function availableBoolean(value)
		if type(value) ~= "boolean" then return unavailable() end
		return available(value)
	end

	local function nonEmptyString(value, fallback)
		if value == nil or tostring(value) == "" then return fallback end
		return tostring(value)
	end

	local function numericRecord(source, keys)
		if type(source) ~= "table" then return unavailable() end
		local result = {}
		for _, key in ipairs(keys) do
			if type(source[key]) ~= "number" then return unavailable() end
			result[key] = source[key]
		end
		return available(result)
	end

	-- Trainer party data stores one fixed IV that applies to every stat. The v2
	-- contract represents IVs as a named numeric record, so expand it here.
	local function repeatedNumberRecord(value, keys)
		if type(value) ~= "number" then return unavailable() end
		local result = {}
		for _, key in ipairs(keys) do
			result[key] = value
		end
		return available(result)
	end

	local function pokemonTypes(pokemon, info)
		local source = pokemon.types or info.types
		if type(source) ~= "table" then return unavailable() end
		local result = {}
		for _, pokemonType in ipairs(source) do
			if pokemonType and tostring(pokemonType) ~= "" then
				table.insert(result, tostring(pokemonType))
			end
		end
		return available(result)
	end

	local function moveMember(move)
		local moveId = move and tonumber(move.id) or 0
		if moveId <= 0 then return nil end
		local info = TrackerAPI.getMoveInfo(moveId) or {}
		return {
			id = tostring(moveId),
			name = nonEmptyString(info.name, "Unknown move"),
			pp = availableNumber(move.pp),
		}
	end

	local function pokemonMoves(pokemon)
		if type(pokemon.moves) ~= "table" then return unavailable() end
		local result = {}
		for _, move in ipairs(pokemon.moves) do
			local member = moveMember(move)
			if member then table.insert(result, member) end
		end
		return available(result)
	end

	local function gender(pokemon)
		if pokemon.gender == MiscData.Gender.MALE then return available("male") end
		if pokemon.gender == MiscData.Gender.FEMALE then return available("female") end
		if pokemon.gender == MiscData.Gender.UNKNOWN then return available("unknown") end
		return unavailable()
	end

	local function pokemonStatus(pokemon)
		local status = MiscData.StatusCodeMap[pokemon.status]
		if not status then return unavailable() end
		if status == "" then return available("healthy") end
		return available(status)
	end

	local function pokemonAbility(pokemon)
		local abilityId = TrackerAPI.getAbilityIdOfPokemon(pokemon)
		if not abilityId or abilityId <= 0 then return unavailable() end
		local info = TrackerAPI.getAbilityInfo(abilityId) or {}
		return availableString(info.name)
	end

	local function heldItem(pokemon)
		local itemId = tonumber(pokemon.heldItem) or 0
		if itemId <= 0 then return unavailable() end
		return availableString(TrackerAPI.getItemName(itemId))
	end

	-- pokemonID is the Gen III internal Dex number. speciesId is consumed by
	-- PokéAPI, which expects the National Dex number (for example, Swellow is
	-- internal ID 305 and National Dex ID 277).
	local function nationalDexId(pokemonId)
		if not PokemonData or type(PokemonData.dexMapInternalToNational) ~= "function" then
			return unavailable()
		end
		local nationalId = tonumber(PokemonData.dexMapInternalToNational(pokemonId)) or 0
		if nationalId <= 0 then return unavailable() end
		return available(tostring(nationalId))
	end

	local function partyMember(pokemon)
		if not pokemon or (pokemon.pokemonID or 0) <= 0 then return nil end
		local pokemonId = tonumber(pokemon.pokemonID) or 0
		local info = TrackerAPI.getPokemonInfo(pokemonId) or {}
		local nature = MiscData.Natures[(pokemon.nature or -1) + 1]
		return {
			id = tostring(pokemonId),
			name = nonEmptyString(pokemon.nickname, nonEmptyString(info.name, "Unknown Pokemon")),
			speciesId = nationalDexId(pokemonId),
			level = availableNumber(pokemon.level),
			currentHp = availableNumber(pokemon.curHP),
			maximumHp = availableNumber((pokemon.stats or {}).hp),
			types = pokemonTypes(pokemon, info),
			status = pokemonStatus(pokemon),
			ability = pokemonAbility(pokemon),
			heldItem = heldItem(pokemon),
			moves = pokemonMoves(pokemon),
			stats = numericRecord(pokemon.stats, STAT_KEYS),
			baseStats = numericRecord(info.baseStats, STAT_KEYS),
			statStages = numericRecord(pokemon.statStages, STAGE_KEYS),
			ivs = numericRecord(pokemon.ivs, STAT_KEYS),
			evs = numericRecord(pokemon.evs, STAT_KEYS),
			nature = availableString(nature),
			experience = availableNumber(pokemon.currentExp),
			friendship = availableNumber(pokemon.friendship),
			gender = gender(pokemon),
			shiny = availableBoolean(pokemon.isShiny),
			pokerus = availableBoolean(pokemon.hasPokerus),
		}
	end

	local function playerParty()
		local result = {}
		for slot = 1, 6 do
			local member = partyMember(TrackerAPI.getPlayerPokemon(slot))
			if member then table.insert(result, member) end
		end
		return result
	end

	local function trainerPartyMember(pokemon)
		if not pokemon or (pokemon.pokemonID or 0) <= 0 then return nil end
		local pokemonId = tonumber(pokemon.pokemonID) or 0
		local info = TrackerAPI.getPokemonInfo(pokemonId) or {}
		local moves = {}
		if type(pokemon.moves) == "table" then
			for _, moveId in ipairs(pokemon.moves) do
				moveId = tonumber(moveId) or 0
				if moveId > 0 then
					local moveInfo = TrackerAPI.getMoveInfo(moveId) or {}
					table.insert(moves, {
						id = tostring(moveId),
						name = nonEmptyString(moveInfo.name, "Unknown move"),
						pp = unavailable(),
					})
				end
			end
		end
		return {
			id = tostring(pokemonId),
			name = nonEmptyString(info.name, "Unknown Pokemon"),
			speciesId = nationalDexId(pokemonId),
			level = availableNumber(pokemon.level),
			currentHp = unavailable(),
			maximumHp = unavailable(),
			types = pokemonTypes(pokemon, info),
			status = unavailable(),
			ability = unavailable(),
			heldItem = heldItem(pokemon),
			moves = #moves > 0 and available(moves) or unavailable(),
			stats = unavailable(),
			baseStats = numericRecord(info.baseStats, STAT_KEYS),
			statStages = unavailable(),
			ivs = repeatedNumberRecord(pokemon.ivs, STAT_KEYS),
			evs = unavailable(),
			nature = unavailable(),
			experience = unavailable(),
			friendship = unavailable(),
			gender = unavailable(),
			shiny = unavailable(),
			pokerus = unavailable(),
		}
	end

	local function trainerMember(trainer, fallbackId)
		if type(trainer) ~= "table" then return nil end
		local trainerId = tonumber(trainer.trainerId) or tonumber(fallbackId) or 0
		if trainerId <= 0 then return nil end
		local party = {}
		if type(trainer.party) == "table" then
			for _, pokemon in ipairs(trainer.party) do
				local member = trainerPartyMember(pokemon)
				if member then table.insert(party, member) end
			end
		end
		local battleItems = {}
		if type(trainer.items) == "table" then
			for _, itemId in ipairs(trainer.items) do
				itemId = tonumber(itemId) or 0
				if itemId > 0 then
					local itemName = TrackerAPI.getItemName(itemId)
					if itemName and itemName ~= "" then table.insert(battleItems, itemName) end
				end
			end
		end
		return {
			id = tostring(trainerId),
			name = nonEmptyString(trainer.trainerName, "Unknown trainer"),
			trainerClass = availableString(trainer.trainerClass),
			portraitId = availableString(trainer.trainerPic),
			battled = availableBoolean(trainer.defeated),
			party = type(trainer.party) == "table" and available(party) or unavailable(),
			battleItems = type(trainer.items) == "table" and available(battleItems) or unavailable(),
			doubleBattle = availableBoolean(trainer.doubleBattle),
		}
	end

	local function route()
		local mapId = TrackerAPI.getMapId()
		local info = TrackerAPI.getRouteInfo(mapId) or {}
		local name = info.name or info.area
		if not name or name == "" then return unavailable() end

		local trainers = {}
		local completed = 0
		for index, trainer in ipairs(TrackerAPI.getTrainersOnRoute(mapId) or {}) do
			local member = trainerMember(trainer, index)
			if member then
				if trainer.defeated == true then completed = completed + 1 end
				table.insert(trainers, member)
			end
		end

		return available({
			name = name,
			trainers = trainers,
			completed = completed,
			total = #trainers,
		})
	end

	local function location()
		local mapId = TrackerAPI.getMapId()
		local info = TrackerAPI.getRouteInfo(mapId) or {}
		local name = info.name or info.area
		if not name or name == "" then return unavailable() end
		return available({
			name = name,
			mapId = mapId > 0 and available(tostring(mapId)) or unavailable(),
		})
	end

	local function battleOutcome()
		local outcome = TrackerAPI.getBattleOutcome()
		local outcomes = {
			[0] = "in_progress",
			[1] = "won",
			[2] = "lost",
			[4] = "fled",
			[7] = "caught",
		}
		return availableString(outcomes[outcome])
	end

	local function battle()
		if not TrackerAPI.inActiveBattle() then return available({ active = false }) end
		local player, opponents = {}, {}
		local leftPlayer = partyMember(TrackerAPI.getPlayerPokemon(Battle.Combatants.LeftOwn))
		local leftOpponent = partyMember(TrackerAPI.getEnemyPokemon(Battle.Combatants.LeftOther))
		if leftPlayer then table.insert(player, leftPlayer) end
		if leftOpponent then table.insert(opponents, leftOpponent) end
		if (Battle.numBattlers or 0) > 2 then
			local rightPlayer = partyMember(TrackerAPI.getPlayerPokemon(Battle.Combatants.RightOwn))
			local rightOpponent = partyMember(TrackerAPI.getEnemyPokemon(Battle.Combatants.RightOther))
			if rightPlayer then table.insert(player, rightPlayer) end
			if rightOpponent then table.insert(opponents, rightOpponent) end
		end
		local trainerId = TrackerAPI.getOpponentTrainerId()
		local trainer = trainerId > 0 and trainerMember(TrackerAPI.getTrainerGameData(trainerId), trainerId) or nil
		return available({
			active = true,
			kind = trainerId > 0 and "trainer" or "wild",
			format = (Battle.numBattlers or 0) > 2 and "double" or "single",
			player = player,
			opponents = opponents,
			trainer = trainer and available(trainer) or unavailable(),
			outcome = battleOutcome(),
		})
	end

	local function badgeNames()
		local result = {}
		for index, obtained in ipairs(TrackerAPI.getBadgeList() or {}) do
			if obtained == true then table.insert(result, "badge-" .. tostring(index)) end
		end
		return available(result)
	end

	local function progress()
		local timerText = Program.GameTimer and Program.GameTimer:getText() or nil
		return available({
			romName = availableString(GameSettings.gamename),
			gameCode = availableString(GameSettings.gamecode),
			trackerVersion = availableString(Main.TrackerVersion),
			timer = availableString(timerText),
			paused = availableBoolean(Program.GameTimer and Program.GameTimer.isPaused),
			playtime = availableString(timerText),
			badges = badgeNames(),
			centreHeals = availableNumber(Tracker.Data.centerHeals),
			wildBattles = availableNumber(Program.GameData.wildBattles),
			trainerBattles = availableNumber(Program.GameData.trainerBattles),
			fishing = availableNumber(Tracker.Data.gameStatsFishing),
			rockSmash = availableNumber(Tracker.Data.gameStatsRockSmash),
		})
	end

	local function runStatus()
		if GameOverScreen.status == GameOverScreen.Statuses.LOST then return "game_over" end
		if GameOverScreen.status == GameOverScreen.Statuses.WON then return "completed" end
		if not TrackerAPI.hasGameStarted() then return "startup" end
		if TrackerAPI.inActiveBattle() then return "battle" end
		return "active"
	end

	local function unsupportedReason()
		if GameSettings.gamename == nil then return "no ROM is loaded" end
		if GameSettings.gamename == "Unsupported Game" then return "the loaded game is unsupported" end
		return nil
	end

	local function buildMessage()
		local reason = unsupportedReason()
		if reason then
			return {
				kind = "unsupported",
				schemaVersion = SCHEMA_VERSION,
				observedAt = observedAt(),
				reason = reason,
			}
		end
		return {
			kind = "snapshot",
			schemaVersion = SCHEMA_VERSION,
			observedAt = observedAt(),
			status = runStatus(),
			party = playerParty(),
			location = location(),
			battle = battle(),
			route = route(),
			progress = progress(),
		}
	end

	local function writeMessage(message)
		local tempPath = outputPath(TEMP_FILE)
		local finalPath = outputPath(OUTPUT_FILE)
		if not FileManager.encodeToJsonFile(tempPath, message) then return false end
		local renamed, errorMessage = os.rename(tempPath, finalPath)
		if not renamed then
			os.remove(finalPath)
			renamed, errorMessage = os.rename(tempPath, finalPath)
		end
		if not renamed then
			print("IronMON Live export failed: " .. tostring(errorMessage))
			return false
		end
		return true
	end

	local function writeCurrentMessage(force)
		if not active or not FileManager.JsonLibrary then return end
		local now = os.time()
		local message = buildMessage()
		local comparable = FileManager.copyTable(message)
		comparable.observedAt = ""
		local encoded = FileManager.JsonLibrary.encode(comparable) or ""
		if not force and encoded == lastPayload and (now - lastWriteAt) < WRITE_INTERVAL_SECONDS then
			return
		end
		if writeMessage(message) then
			lastPayload = encoded
			lastWriteAt = now
		end
	end

	function self.startup()
		active = true
		forceWrite = true
		writeCurrentMessage(true)
	end

	function self.unload()
		if active then
			writeMessage({
				kind = "unsupported",
				schemaVersion = SCHEMA_VERSION,
				observedAt = observedAt(),
				reason = "the Tracker extension was unloaded",
			})
		end
		active = false
	end

	function self.afterProgramDataUpdate()
		writeCurrentMessage(forceWrite)
		forceWrite = false
	end

	function self.afterBattleDataUpdate() writeCurrentMessage(false) end
	function self.afterBattleBegins() forceWrite = true; writeCurrentMessage(true) end
	function self.afterBattleEnds() forceWrite = true; writeCurrentMessage(true) end

	return self
end

return IronMONLive
