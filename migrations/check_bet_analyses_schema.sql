-- Check the current structure of bet_analyses table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'bet_analyses'
ORDER BY 
    ordinal_position;
