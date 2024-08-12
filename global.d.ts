interface TelegramWebApp {
    share: (text: string) => void;
    // Add other Telegram WebApp methods you might use
  }
  
  interface Telegram {
    WebApp: TelegramWebApp;
  }
  
  interface Window {
    Telegram?: Telegram;
  }