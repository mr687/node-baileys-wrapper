import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappBaileys } from './whatsapp.baileys';
import type { WASocket, BaileysEventMap } from '@whiskeysockets/baileys';
import { HttpService } from '@nestjs/axios';
import crypto from 'crypto';

@Injectable()
export class WhatsappWebhook {
  private webhookUrl: string | undefined;
  private webhookSecret: string | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly client: WhatsappBaileys,
    private readonly http: HttpService,
  ) {
    const enableWebhook = this.config.get('ENABLE_WEBHOOK') === true;
    if (enableWebhook) {
      const webhookURL = this.config.getOrThrow('WEBHOOK_URL');
      const webhookSecret = this.config.getOrThrow('WEBHOOK_KEY');

      this.webhookUrl = webhookURL;
      this.webhookSecret = webhookSecret;

      this.client.addHandler((sock, e) => this._handler(sock, e));
    }
  }

  private async _handler(sock: WASocket, e: Partial<BaileysEventMap>) {
    if (e['messages.upsert']) {
      const { type, messages, requestId } = e['messages.upsert'];

      const body = { type, messages, requestId };
      const bodyBuff = Buffer.from(JSON.stringify(body), 'utf8');
      const hmac = crypto
        .createHmac('sha256', this.webhookSecret!)
        .update(bodyBuff)
        .digest('hex');

      const headers = {
        'Response-Type': 'application/json',
        'X-Hub-Signature-256': `sha256=${hmac}`,
      };

      // TODO: retry sending webhook
      await this.http.axiosRef
        .post(this.webhookUrl!, body, { headers })
        .catch(() => null);
    }
  }
}
