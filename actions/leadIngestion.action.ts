import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Papa from 'papaparse';

export async function normalizeLeads(formData: FormData) {
  const file = formData.get('file') as File;
  const text = await file.text();
  const { data: rows, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length) {
    throw new Error(`CSV parse error: ${errors.map(e => e.message).join(', ')}`);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const allCookies = await cookies();
          return allCookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Implement cookie setting logic if needed
        },
        remove(name: string, options: any) {
          // Implement cookie removal logic if needed
        },
      },
    }
  );
  const inserts: any[] = [];

  for (const row of rows as any[]) {
    const propertyFields = {
      property_address: row.PropertyAddress || null,
      property_city: row.PropertyCity || null,
      property_state: row.PropertyState || null,
      property_zip: row.PropertyPostalCode || null,
      property_type: row.PropertyType || null,
      beds: row.Beds ? Number(row.Beds) : null,
      baths: row.Baths ? Number(row.Baths) : null,
      square_footage: row.SquareFootage ? Number(row.SquareFootage) : null,
      year_built: row.YearBuilt ? Number(row.YearBuilt) : null,
      wholesale_value: row.WholesaleValue ? Number(row.WholesaleValue) : null,
      assessed_total: row.AssessedTotal ? Number(row.AssessedTotal) : null,
      mls_status: row.MLS_Curr_Status || null,
      days_on_market: row.MLS_Curr_DaysOnMarket ? Number(row.MLS_Curr_DaysOnMarket) : null,
    };

    // Iterate contacts 1-5
    for (let i = 1; i <= 5; i++) {
      const name = row[`Contact${i}Name`];
      const email = row[`Contact${i}Email_1`];
      if (name && email) {
        inserts.push({
          ...propertyFields,
          owner_name: name,
          owner_email: email,
          owner_type: 'OWNER',
          source_id: null,
        });
      }
    }

    // Add listing agent as contact
    const agentName = row.MLS_Curr_ListAgentName;
    const agentEmail = row.MLS_Curr_ListAgentEmail;
    if (agentName && agentEmail) {
      inserts.push({
        ...propertyFields,
        owner_name: agentName,
        owner_email: agentEmail,
        owner_type: 'AGENT',
        source_id: null,
      });
    }
  }

  if (inserts.length === 0) {
    return { count: 0 };
  }

  const { data: inserted, error } = await supabase
    .from('leads')
    .insert(inserts);

  if (error) {
    throw error;
  }

  return { count: inserts.length };
}
