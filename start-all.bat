@echo off

start cmd /k "cd src\backend\Usuarios.API && dotnet run"
start cmd /k "cd src\backend\Clientes.API && dotnet run"
start cmd /k "cd src\backend\Reports.API && dotnet run"
start cmd /k "cd src\backend\Emprestimos.API && dotnet run"

start cmd /k "cd src\frontend && npm run dev"