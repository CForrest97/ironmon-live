/**
 * Shared CLI argument parsing for the visual-review scripts. Accepts both
 * `--flag value` and `--flag=value` — npm's own `--` forwarding convention
 * doesn't imply only one form is valid, and users reasonably type either.
 */

export const readValues = (args: readonly string[], flag: string): readonly string[] => {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === flag) {
      const next = args[index + 1];
      if (next !== undefined && !next.startsWith("--")) {
        values.push(next);
        index += 1;
      }
      continue;
    }
    if (arg?.startsWith(`${flag}=`)) values.push(arg.slice(flag.length + 1));
  }
  return values;
};

export const readValue = (args: readonly string[], flag: string): string | undefined =>
  readValues(args, flag).at(-1);

export const hasFlag = (args: readonly string[], flag: string): boolean => args.includes(flag);
