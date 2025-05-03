# PowerShell script to truncate the leads table using Supabase CLI
# This script follows the pattern mentioned in the user rules for handling .env files with Supabase CLI

# Create a backup directory for .env files if it doesn't exist
if (-not (Test-Path -Path "env_stash")) {
    New-Item -ItemType Directory -Path "env_stash" -Force | Out-Null
    Write-Host "Created env_stash directory"
}

# Move .env files to prevent UTF-8 BOM encoding issues
if (Test-Path -Path ".env") {
    Move-Item -Path ".env" -Destination "env_stash\.env" -Force
    Write-Host "Moved .env to env_stash"
}

if (Test-Path -Path ".env.local") {
    Move-Item -Path ".env.local" -Destination "env_stash\.env.local" -Force
    Write-Host "Moved .env.local to env_stash"
}

try {
    # Execute the SQL script to truncate the leads table
    Write-Host "Truncating leads table..."
    supabase db execute --file "supabase\migrations\20250503083900_truncate_leads_table.sql"
    
    # Verify the truncation
    Write-Host "Verifying truncation..."
    supabase db execute --query "SELECT COUNT(*) FROM leads;"
    
    Write-Host "Truncation complete!"
} catch {
    Write-Host "Error executing SQL: $_" -ForegroundColor Red
} finally {
    # Move .env files back to root directory
    if (Test-Path -Path "env_stash\.env") {
        Move-Item -Path "env_stash\.env" -Destination ".env" -Force
        Write-Host "Moved .env back to root directory"
    }
    
    if (Test-Path -Path "env_stash\.env.local") {
        Move-Item -Path "env_stash\.env.local" -Destination ".env.local" -Force
        Write-Host "Moved .env.local back to root directory"
    }
}

Write-Host "Process completed!" -ForegroundColor Green
