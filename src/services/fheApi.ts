import axios from 'axios';

const API_BASE_URL = '/service'; // 根据你的后端 API 地址调整

export interface FHEKeys {
  publicKey: string;
  // serverKey: string;
  clientKey: string;
}

export const fheApi = {
  async generateKeys(): Promise<FHEKeys> {
    try {
      const response = await axios.post(`${API_BASE_URL}/generate_keys`, {
        public_key: "test_user_1",  // 这里后续需要改为动态的用户标识
        server_key: ""
      });
      return {
        publicKey: response.data.fhe_public_key,
        // serverKey: response.data.server_key
        clientKey: response.data.client_key
      };
    } catch (error) {
      console.error('Failed to generate FHE keys:', error);
      throw new Error('Failed to generate FHE keys');
    }
  }
};