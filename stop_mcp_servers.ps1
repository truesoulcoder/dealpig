# PowerShell Script to Stop All MCP Server Windows

# List of MCP server command substrings to match
$mcpCommands = @(
    "@modelcontextprotocol/server-github",
    "@modelcontextprotocol/server-puppeteer",
    "@supabase/mcp-server-supabase",
    "@upstash/context7-mcp",
    "@modelcontextprotocol/server-sequential-thinking"
)

# Get all PowerShell processes with their command lines
$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -like "powershell*" }

foreach ($cmd in $mcpCommands) {
    $matching = $procs | Where-Object { $_.CommandLine -match [regex]::Escape($cmd) }
    foreach ($proc in $matching) {
        try {
            Write-Host "Stopping MCP server process: $($proc.ProcessId) [$($proc.CommandLine)]"
            Stop-Process -Id $proc.ProcessId -Force
        } catch {
            Write-Warning "Failed to stop process $($proc.ProcessId): $($_.Exception.Message)"
        }
    }
}