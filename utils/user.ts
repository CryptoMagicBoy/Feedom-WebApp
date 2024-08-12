export function getUserTelegramId(initData: string): string | null {
    try {
      const parsedData = JSON.parse(decodeURIComponent(initData));
      const user = parsedData.user;
      return user?.id?.toString() || null;
    } catch (error) {
      console.error('Error parsing initData:', error);
      return null;
    }
  }