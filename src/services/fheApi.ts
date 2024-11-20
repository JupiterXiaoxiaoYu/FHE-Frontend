import axios from 'axios';

const API_BASE_URL = '/service';

export interface FHEKeys {
  publicKey: string;
  clientKey: string;
}

export interface EncryptedValue {
  encrypted_value: string;
}

export interface DecryptedValue {
  value: number;
}

export interface ComputationResult {
  result: string;
}

export type DataType = "monthly_income" | "credit_score" | "property_value";

export const fheApi = {
  async generateKeys(publicKey: string): Promise<FHEKeys> {
    try {
      const response = await axios.post(`${API_BASE_URL}/generate_keys`, {
        public_key: publicKey,
      });
      return {
        publicKey: response.data.fhe_public_key,
        clientKey: response.data.client_key
      };
    } catch (error) {
      console.error('Failed to generate FHE keys:', error);
      throw new Error('Failed to generate FHE keys');
    }
  },

  async getPublicKey(publicKey: string): Promise<string> {
    try {
      console.log('Requesting public key for:', publicKey);
      const response = await axios.post(
        `${API_BASE_URL}/get_public_key`,
        {
          public_key: publicKey
        }
      );
    
      console.log('Response:', response.data);
      return response.data.fhe_public_key;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Request failed:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      throw new Error('Failed to get public key');
    }
  },

  async encrypt(publicKey: string, dataType: DataType, value: number): Promise<EncryptedValue> {
    try {
      const response = await axios.post(`${API_BASE_URL}/encrypt`, {
        public_key: publicKey,
        data_type: dataType,
        value: value
      });
      return {
        encrypted_value: response.data.encrypted_value
      };
    } catch (error) {
      console.error('Failed to encrypt value:', error);
      throw new Error('Failed to encrypt value');
    }
  },

  async compute(
    publicKey: string,
    taskId: string,
    dataType: DataType,
    encryptedValues: string[]
  ): Promise<ComputationResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/compute`, {
        public_key: publicKey,
        task_id: taskId,
        data_type: dataType,
        encrypted_values: encryptedValues
      });
      return {
        result: response.data.result
      };
    } catch (error) {
      console.error('Failed to compute:', error);
      throw new Error('Failed to compute');
    }
  },

  async decrypt(
    publicKey: string,
    dataType: DataType,
    encryptedValue: string
  ): Promise<DecryptedValue> {
    try {
      const response = await axios.post(`${API_BASE_URL}/decrypt`, {
        public_key: publicKey,
        data_type: dataType,
        encrypted_value: encryptedValue
      });
      return {
        value: response.data.value
      };
    } catch (error) {
      console.error('Failed to decrypt:', error);
      throw new Error('Failed to decrypt');
    }
  }
};