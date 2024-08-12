export interface TelegramConfig {
    apiId: number;
    apiHash: string;
    botToken: string;
  }
  
  export function getTelegramConfig(): TelegramConfig | null {
    const apiId = parseInt(process.env.TELEGRAM_API_ID || '');
    const apiHash = process.env.TELEGRAM_API_HASH;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
    if (!apiId || isNaN(apiId)) {
      console.error('Invalid or missing TELEGRAM_API_ID');
      return null;
    }
  
    if (!apiHash) {
      console.error('Missing TELEGRAM_API_HASH');
      return null;
    }
  
    if (!botToken) {
      console.error('Missing TELEGRAM_BOT_TOKEN');
      return null;
    }
  
    return { apiId, apiHash, botToken };
  }