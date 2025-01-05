import type { BaileysEventMap, WASocket } from '@whiskeysockets/baileys';

export type EventHandler = (
  sock: WASocket,
  e: Partial<BaileysEventMap>,
) => Promise<void> | void;
