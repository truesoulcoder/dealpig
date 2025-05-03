// Auto-generates normalization SQL for the leads ingestion pipeline.
// Update the "mappings" array to match your current leads table headers and normalized_leads columns.

const mappings = [
  // Each block represents a source (Contact1, Contact2, Contact3, MLS Agent)
  {
    from: { name: 'Contact1Name', email: 'Contact1Email_1' },
    to: { name: 'contact_name', email: 'contact_email' }
  },
  {
    from: { name: 'Contact2Name', email: 'Contact2Email_1' },
    to: { name: 'contact_name', email: 'contact_email' }
  },
  {
    from: { name: 'Contact3Name', email: 'Contact3Email_1' },
    to: { name: 'contact_name', email: 'contact_email' }
  },
  {
    from: { name: 'MLS_Curr_ListAgentName', email: 'MLS_Curr_ListAgentEmail' },
    to: { name: 'contact_name', email: 'contact_email' }
  }
];

const staticFields = [
  'PropertyAddress', 'PropertyCity', 'PropertyState', 'PropertyPostalCode',
  'PropertyType', 'Baths', 'Beds', 'YearBuilt', 'SquareFootage', 'WholesaleValue',
  'AssessedTotal', 'MLS_Curr_Status', 'MLS_Curr_DaysOnMarket'
];

const normalizedFields = [
  'original_lead_id', 'contact_name', 'contact_email', ...staticFields.map(f => f.toLowerCase())
];

const sqlBlocks = mappings.map(block => {
  const selectFields = [
    'leads.id AS original_lead_id',
    `leads.${block.from.name} AS ${block.to.name}`,
    `leads.${block.from.email} AS ${block.to.email}`,
    ...staticFields.map(f => `leads.${f} AS ${f.toLowerCase()}`)
  ].join(',\n  ');
  const whereClause = `leads.${block.from.name} IS NOT NULL AND TRIM(leads.${block.from.name}) <> '' AND leads.${block.from.email} IS NOT NULL AND TRIM(leads.${block.from.email}) <> ''`;
  return `SELECT\n  ${selectFields}\nFROM leads\nWHERE ${whereClause}`;
});

const finalSQL = `TRUNCATE TABLE public.normalized_leads;\n\nINSERT INTO public.normalized_leads (${normalizedFields.join(', ')})\n${sqlBlocks.join('\nUNION ALL\n')}\n;`;

console.log(finalSQL);

// To use: run `ts-node helpers/normalize_sql_codegen.ts` and copy the output to your normalization function or migration.
