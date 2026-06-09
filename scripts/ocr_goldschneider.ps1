# OCR Goldschneider "Тайный язык дня рождения" (728 pages)
# Usage: pwsh -File ocr_goldschneider.ps1

$ErrorActionPreference = "Stop"
$pdf = 'G:\Codex Goroskop\sources\books\library\07-kabbalah-esoteric\Голдшнайдер Г. - Тайный язык дня рождения. Астролого-психологический портрет каждого дня года.pdf'
$outTxt = 'G:\Codex Goroskop\data\extracted-text\07-kabbalah-esoteric\Голдшнаи-дер-Г-Таи-ныи-язык-дня-рождения-Астролого-психологическии-портрет-каждого-дня-года.txt'
$outJson = $outTxt -replace '\.txt$', '.json'
$tmp = [System.IO.Path]::Combine($env:TEMP, "ocr_gold_" + [System.IO.Path]::GetRandomFileName())

Write-Host "[OCR] Goldschneider birthdays — starting"
Write-Host "[OCR] Output: $outTxt"

New-Item -ItemType Directory -Path $tmp | Out-Null

try {
    $totalPages = (& magick identify $pdf 2>$null | Measure-Object -Line).Lines
    Write-Host "[OCR] Pages: $totalPages"

    $allText = [System.Text.StringBuilder]::new(5MB)
    $batchSize = 10

    for ($i = 0; $i -lt $totalPages; $i++) {
        $png = [System.IO.Path]::Combine($tmp, "page.png")
        $txtBase = [System.IO.Path]::Combine($tmp, "page")

        & magick -density 300 "$($pdf)[$i]" -depth 8 -strip -background white -alpha off $png 2>$null
        if (Test-Path $png) {
            & tesseract $png $txtBase -l rus --oem 1 --psm 3 quiet 2>$null
            $txtFile = "$txtBase.txt"
            if (Test-Path $txtFile) {
                [void]$allText.AppendLine([System.IO.File]::ReadAllText($txtFile, [System.Text.Encoding]::UTF8))
                Remove-Item $txtFile -Force -Confirm:$false
            }
            Remove-Item $png -Force -Confirm:$false
        }

        if ((($i + 1) % $batchSize) -eq 0 -or $i -eq $totalPages - 1) {
            Write-Host "[OCR] $($i+1)/$totalPages pages done"
            # Flush partial result every 100 pages
            if ((($i + 1) % 100) -eq 0) {
                [System.IO.File]::WriteAllText($outTxt, $allText.ToString(), [System.Text.Encoding]::UTF8)
                Write-Host "[OCR] Partial save at page $($i+1)"
            }
        }
    }

    $combined = $allText.ToString()
    [System.IO.File]::WriteAllText($outTxt, $combined, [System.Text.Encoding]::UTF8)

    $chars = $combined.Length
    Write-Host "[OCR] Done! $chars characters"

    # Update JSON charCount
    if (Test-Path $outJson) {
        $j = Get-Content $outJson -Raw | ConvertFrom-Json
        $j.charCount = $chars
        $j | ConvertTo-Json -Depth 10 | Set-Content $outJson -Encoding UTF8
        Write-Host "[OCR] Updated JSON charCount"
    }
}
finally {
    Remove-Item $tmp -Recurse -Force -Confirm:$false -ErrorAction SilentlyContinue
}

Write-Host "[OCR] Finished: $outTxt"
