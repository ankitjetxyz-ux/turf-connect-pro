$headers = @{
    "Content-Type" = "application/json"
}

$playerBody = @{
    name = "Test Player"
    email = "testplayer_" + (Get-Date -Format "yyyyMMddHHmmss") + "@example.com"
    password = "password123"
    role = "player"
} | ConvertTo-Json

$ownerBody = @{
    name = "Test Owner"
    email = "testowner_" + (Get-Date -Format "yyyyMMddHHmmss") + "@example.com"
    password = "password123"
    role = "client"
} | ConvertTo-Json

Write-Host "--- TESTING REGISTRATION (PLAYER) ---"
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Headers $headers -Body $playerBody
    Write-Host "✅ Player Registration Success:"
    $response | Format-List
} catch {
    Write-Host "❌ Player Registration Failed:"
    $_.Exception.Response.StatusCode
    $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
    $reader.ReadToEnd()
}

Write-Host "`n--- TESTING REGISTRATION (OWNER) ---"
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Headers $headers -Body $ownerBody
    Write-Host "✅ Owner Registration Success:"
    $response | Format-List
} catch {
    Write-Host "❌ Owner Registration Failed:"
    $_.Exception.Response.StatusCode
    $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
    $reader.ReadToEnd()
}
