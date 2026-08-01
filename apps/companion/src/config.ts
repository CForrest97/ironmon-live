import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { randomInt } from "node:crypto";
import { isChannelCode } from "@ironmon-live/contracts";

export type CompanionConfig = {
  readonly channelCode: string;
  readonly inputPath: string;
  readonly publishUrl: string;
};

export const defaultConfigPath = join(homedir(), ".ironmon-live", "config.json");
const defaultInputPath = join(homedir(), ".ironmon-live", "tracker.json");
const defaultPublishUrl = "https://ironmon.live";

const generateChannelCode = () => randomInt(0, 100_000).toString().padStart(5, "0");

export const createDefaultConfig = (): CompanionConfig => ({
  channelCode: generateChannelCode(),
  inputPath: defaultInputPath,
  publishUrl: defaultPublishUrl,
});

export const saveConfig = async (path: string, config: CompanionConfig) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
};

export const loadConfig = async (path = defaultConfigPath): Promise<CompanionConfig> => {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as Partial<CompanionConfig>;
    if (
      !parsed.channelCode ||
      !isChannelCode(parsed.channelCode) ||
      !parsed.inputPath ||
      !parsed.publishUrl
    ) {
      throw new Error(`invalid companion configuration at ${path}`);
    }
    return parsed as CompanionConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const config = createDefaultConfig();
    await saveConfig(path, config);
    return config;
  }
};

export const resetChannelCode = async (path = defaultConfigPath) => {
  const config = await loadConfig(path);
  const replacement = { ...config, channelCode: generateChannelCode() };
  await saveConfig(path, replacement);
  return replacement.channelCode;
};
