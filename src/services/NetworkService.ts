const IP_API_URL = 'https://api.ipify.org?format=json';
const IP_STORAGE_KEY = 'arena_player_ip';

interface IpResponse {
  ip: string;
}

export class NetworkService {
  async fetchAndCacheIp(): Promise<void> {
    if (localStorage.getItem(IP_STORAGE_KEY)) return;

    try {
      const response = await fetch(IP_API_URL);
      const data = (await response.json()) as IpResponse;
      localStorage.setItem(IP_STORAGE_KEY, data.ip ?? 'unknown');
    } catch {
      localStorage.setItem(IP_STORAGE_KEY, 'unknown');
    }
  }

  getStoredIp(): string {
    return localStorage.getItem(IP_STORAGE_KEY) ?? 'unknown';
  }
}
