$port = 5000
$tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($tcp) {
    foreach ($c in $tcp) {
        $p = $c.OwningProcess
        if ($p -gt 0) {
            Write-Host "Killing PID $p"
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "Done"
