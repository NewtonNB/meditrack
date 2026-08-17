$loginResult = Invoke-RestMethod -Method POST -Uri "http://localhost:8000/api/auth/login" -ContentType "application/json" -Headers @{"Accept"="application/json"} -Body '{"email":"admin@mediTrack.com","password":"1234"}'
$token = $loginResult.token

function Test-Endpoint($label, $method, $url, $body = $null) {
    $wc = New-Object System.Net.WebClient
    $wc.Headers.Add("Accept", "application/json")
    $wc.Headers.Add("Content-Type", "application/json")
    $wc.Headers.Add("Authorization", "Bearer $token")
    try {
        if ($body) { $r = $wc.UploadString($url, $method, $body) }
        else { $r = $wc.DownloadString($url) }
        $obj = $r | ConvertFrom-Json
        $msg = if ($obj.message) { $obj.message } else { "success" }
        Write-Host "OK   [$label]: $msg"
    } catch [System.Net.WebException] {
        $code = [int]$_.Exception.Response.StatusCode
        $stream = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "FAIL [$label] HTTP $code : $($stream.ReadToEnd())"
    }
}

Test-Endpoint "GET    settings"        "GET"  "http://localhost:8000/api/settings"
Test-Endpoint "PUT    profile"         "PUT"  "http://localhost:8000/api/settings/profile"       '{"name":"Super Admin","email":"admin@mediTrack.com","timezone":"UTC","language":"en"}'
Test-Endpoint "PUT    pharmacy"        "PUT"  "http://localhost:8000/api/settings/pharmacy"      '{"pharmacy_name":"MediTrack Pharmacy","tax_rate":"10","currency":"UGX"}'
Test-Endpoint "PUT    notifications"   "PUT"  "http://localhost:8000/api/settings/notifications" '{"email_notifications":true,"low_stock_alerts":true,"expiry_alerts":true}'
Test-Endpoint "PUT    security"        "PUT"  "http://localhost:8000/api/settings/security"      '{"two_factor_enabled":false,"session_timeout":30,"password_expiry":90,"login_attempts":5}'
Test-Endpoint "PUT    system"          "PUT"  "http://localhost:8000/api/settings/system"        '{"auto_backup":true,"backup_frequency":"daily","data_retention":365,"maintenance_mode":false,"debug_mode":false,"cache_enabled":true}'
Test-Endpoint "POST   password(wrong)" "POST" "http://localhost:8000/api/settings/password"      '{"current_password":"wrongpass","password":"Test1234!","password_confirmation":"Test1234!"}'
Test-Endpoint "POST   clear-cache"     "POST" "http://localhost:8000/api/settings/clear-cache"   '{}'
Test-Endpoint "POST   optimize-db"     "POST" "http://localhost:8000/api/settings/optimize-database" '{}'
Test-Endpoint "GET    export"          "GET"  "http://localhost:8000/api/settings/export"
