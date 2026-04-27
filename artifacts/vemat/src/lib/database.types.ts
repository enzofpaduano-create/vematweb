export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type OrderStatus = "en_traitement" | "devis_envoye" | "commande_payee" | "en_livraison" | "livree" | "annulee";
export type RepairStatus = "en_attente" | "planifiee" | "en_cours" | "terminee" | "annulee";
export type Priority = "normale" | "urgente";
export type UserRole = "client" | "vemat_admin" | "vemat_dg";

type EmptyRecord = Record<string, never>;

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          rc: string | null;
          ice: string | null;
          address: string | null;
          city: string | null;
          country: string;
          phone: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["companies"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          company_id: string | null;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      chantiers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          address: string | null;
          city: string | null;
          gps_lat: number | null;
          gps_lng: number | null;
          contact_name: string | null;
          contact_phone: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["chantiers"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["chantiers"]["Insert"]>;
      };
      devis_requests: {
        Row: {
          id: string;
          company_id: string;
          reference: string;
          status: OrderStatus;
          chantier_id: string | null;
          items: Json;
          notes: string | null;
          quote_pdf_url: string | null;
          quote_amount: number | null;
          payment_date: string | null;
          payment_proof_url: string | null;
          bl_url: string | null;
          delivery_date: string | null;
          carrier: string | null;
          tracking_number: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["devis_requests"]["Row"], "id" | "reference" | "created_at" | "updated_at"> & { id?: string; reference?: string };
        Update: Partial<Database["public"]["Tables"]["devis_requests"]["Insert"]>;
      };
      technicians: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          available: boolean;
          color: string;
        };

        Insert: Omit<Database["public"]["Tables"]["technicians"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["technicians"]["Insert"]>;
      };
      repair_requests: {
        Row: {
          id: string;
          company_id: string;
          chantier_id: string | null;
          reference: string;
          equipment_type: string;
          equipment_brand: string | null;
          equipment_model: string | null;
          equipment_serial: string | null;
          description: string;
          priority: Priority;
          status: RepairStatus;
          technician_id: string | null;
          scheduled_date: string | null;
          completed_date: string | null;
          technician_notes: string | null;
          manager_checklist: Json;
          manager_parts: Json;
          attachments: Json;
          report_parts: Json;
          report_hours: number | null;
          report_work_done: string | null;
          report_observations: string | null;
          report_submitted_at: string | null;
          report_locked: boolean | null;
          tech_photos: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["repair_requests"]["Row"], "id" | "reference" | "created_at" | "updated_at"> & { id?: string; reference?: string };
        Update: Partial<Database["public"]["Tables"]["repair_requests"]["Insert"]>;
      };
      status_history: {
        Row: {
          id: string;
          entity_type: "devis" | "reparation";
          entity_id: string;
          old_status: string | null;
          new_status: string;
          note: string | null;
          changed_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["status_history"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["status_history"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string | null;
          read: boolean;
          type: string | null;
          link: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };
  };
}

export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Chantier = Database["public"]["Tables"]["chantiers"]["Row"];
export type DevisRequest = Database["public"]["Tables"]["devis_requests"]["Row"];
export type Technician = Database["public"]["Tables"]["technicians"]["Row"];
export type RepairRequest = Database["public"]["Tables"]["repair_requests"]["Row"];
export type StatusHistory = Database["public"]["Tables"]["status_history"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export type SaleStatus = "devis" | "bon_commande" | "facture" | "paye";

export type Commercial = {
  id: string;
  user_id: string | null;
  name: string;
  title: string;
  phone: string | null;
  email: string | null;
  color: string;
  active: boolean;
  created_at: string;
};

export type CommercialEvent = {
  id: string;
  commercial_id: string;
  title: string;
  type: "visite" | "reunion" | "appel" | "autre";
  client_name: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
};

export type CommercialMeetingReport = {
  id: string;
  commercial_id: string;
  event_id: string | null;
  client_name: string;
  date: string;
  summary: string | null;
  outcome: "positif" | "neutre" | "negatif" | "a_recontacter" | null;
  next_step: string | null;
  validated_by_dg: boolean;
  dg_comment: string | null;
  created_at: string;
};

export type CommercialSale = {
  id: string;
  commercial_id: string;
  reference: string | null;
  client_name: string;
  machine_brand: string | null;
  machine_model: string | null;
  machine_category: string | null;
  quantity: number;
  invoice_amount: number | null;
  invoice_date: string | null;
  invoice_file_url: string | null;
  status: SaleStatus;
  notes: string | null;
  created_at: string;
};

export type CommercialTarget = {
  id: string;
  commercial_id: string;
  year: number;
  month: number;
  target_amount: number;
};

// ── Public forms (no auth required) ──────────────────────────────────────────

export type FormDevisStatus = "nouveau" | "traite" | "converti";
export type FormInterventionStatus = "nouveau" | "traite" | "cree";
export type InterventionUrgency = "normale" | "urgente" | "tres_urgente";

export type PublicDevisRequest = {
  id: string;
  reference: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  product_category: string | null;
  product_brand: string | null;
  product_model: string | null;
  quantity: number;
  cart_items: Array<{ sku: string; title: string; brand: string; quantity: number }> | null;
  location: string | null;
  desired_date: string | null;
  notes: string | null;
  status: FormDevisStatus;
  converted_to_order_id: string | null;
  converted_to_sale_id: string | null;
  created_at: string;
};

export type PublicInterventionRequest = {
  id: string;
  reference: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  machine_type: string;
  machine_brand: string | null;
  machine_model: string | null;
  machine_serial: string | null;
  machine_year: string | null;
  problem_description: string;
  urgency: InterventionUrgency;
  location: string;
  attachments: string[];
  status: FormInterventionStatus;
  converted_to_repair_id: string | null;
  created_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────

export interface OrderItem {
  part_number: string;
  description: string;
  quantity: number;
  unit_price?: number;
}

export const ORDER_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: "en_traitement", label: "En traitement", color: "bg-blue-100 text-blue-700" },
  { value: "devis_envoye", label: "Devis envoyé", color: "bg-purple-100 text-purple-700" },
  { value: "commande_payee", label: "Commande payée", color: "bg-green-100 text-green-700" },
  { value: "en_livraison", label: "En livraison", color: "bg-orange-100 text-orange-700" },
  { value: "livree", label: "Livrée", color: "bg-emerald-100 text-emerald-700" },
  { value: "annulee", label: "Annulée", color: "bg-red-100 text-red-700" },
];

export const REPAIR_STATUSES: { value: RepairStatus; label: string; color: string }[] = [
  { value: "en_attente", label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  { value: "planifiee", label: "Planifiée", color: "bg-blue-100 text-blue-700" },
  { value: "en_cours", label: "En cours", color: "bg-orange-100 text-orange-700" },
  { value: "terminee", label: "Terminée", color: "bg-emerald-100 text-emerald-700" },
  { value: "annulee", label: "Annulée", color: "bg-red-100 text-red-700" },
];
