# OCR all remaining Davydov books — runs fully detached, no supervision needed.
# Launch: Start-Process pwsh -ArgumentList @("-NonInteractive","-File","G:\Codex Goroskop\scripts\ocr_all_davydov.ps1") -WindowStyle Hidden
# Progress: G:\Codex Goroskop\data\ocr-runs\davydov_progress.log

$ErrorActionPreference = "Continue"
$LOG  = "G:\Codex Goroskop\data\ocr-runs\davydov_progress.log"
$TMP  = "C:\tmp"

if (-not (Test-Path $TMP)) { New-Item -ItemType Directory -Path $TMP | Out-Null }

function Log($msg) {
    $ts = Get-Date -Format "HH:mm:ss"
    "$ts  $msg" | Tee-Object -FilePath $LOG -Append | Out-Null
}

$BOOKS = @(
    @{
        pdf = "G:\Codex Goroskop\sources\books\library\09-chinese-eastern-astrology\Давыдов М. -  Восточный Зодиак - 2011.pdf"
        out = "G:\Codex Goroskop\data\extracted-text\09-chinese-eastern-astrology\Давыдов-М-Восточныи-Зодиак-2011.txt"
        name = "Восточный Зодиак"
        pages = 417
    },
    @{
        pdf = "G:\Codex Goroskop\sources\books\library\09-chinese-eastern-astrology\Давыдов М. -  Астрология Цзэ Жи Сюэ - 2011.pdf"
        out = "G:\Codex Goroskop\data\extracted-text\09-chinese-eastern-astrology\Давыдов-М-Астрология-Цзэ-Жи-Сюэ-2011.txt"
        name = "Астрология Цзэ Жи Сюэ"
        pages = 354
    },
    @{
        pdf = "G:\Codex Goroskop\sources\books\library\09-chinese-eastern-astrology\Давыдов М. - Дао лунного календаря. – 2008.pdf"
        out = "G:\Codex Goroskop\data\extracted-text\09-chinese-eastern-astrology\Давыдов-М-Дао-лунного-календаря-2008.txt"
        name = "Дао лунного календаря"
        pages = 330
    },
    @{
        pdf = "G:\Codex Goroskop\sources\books\library\09-chinese-eastern-astrology\Давыдов М. – Древнекитайская Астрология Эпохи Хань. - 2010.pdf"
        out = "G:\Codex Goroskop\data\extracted-text\09-chinese-eastern-astrology\Давыдов-М-Древнекитаи-ская-Астрология-Эпохи-Хань-2010.txt"
        name = "Древнекитайская Астрология"
        pages = 310
    }
)

"" | Set-Content $LOG
Log "=== OCR Davydov (4 books, $(($BOOKS | Measure-Object pages -Sum).Sum) pages) ==="

foreach ($book in $BOOKS) {
    Log "--- START: $($book.name) ($($book.pages) стр.)"

    # Clear output file
    "" | Set-Content $book.out

    for ($i = 0; $i -lt $book.pages; $i++) {
        $png = "$TMP\dav_ocr_page.png"

        # Convert page: 200 DPI, grayscale, PNG (faster than TIFF)
        & magick -density 200 "$($book.pdf)[$i]" -colorspace Gray -type Grayscale $png 2>$null

        if (Test-Path $png) {
            # --psm 6: single uniform block of text (good for book pages)
            & tesseract $png stdout -l rus --oem 1 --psm 6 2>$null | Add-Content $book.out
            Remove-Item $png -Force -ErrorAction SilentlyContinue
        }

        # Log every 50 pages
        if (($i + 1) % 50 -eq 0) {
            $kb = [math]::Round((Get-Item $book.out).Length / 1024)
            Log "  $($book.name): page $($i+1)/$($book.pages) — $kb KB"
        }
    }

    $finalKb = [math]::Round((Get-Item $book.out).Length / 1024)
    Log "--- DONE: $($book.name) — $finalKb KB"
}

Log "=== ALL DONE ==="
