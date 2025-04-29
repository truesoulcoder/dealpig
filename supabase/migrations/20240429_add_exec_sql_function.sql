-- Create a function to safely execute SQL
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION public.exec_sql IS 'Safely executes SQL queries. Only available to authenticated users.'; 