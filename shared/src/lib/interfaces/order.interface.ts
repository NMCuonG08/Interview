export interface CreateOrderItemRequest {
  productExternalId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  merchantExternalId: string;
  items: CreateOrderItemRequest[];
  deliveryLocation?: {
    latitude: number;
    longitude: number;
  };
  deliveryAddressNote?: string;
}

export interface MerchantOrderItemResponse {
  externalId: string;
  status: string | null;
  paymentStatus: string | null;
  totalAmount: number;
  customerEmail: string;
  customerName: string | null;
  courierExternalId: string | null;
  itemCount: number;
  createdAt: string;
}

export interface MerchantOrderListQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export interface MerchantOrderListResponse {
  data: MerchantOrderItemResponse[];
  total: number;
  page: number;
  limit: number;
  merchant: {
    externalId: string;
    name: string;
  };
}

export interface UpdateMerchantOrderStatusRequest {
  action: 'accept' | 'reject';
  reason?: string;
}
