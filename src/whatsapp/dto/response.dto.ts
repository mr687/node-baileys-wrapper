export class SendMessageResponseDto {
  messageId: string;
  messageTimetamp: string;
}

export class GetStateResponseDto {
  status: 'connected' | 'disconnected';
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export class LoginResponseDto {
  qrTimeout: number;
  qr: string;
}
