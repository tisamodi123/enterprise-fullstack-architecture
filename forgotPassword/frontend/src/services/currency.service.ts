import api from '../config/axios.config';
// 📦 Import types directly from the centralized types folder
import { CurrencyListResponse } from '../types/currency';


export const currencyService = {
  // 🔍 Database se saari active currencies fetch karne ke liye
  async getActiveCurrencies(): Promise<CurrencyListResponse> {
    const { data } = await api.get<CurrencyListResponse>('/currencies/list');
    return data;
  }
};