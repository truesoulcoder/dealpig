-- Change data types in normalized_leads to TEXT to avoid casting errors

ALTER TABLE public.normalized_leads
    ALTER COLUMN property_address TYPE TEXT,
    ALTER COLUMN property_city TYPE TEXT,
    ALTER COLUMN property_state TYPE TEXT,
    ALTER COLUMN property_zip TYPE TEXT,
    ALTER COLUMN first_name TYPE TEXT,
    ALTER COLUMN last_name TYPE TEXT,
    ALTER COLUMN mailing_address TYPE TEXT,
    ALTER COLUMN mailing_city TYPE TEXT,
    ALTER COLUMN mailing_state TYPE TEXT,
    ALTER COLUMN mailing_zip TYPE TEXT,
    ALTER COLUMN contact1_phone_1 TYPE TEXT,
    ALTER COLUMN contact1_phone_1_type TYPE TEXT,
    ALTER COLUMN contact1_phone_2 TYPE TEXT,
    ALTER COLUMN contact1_phone_2_type TYPE TEXT,
    ALTER COLUMN contact1_phone_3 TYPE TEXT,
    ALTER COLUMN contact1_phone_3_type TYPE TEXT,
    ALTER COLUMN contact1_email_1 TYPE TEXT,
    ALTER COLUMN contact1_email_2 TYPE TEXT,
    ALTER COLUMN contact1_email_3 TYPE TEXT,
    ALTER COLUMN contact2_first_name TYPE TEXT,
    ALTER COLUMN contact2_last_name TYPE TEXT,
    ALTER COLUMN contact2_phone_1 TYPE TEXT,
    ALTER COLUMN contact2_phone_1_type TYPE TEXT,
    ALTER COLUMN contact2_email_1 TYPE TEXT,
    ALTER COLUMN property_type TYPE TEXT,
    ALTER COLUMN year_built TYPE TEXT,
    ALTER COLUMN square_feet TYPE TEXT,
    ALTER COLUMN lot_size TYPE TEXT,
    ALTER COLUMN bed TYPE TEXT,
    ALTER COLUMN bath TYPE TEXT,
    ALTER COLUMN owner_occupied TYPE TEXT, -- Changed from boolean
    ALTER COLUMN assessed_total TYPE TEXT, -- Was numeric/quoted
    ALTER COLUMN last_sale_date TYPE TEXT, -- Assuming TEXT, could be DATE
    ALTER COLUMN last_sale_amount TYPE TEXT,
    ALTER COLUMN total_loans TYPE TEXT,
    ALTER COLUMN estimated_equity TYPE TEXT,
    ALTER COLUMN estimated_value TYPE TEXT,
    ALTER COLUMN avm TYPE TEXT, -- Was numeric/quoted
    ALTER COLUMN listing_status TYPE TEXT,
    ALTER COLUMN listing_price TYPE TEXT,
    ALTER COLUMN listing_date TYPE TEXT, -- Assuming TEXT, could be DATE
    ALTER COLUMN days_on_market TYPE TEXT,
    ALTER COLUMN wholesale_value TYPE TEXT, -- Was numeric
    ALTER COLUMN arv TYPE TEXT; -- Was numeric
