import type { NewIssueInput } from '../services'

/**
 * Offline submit queue. A citizen at a real incident is often on a dead/2G
 * connection; if createIssue() fails while offline we persist the report here
 * and replay it when connectivity returns (flushed on the `online` event and on
 * app start). Media are already downscaled data URLs (see lib/image.ts), so a
 * queued report is self-contained in localStorage.
 */
const KEY = 'janvyuha.outbox.v1'

export interface OutboxItem {
  id: string
  input: NewIssueInput
  queuedAt: string
}

function read(): OutboxItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function write(items: OutboxItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /* quota exceeded — nothing safe to do; the caller already has the data */
  }
}

/** Queue a report for later delivery. Returns the stored item (with its id). */
export function enqueue(input: NewIssueInput): OutboxItem {
  const item: OutboxItem = {
    id: 'ob_' + Math.random().toString(36).slice(2, 10),
    input,
    queuedAt: new Date().toISOString(),
  }
  write([...read(), item])
  return item
}

export function outboxCount(): number {
  return read().length
}

/**
 * Try to deliver every queued report, oldest first, via the provided create fn.
 * Stops at the first failure (still offline / server down) and leaves the rest
 * queued. Returns how many were successfully sent.
 */
export async function flushOutbox(
  create: (input: NewIssueInput) => Promise<unknown>
): Promise<number> {
  let sent = 0
  for (const item of read()) {
    try {
      await create(item.input)
    } catch {
      break // keep this and the remaining items for the next attempt
    }
    write(read().filter((i) => i.id !== item.id))
    sent++
  }
  return sent
}
