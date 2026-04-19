# Lecture Video Manager Worker

This Worker lets you upload and manage large lecture videos in Cloudflare R2 without relying on the Cloudflare dashboard upload UI limits.

## What it supports

- Authenticated object list and metadata
- Authenticated object delete
- Single-shot upload (`PUT /objects/:key`) for smaller files
- Multipart upload flow for large files:
  - start upload
  - upload parts
  - complete upload
  - abort upload

## 1) Configure and deploy

1. Install Wrangler:

```powershell
npm install -g wrangler
```

2. Authenticate:

```powershell
wrangler login
```

3. Review [wrangler.toml](./wrangler.toml):

- Set `bucket_name` to your target bucket.
- Optionally set `ALLOWED_ORIGIN`.

4. Create auth secret used by this Worker:

```powershell
wrangler secret put AUTH_KEY_SECRET
```

5. Deploy:

```powershell
wrangler deploy
```

## 2) API endpoints

Base URL: your deployed worker URL.

Health:

- `GET /health` (no auth)

Objects:

- `GET /objects?prefix=&limit=&cursor=`
- `GET /objects/:key` (object metadata)
- `HEAD /objects/:key` (metadata)
- `PUT /objects/:key` (single-shot upload)
- `DELETE /objects/:key`

Multipart:

- `POST /multipart/start`
- `PUT /multipart/part?key=...&uploadId=...&partNumber=...`
- `POST /multipart/complete`
- `POST /multipart/abort`

All endpoints except `/health` require:

- Header: `X-Custom-Auth-Key: <AUTH_KEY_SECRET>`

## 3) Multipart upload example (PowerShell)

Use this for large files (for example, > 300 MB).

### Start

```powershell
$worker = "https://<your-worker>.workers.dev"
$auth = "<AUTH_KEY_SECRET>"
$key = "lectures/opening/lesson-01.mp4"

$startBody = @{ key = $key; contentType = "video/mp4" } | ConvertTo-Json
$start = Invoke-RestMethod -Method Post -Uri "$worker/multipart/start" -Headers @{"X-Custom-Auth-Key"=$auth;"Content-Type"="application/json"} -Body $startBody
$uploadId = $start.uploadId
```

### Upload parts (example 25 MB chunk size)

```powershell
$filePath = "E:\videos\lesson-01.mp4"
$chunkSize = 25MB
$stream = [System.IO.File]::OpenRead($filePath)
$parts = @()
$partNumber = 1

try {
  while ($stream.Position -lt $stream.Length) {
    $remaining = $stream.Length - $stream.Position
    $size = [Math]::Min($chunkSize, $remaining)
    $buffer = New-Object byte[] $size
    $read = $stream.Read($buffer, 0, $size)

    if ($read -le 0) { break }

    if ($read -ne $size) {
      $trimmed = New-Object byte[] $read
      [Array]::Copy($buffer, $trimmed, $read)
      $buffer = $trimmed
    }

    $partUrl = "$worker/multipart/part?key=$([uri]::EscapeDataString($key))&uploadId=$([uri]::EscapeDataString($uploadId))&partNumber=$partNumber"

    $partResp = Invoke-RestMethod -Method Put -Uri $partUrl -Headers @{"X-Custom-Auth-Key"=$auth;"Content-Type"="application/octet-stream"} -Body $buffer
    $parts += @{ partNumber = $partNumber; etag = $partResp.etag }
    $partNumber++
  }
}
finally {
  $stream.Close()
}
```

### Complete

```powershell
$completeBody = @{ key = $key; uploadId = $uploadId; parts = $parts } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri "$worker/multipart/complete" -Headers @{"X-Custom-Auth-Key"=$auth;"Content-Type"="application/json"} -Body $completeBody
```

### Abort (if needed)

```powershell
$abortBody = @{ key = $key; uploadId = $uploadId } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$worker/multipart/abort" -Headers @{"X-Custom-Auth-Key"=$auth;"Content-Type"="application/json"} -Body $abortBody
```

## 4) Mapping to lectures

After upload, store the same object key in your Sanity `lecture.videoKey` field.

Example key:

- `lectures/opening/lesson-01.mp4`

This key is what your existing secure playback API expects.
