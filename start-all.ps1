$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$apis = @(
    "src\backend\Usuarios.API",
    "src\backend\Clientes.API",
    "src\backend\Emprestimos.API",
    "src\backend\Notificacoes.API",
    "src\backend\Reports.API",
    "src\backend\Gateway"
)

foreach ($api in $apis) {
    $nome = Split-Path -Leaf $api
    Start-Process cmd -ArgumentList "/k dotnet run --project $api" -WorkingDirectory $root -WindowStyle Normal
    Write-Host "▶ Iniciando $nome..."
}

Write-Host ""
Write-Host "✅ Todas as APIs iniciadas! Aguarde ~30s para subirem."
Write-Host ""
Write-Host "URLs disponíveis:"
Write-Host "  Usuarios.API   → http://localhost:5133"
Write-Host "  Clientes.API   → http://localhost:5156"
Write-Host "  Emprestimos.API → http://localhost:5276"
Write-Host "  Notificacoes.API → http://localhost:5243"
Write-Host "  Reports.API    → http://localhost:5169"
Write-Host "  Gateway        → http://localhost:5046/swagger"
