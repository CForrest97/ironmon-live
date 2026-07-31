# GitHub settings

The versioned workflows and ruleset payload express repository policy. Apply
remote settings with `npm run configure:github -- OWNER` after installing and
authenticating the GitHub CLI.

The script creates or connects the public `ironmon-live` repository, pushes the
initial `main` branch, enables squash-only merging and branch cleanup, restricts
Actions to SHA-pinned GitHub-owned actions, gives the workflow token read-only
permissions, disables GitHub Issues, and creates the `main` ruleset.

The ruleset does not require a fixed approval count because this is a solo
repository and an author cannot approve their own pull request. It also does
not enable automatic merging. `AGENTS.md` supplies the conditional gate: an
independent read-only reviewer rates every agent-authored change, and material
or uncertain changes stop for human approval.

Run it only after `quality` has completed successfully in the GitHub repository,
because GitHub requires a status check to exist before it can be selected as a
required check.
