#!/usr/bin/env bash

set -euo pipefail

readonly DEV_HOST="127.0.0.1"
readonly DEV_PORT="${IRONMON_LIVE_DEV_PORT:-5174}"
readonly DEV_URL="http://${DEV_HOST}:${DEV_PORT}"
readonly READY_URL="${DEV_URL}/api/channels/00000/snapshot"
readonly DEV_STATE_DIR=".ironmon-live"
readonly DEV_CONFIG="${DEV_STATE_DIR}/dev-config.json"
readonly TRACKER_OUTPUT_DIR="${HOME}/.ironmon-live"
readonly TRACKER_INPUT="${TRACKER_OUTPUT_DIR}/tracker.json"

web_pid=""
companion_pid=""

stop_processes() {
	if [[ -n "${companion_pid}" ]]; then kill "${companion_pid}" 2>/dev/null || true; fi
	if [[ -n "${web_pid}" ]]; then kill "${web_pid}" 2>/dev/null || true; fi
	wait 2>/dev/null || true
}

trap stop_processes EXIT INT TERM

mkdir -p "${TRACKER_OUTPUT_DIR}"
npm run build:cli --workspace=@ironmon-live/companion
npm run dev --workspace=@ironmon-live/web -- --host "${DEV_HOST}" --port "${DEV_PORT}" --strictPort &
web_pid=$!

for _ in {1..60}; do
	if curl --fail --silent "${READY_URL}" >/dev/null; then break; fi
	if ! kill -0 "${web_pid}" 2>/dev/null; then
		echo "The local web server stopped before becoming ready." >&2
		exit 1
	fi
	sleep 0.25
done

if ! curl --fail --silent "${READY_URL}" >/dev/null; then
	echo "The local web server did not become ready at ${DEV_URL}." >&2
	exit 1
fi

node apps/companion/dist/cli.js \
	--config "${DEV_CONFIG}" \
	--input "${TRACKER_INPUT}" \
	--url "${DEV_URL}" &
companion_pid=$!

echo "IronMON Live development environment: ${DEV_URL}"
while kill -0 "${web_pid}" 2>/dev/null && kill -0 "${companion_pid}" 2>/dev/null; do
	sleep 1
done

if ! kill -0 "${web_pid}" 2>/dev/null; then wait "${web_pid}"; fi
if ! kill -0 "${companion_pid}" 2>/dev/null; then wait "${companion_pid}"; fi
