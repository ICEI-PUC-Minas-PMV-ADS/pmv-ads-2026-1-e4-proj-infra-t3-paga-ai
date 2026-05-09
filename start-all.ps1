$root = $PSScriptRoot
$backend = Join-Path $root "src\backend"
$frontend = Join-Path $root "src\frontend"

$services = @(
    @{ Name = "Usuarios.API";    Path = Join-Path $backend "Usuarios.API";    Port = 5133 },
    @{ Name = "Clientes.API";    Path = Join-Path $backend "Clientes.API";    Port = 5156 },
    @{ Name = "Emprestimos.API"; Path = Join-Path $backend "Emprestimos.API"; Port = 5276 },
    @{ Name = "Notificacoes.API";Path = Join-Path $backend "Notificacoes.API";Port = 5243 },
    @{ Name = "Reports.API";     Path = Join-Path $backend "Reports.API";     Port = 5169 },
    @{ Name = "Gateway";         Path = Join-Path $backend "Gateway";         Port = 5046 }
)

foreach ($svc in $services) {
    Write-Host "Iniciando $($svc.Name) na porta $($svc.Port)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$($svc.Path)'; dotnet run --launch-profile http"
    Start-Sleep -Seconds 4
}

Write-Host "Iniciando Frontend (Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontend'; npm run dev"

Write-Host ""
Write-Host "Todos os servicos foram iniciados em janelas separadas." -ForegroundColor Green
Write-Host ""
Write-Host "URLs disponiveis:" -ForegroundColor Yellow
foreach ($svc in $services) {
    Write-Host "  $($svc.Name.PadRight(16)) -> http://localhost:$($svc.Port)" -ForegroundColor White
}
Write-Host "  Frontend         -> http://localhost:5173" -ForegroundColor White
Write-Host "  Gateway (Swagger)-> http://localhost:5046/swagger" -ForegroundColor White