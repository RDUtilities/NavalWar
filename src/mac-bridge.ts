import { OfflineSession } from "./offline-session.js";

let session: OfflineSession | null = null;

/** The native host sends JSON and receives JSON; no browser or Node APIs are used. */
export function dispatch(json: string): string {
  try {
    const request = JSON.parse(json);
    if (request?.type === "new") {
      const next = new OfflineSession(request.setup);
      session = next;
      return JSON.stringify({ ok: true, view: session.view() });
    }
    if (request?.type === "restore") {
      const next = OfflineSession.restore(request.save);
      session = next;
      return JSON.stringify({ ok: true, view: session.view() });
    }
    if (!session) throw new Error("Start or restore a game first.");
    switch (request?.type) {
      case "view": return JSON.stringify({ ok: true, view: session.view() });
      case "command": return JSON.stringify({ ok: true, view: session.command(request.command) });
      case "bot_step": return JSON.stringify({ ok: true, view: session.botStep() });
      case "next_round": return JSON.stringify({ ok: true, view: session.nextRound() });
      case "save": return JSON.stringify({ ok: true, save: session.save() });
      default: throw new Error("Unknown Mac bridge request.");
    }
  } catch (error) {
    return JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
