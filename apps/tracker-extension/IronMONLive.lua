local function IronMONLive()
	local self = {}
	self.version = "0.1.0"
	self.name = "IronMON Live"
	self.author = "IronMON Live"
	self.description = "Exports Tracker state for the IronMON Live companion."
	self.requiredExtKeys = {}

	local SCHEMA_VERSION = 1
	local WRITE_INTERVAL_SECONDS = 2
	local OUTPUT_FILE = "tracker.json"
	local TEMP_FILE = OUTPUT_FILE .. ".tmp"
	local lastPayload = nil
	local lastWriteAt = 0
	local forceWrite = true
	local active = false

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

	local function nonEmptyString(value, fallback)
		if value == nil or tostring(value) == "" then return fallback end
		return tostring(value)
	end

	local function numericRecord(source, keys)
		if type(source) ~= "table" then return unavailable() end
		local result = {}
		for _, key in ipairs(keys) do
			result[key] = tonumber(source[key]) or 0
		end
		return available(result)
	end

	local function pokemonTypes(pokemon, info)
		local source = pokemon.types or info.types
		if type(source) ~= "table" then return unavailable() end
		local result = {}
		for _, pokemonType in ipairs(source) do
			if pokemonType and pokemonType ~= "" then
				table.insert(result, tostring(pokemonType))
			end
		end
		return available(result)
	end

	local function pokemonMoves(pokemon)
		if type(pokemon.moves) ~= "table" then return unavailable() end
		local result = {}
		for _, move in ipairs(pokemon.moves) do
			local moveId = move and tonumber(move.id) or 0
			if moveId > 0 then
				local info = TrackerAPI.getMoveInfo(moveId) or {}
				table.insert(result, nonEmptyString(info.name, "Unknown move"))
			end
		end
		return available(result)
	end

	local function partyMember(pokemon)
		if not pokemon or (pokemon.pokemonID or 0) <= 0 then return nil end
		local info = TrackerAPI.getPokemonInfo(pokemon.pokemonID) or {}
		local statKeys = { "hp", "atk", "def", "spa", "spd", "spe" }
		return {
			id = tostring(pokemon.pokemonID),
			name = nonEmptyString(info.name, nonEmptyString(pokemon.nickname, "Unknown Pokemon")),
			types = pokemonTypes(pokemon, info),
			ivs = numericRecord(pokemon.ivs, statKeys),
			evs = numericRecord(pokemon.evs, statKeys),
			stats = numericRecord(pokemon.stats, statKeys),
			moves = pokemonMoves(pokemon),
		}
	end

	local function party()
		local result = {}
		for slot = 1, 6 do
			local member = partyMember(TrackerAPI.getPlayerPokemon(slot))
			if member then table.insert(result, member) end
		end
		return result
	end

	local function route()
		local mapId = TrackerAPI.getMapId()
		local info = TrackerAPI.getRouteInfo(mapId) or {}
		local name = info.name or info.area
		if not name or name == "" then return unavailable() end

		local trainers = {}
		local completed = 0
		for index, trainer in ipairs(TrackerAPI.getTrainersOnRoute(mapId) or {}) do
			if trainer then
				local defeated = trainer.defeated
				if defeated == true then completed = completed + 1 end
				table.insert(trainers, {
					id = tostring(trainer.trainerId or index),
					name = nonEmptyString(trainer.trainerName, "Unknown trainer"),
					battled = type(defeated) == "boolean" and available(defeated) or unavailable(),
				})
			end
		end

		return available({
			name = name,
			trainers = trainers,
			completed = completed,
			total = #trainers,
		})
	end

	local function runStatus()
		if GameOverScreen.status == GameOverScreen.Statuses.LOST then return "game_over" end
		if GameOverScreen.status == GameOverScreen.Statuses.WON then return "completed" end
		if not TrackerAPI.hasGameStarted() then return "startup" end
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
			party = party(),
			route = route(),
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
