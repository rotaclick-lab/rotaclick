export type UserRole = "ADMIN" | "CLIENTE" | "TRANSPORTADOR";

export type FreightRequestStatus = "OPEN" | "CLOSED" | "CANCELLED";

export type FreightRequest = {
  id: string;
  company_id: string;
  created_by: string;
  status: FreightRequestStatus;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  cargo_description: string | null;
  weight_kg: number | null;
  volume_m3: number | null;
  selected_quote_id: string | null;
  created_at: string;
  updated_at: string;
};
