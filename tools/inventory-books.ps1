param(
    [string]$BooksPath = "G:\Codex Goroskop\sources\books",
    [string]$OutputPath = "G:\Codex Goroskop\data\book-inventory.csv"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $BooksPath)) {
    throw "Books path not found: $BooksPath"
}

$books = Get-ChildItem -LiteralPath $BooksPath -Recurse -File |
    Where-Object { $_.Extension -in ".pdf", ".epub", ".fb2", ".rtf", ".docx", ".txt" } |
    Sort-Object Name |
    ForEach-Object {
        [pscustomobject]@{
            Name = $_.Name
            Extension = $_.Extension
            SizeMB = [math]::Round($_.Length / 1MB, 2)
            Category = if ($_.FullName -match "\\library\\([^\\]+)\\") { $Matches[1] } elseif ($_.FullName -match "\\inbox\\") { "inbox" } else { "" }
            FullName = $_.FullName
            LastWriteTime = $_.LastWriteTime
        }
    }

$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$books | Export-Csv -LiteralPath $OutputPath -NoTypeInformation -Encoding UTF8
$books | Format-Table Name, Extension, SizeMB, Category -AutoSize

Write-Host ""
Write-Host "Inventory written to: $OutputPath"
