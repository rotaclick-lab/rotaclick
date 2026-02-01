export type UserRole = "ADMIN" | "CLIENTE" | "TRANSPORTADOR";

export type FreightRequestStatus = "OPEN" | "CLOSED" | "CANCELLED";

export type FreightQuoteStatus = "SENT" | "WITHDRAWN" | "WON" | "LOST";

export type FreightRequest = {
  id: string;
  company_id: string;
  created_by: string;
  status: FreightRequestStatus;
  origin_zip?: string | null;
  origin_city: string;
  origin_state: string;
  destination_zip?: string | null;
  destination_city: string;
  destination_state: string;
  cargo_description: string | null;
  cargo_type?: string | null;
  weight_kg: number | null;
  volume_m3: number | null;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  invoice_value_cents?: number | null;
  pickup_date?: string | null; // date
  selected_quote_id: string | null;
  created_at: string;
  updated_at: string;
};
