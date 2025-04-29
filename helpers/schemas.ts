import { object, ref, string, number, boolean, array } from "yup";

export const LoginSchema = object().shape({
  email: string()
    .email("This field must be an email")
    .required("Email is required"),
  password: string().required("Password is required"),
});

export const RegisterSchema = object().shape({
  full_name: string().required("Full name is required"),
  email: string()
    .email("This field must be an email")
    .required("Email is required"),
  password: string().required("Password is required"),
  confirmPassword: string()
    .required("Confirm password is required")
    .oneOf([ref("password")], "Passwords must match"),
});

export const LeadSourceSchema = object().shape({
  name: string().required("Name is required"),
  file_name: string().required("File name is required"),
  storage_path: string().required("Storage path is required"),
  is_active: boolean().default(true),
  metadata: object().shape({
    table_name: string().required("Table name is required"),
    file_hash: string().required("File hash is required"),
    column_types: object().required("Column types are required")
  }).nullable()
});

export const LeadSchema = object().shape({
  // Property Information
  property_address: string().nullable(),
  property_city: string().nullable(),
  property_state: string().nullable(),
  property_zip: string().nullable(),
  property_type: string().nullable(),
  beds: number().integer().nullable(),
  baths: number().nullable(),
  square_footage: number().integer().nullable(),
  year_built: number().integer().nullable(),
  
  // Valuation
  wholesale_value: number().nullable(),
  market_value: number().nullable(),
  assessed_total: number().nullable(),
  
  // MLS Information
  days_on_market: number().integer().nullable(),
  mls_status: string().nullable(),
  mls_list_date: string().nullable(),
  mls_list_price: number().nullable(),
  
  // Owner Information
  owner_name: string().nullable(),
  owner_email: string().email("Invalid email format").nullable(),
  owner_type: string().oneOf(["OWNER", "AGENT"]).nullable(),
  
  // Mailing Information
  mailing_address: string().nullable(),
  mailing_city: string().nullable(),
  mailing_state: string().nullable(),
  mailing_zip: string().nullable(),
  
  // System Fields
  status: string().oneOf([
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "NEGOTIATING",
    "UNDER_CONTRACT",
    "CLOSED",
    "DEAD"
  ]).default("NEW"),
  source_id: string().uuid().nullable(),
  assigned_to: string().uuid().nullable(),
  notes: string().nullable()
});
