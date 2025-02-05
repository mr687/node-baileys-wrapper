import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import {
  type AnyMessageContent,
  Browsers,
  delay,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  makeCacheableSignalKeyStore,
  makeWASocket,
  useMultiFileAuthState,
  type WASocket,
} from '@whiskeysockets/baileys';
import P from 'pino';
import type { EventHandler } from './dto/event.dto';
import fs from 'fs';
import { join } from 'path';
import NodeCache from 'node-cache';

@Injectable()
export class WhatsappBaileys
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private _handlers: EventHandler[] = [];
  private _qrRetry: number = 0;
  private _retryConnection = 0;
  private _restartRequired = false;
  private _connectionLocked = false;
  private sock: WASocket | undefined;
  private readonly stateFilePath = join(process.cwd(), 'baileys_auth_states');
  private readonly logger = new Logger(WhatsappBaileys.name);
  private readonly msgRetryCounterCache = new NodeCache();
  private readonly pinoLogger = P({
    timestamp: () => `,"time":"${new Date().toJSON()}"`,
  });

  constructor() {
    this.sock = undefined;
    this.pinoLogger.level = 'info';

    this._handlers.push();
  }

  async onApplicationBootstrap() {
    if (this.sock) return;

    await this.connect();
    await this.sock!.waitForSocketOpen();

    let connected = false;
    await this.sock!.waitForConnectionUpdate((u) => {
      if (u.qr) {
        connected = false;
      } else if (u.connection === 'open') {
        connected = true;
      }
      return true;
    }, 2_000);
    if (!connected) {
      await this.close();
    }
  }

  async onApplicationShutdown() {
    this.logger.log('Baileys shutdown...');
    await this.close();
  }

  async sendMessageWithTyping(jid: string, msg: AnyMessageContent) {
    if (!this.sock) return;
    await this.sock.presenceSubscribe(jid);

    await delay(500);

    await this.sock.sendPresenceUpdate('composing', jid);
    await delay(2010);

    await this.sock.sendPresenceUpdate('paused', jid);

    return this.sendMessage(jid, msg);
  }

  async sendMessage(jid: string, msg: AnyMessageContent) {
    if (!this.sock) return;

    return this.sock.sendMessage(jid, msg);
  }

  addHandler(handler: EventHandler) {
    this._handlers.push(handler);
  }

  getSocket(): WASocket {
    return this.sock!;
  }

  async connect() {
    if (this.sock && !this._restartRequired) return;
    if (this._connectionLocked) return;

    if (this._retryConnection >= 10) {
      await this.close();
      await this.connect();
      return;
    }

    this._retryConnection += 1;
    this._connectionLocked = true;

    const { state, saveCreds } = await useMultiFileAuthState(
      this.stateFilePath,
    );

    const { version, isLatest } = await fetchLatestBaileysVersion();
    this.logger.debug(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
      version,
      logger: this.pinoLogger as any,
      auth: {
        creds: state.creds,
        /** caching makes the store faster to send/recv messages */
        keys: makeCacheableSignalKeyStore(state.keys, this.pinoLogger as any),
      },
      qrTimeout: 30_000,
      syncFullHistory: false,
      msgRetryCounterCache: this.msgRetryCounterCache,
      printQRInTerminal: false,
      generateHighQualityLinkPreview: true,
      browser: Browsers.appropriate('Chrome'),
      markOnlineOnConnect: true,
      shouldIgnoreJid: (jid) => isJidBroadcast(jid),
    });

    sock.ev.process(async (e) => {
      this._connectionLocked = false;

      if (e['connection.update']) {
        const { connection, qr, lastDisconnect } = e['connection.update'];

        if (qr) {
          if (this._qrRetry >= 3) {
            sock.logger.info('qr code timeout');
            await this.close();
          } else {
            this._qrRetry += 1;
          }
        }

        if (connection == 'open') {
          this._qrRetry = 0;
        }

        if (connection === 'close') {
          this._qrRetry = 0;
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          const isTimeout = statusCode === DisconnectReason.timedOut;
          const isRestartRequired =
            statusCode === DisconnectReason.restartRequired ||
            isTimeout ||
            DisconnectReason.connectionClosed ||
            DisconnectReason.connectionReplaced ||
            DisconnectReason.connectionLost ||
            DisconnectReason.multideviceMismatch;

          if (isRestartRequired) {
            this._restartRequired = true;
            await this.connect();
          } else if (isLoggedOut) {
            sock.logger.info('logged out, clearing state...');
            this._restartRequired = false;
            fs.rmSync(this.stateFilePath, { recursive: true, force: true });
            this.close();
          }
        }
      }

      if (e['creds.update']) {
        await saveCreds();
      }

      for (const handler of this._handlers) {
        await handler(sock, e);
      }
    });

    this.sock = sock;
  }

  async close() {
    this._qrRetry = 0;
    this._retryConnection = 0;
    if (!this.sock) return;
    this.sock.ev.flush(true);

    this.sock.end(undefined);
    this.sock = undefined;
  }
}
