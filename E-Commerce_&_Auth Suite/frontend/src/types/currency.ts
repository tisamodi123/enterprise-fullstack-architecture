export interface CurrencyData {
  _id: string;
  code: string;
  symbol: string;
  exchangeRate: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrencyListResponse {
  status: string;
  data: {
    currencies: CurrencyData[];
  };
}