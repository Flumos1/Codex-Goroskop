<#
.SYNOPSIS
  OCR image-based PDF to text using ImageMagick + Tesseract.
.PARAMETER PdfPath
  Path to the source PDF.
.PARAMETER OutTxt
  Path where the combined OCR text will be saved. Defaults to the
  corresponding path under data/extracted-text.
.PARAMETER Lang
  Tesseract language(s), default "rus".
.PARAMETER Dpi
  Resolution for page rendering, default 300.
.EXAMPLE
  .\ocr_pdf.ps1 "G:\Codex Goroskop\sources\books\library\07-kabbalah-esoteric\Берг Р. - Каббалистическая астрология и смысл нашей жизни. (Каббала). - 2011.pdf"
#>
param(
    [Parameter(Mandatory)][string]$PdfPath,
    [string]$OutTxt = "",
    [string]$Lang = "rus",
    [int]$Dpi = 300
)

$ErrorActionPreference = "Stop"

$pdfFull = (Resolve-Path $PdfPath).Path
$pdfName = [System.IO.Path]::GetFileNameWithoutExtension($pdfFull)

if (-not $OutTxt) {
    # Derive output path from JSON metadata if available, else put in CWD
    $projectRoot = "G:\Codex Goroskop"
    $searchPattern = "$projectRoot\data\extracted-text\**\*.json"
    $matchedJson = Get-ChildItem -Recurse "$projectRoot\data\extracted-text" -Filter "*.json" |
        Where-Object {
            $j = Get-Content $_.FullName -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
            $j -and ($j.sourcePdf -like "*$pdfName*")
        } | Select-Object -First 1
    if ($matchedJson) {
        $OutTxt = $matchedJson.FullName -replace '\.json$', '.txt'
    } else {
        $OutTxt = "$projectRoot\data\extracted-text\uncategorized\$($pdfName -replace ' ', '-').txt"
    }
}

Write-Host "Source : $pdfFull"
Write-Host "Output : $OutTxt"
Write-Host "Lang   : $Lang  DPI: $Dpi"

# Temp folder for page images
$tmp = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "ocr_$([System.IO.Path]::GetRandomFileName())")
New-Item -ItemType Directory -Path $tmp | Out-Null
Write-Host "Temp   : $tmp"

try {
    # --- Step 1: count pages ---
    Write-Host "`n[1/3] Counting pages..."
    $identify = magick identify -format "%n\n" "$pdfFull[0]" 2>&1
    # identify returns just the page count for frame 0; use pdfinfo if needed
    # Alternatively: render page 0 first to check it works
    $pageCountRaw = magick identify "$pdfFull" 2>&1 | Measure-Object -Line
    $totalPages = $pageCountRaw.Lines
    Write-Host "Pages  : $totalPages"

    # --- Step 2: render pages to PNG ---
    Write-Host "`n[2/3] Rendering pages to PNG at $Dpi dpi..."
    $allText = [System.Text.StringBuilder]::new()

    for ($i = 0; $i -lt $totalPages; $i++) {
        $pngPath = [System.IO.Path]::Combine($tmp, "page_$($i.ToString('D4')).png")
        # render single page
        magick -density $Dpi "$pdfFull[$i]" -depth 8 -strip -background white -alpha off $pngPath 2>$null
        if (-not (Test-Path $pngPath)) {
            Write-Warning "Page $i render failed, skipping"
            continue
        }

        # --- Step 3: OCR ---
        $txtBase = [System.IO.Path]::Combine($tmp, "page_$($i.ToString('D4'))")
        tesseract $pngPath $txtBase -l $Lang --oem 1 --psm 3 quiet 2>$null
        $txtFile = "$txtBase.txt"
        if (Test-Path $txtFile) {
            $pageText = Get-Content $txtFile -Raw -Encoding UTF8
            [void]$allText.AppendLine($pageText)
        }

        Remove-Item $pngPath -Force -ErrorAction SilentlyContinue
        Remove-Item $txtFile -Force -ErrorAction SilentlyContinue

        if (($i + 1) % 10 -eq 0 -or $i -eq $totalPages - 1) {
            Write-Host "  $($i+1)/$totalPages pages done"
        }
    }

    # --- Save ---
    $combined = $allText.ToString()
    [System.IO.File]::WriteAllText($OutTxt, $combined, [System.Text.Encoding]::UTF8)
    $chars = $combined.Length
    Write-Host "`nDone. $chars characters written to:`n  $OutTxt"

    # Update JSON charCount
    $jsonPath = $OutTxt -replace '\.txt$', '.json'
    if (Test-Path $jsonPath) {
        $j = Get-Content $jsonPath -Raw | ConvertFrom-Json
        $j.charCount = $chars
        $j | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8
        Write-Host "Updated charCount in JSON."
    }
}
finally {
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
