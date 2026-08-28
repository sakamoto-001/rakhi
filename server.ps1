# Robust TcpListener HTTP Server for RakhiVerse
param([int]$Port = 3000)

$ip = [System.Net.IPAddress]::Any
$listener = [System.Net.Sockets.TcpListener]::new($ip, $Port)
$listener.Start()

Write-Host "✨ RakhiVerse Server running at http://localhost:$Port/" -ForegroundColor Cyan

$root = (Get-Location).Path
$mimeMap = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".webp" = "image/webp"
    ".svg"  = "image/svg+xml"
    ".wasm" = "application/wasm"
    ".ico"  = "image/x-icon"
    ".mp3"  = "audio/mpeg"
    ".mp4"  = "video/mp4"
    ".wav"  = "audio/wav"
    ".ogg"  = "audio/ogg"
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $buffer = New-Object byte[] 8192
            $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
            if ($bytesRead -le 0) {
                $client.Close()
                continue
            }
            $requestText = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $bytesRead)
            $firstLine = $requestText.Split("`n")[0].Trim()
            $parts = $firstLine.Split(' ')
            if ($parts.Length -lt 2) {
                $client.Close()
                continue
            }
            $method = $parts[0].ToUpper()
            $urlPart = $parts[1].Split('?')[0].TrimStart('/')
            $unescaped = [System.Uri]::UnescapeDataString($urlPart)
            $relativePath = $unescaped.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            
            if ($relativePath -eq '' -or $relativePath -eq [System.IO.Path]::DirectorySeparatorChar.ToString()) {
                $relativePath = 'index.html'
            }

            $fullPath = Join-Path $root $relativePath
            if ((Test-Path $fullPath -PathType Container)) {
                $fullPath = Join-Path $fullPath 'index.html'
            }

            if (Test-Path $fullPath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
                $mime = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { 'application/octet-stream' }
                $bytes = [System.IO.File]::ReadAllBytes($fullPath)

                $header = "HTTP/1.1 200 OK`r`n" +
                          "Content-Type: $mime`r`n" +
                          "Content-Length: $($bytes.Length)`r`n" +
                          "Accept-Ranges: bytes`r`n" +
                          "Access-Control-Allow-Origin: *`r`n" +
                          "Connection: close`r`n`r`n"

                $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                if ($method -ne 'HEAD') {
                    $stream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $err = [System.Text.Encoding]::UTF8.GetBytes("404 - Not Found")
                $header = "HTTP/1.1 404 Not Found`r`n" +
                          "Content-Type: text/plain`r`n" +
                          "Content-Length: $($err.Length)`r`n" +
                          "Connection: close`r`n`r`n"
                $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                if ($method -ne 'HEAD') {
                    $stream.Write($err, 0, $err.Length)
                }
            }
            $stream.Flush()
        } catch {
            # socket closed or client disconnected
        } finally {
            $client.Close()
        }
    }
} finally {
    $listener.Stop()
}

