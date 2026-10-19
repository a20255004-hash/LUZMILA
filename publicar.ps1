# Arma index.html desde src/ y lo publica en GitHub Pages.
# Uso: powershell -File C:\Users\ASUS\Mila\publicar.ps1 "mensaje del cambio"
param([string]$Mensaje = "Actualizar Mila")
$R = $PSScriptRoot
$git = "C:\Program Files\Git\cmd\git.exe"
$shell = [IO.File]::ReadAllText("$R\src\shell.html")
$css = [IO.File]::ReadAllText("$R\src\styles.css")
$js = (Get-ChildItem "$R\src\js" -Filter *.js | Sort-Object Name | ForEach-Object { "/* ---- " + $_.Name + " ---- */`n" + [IO.File]::ReadAllText($_.FullName) }) -join "`n"
$v = [string][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$out = $shell.Replace("/*__CSS__*/", $css).Replace("/*__JS__*/", $js).Replace("__V__", $v)
[IO.File]::WriteAllText("$R\index.html", $out, (New-Object Text.UTF8Encoding $false))
# Nueva versión del service worker para que navegador y app se actualicen
$sw = [IO.File]::ReadAllText("$R\sw.js") -replace 'const C = "mila-[^"]*";', "const C = `"mila-$v`";"
[IO.File]::WriteAllText("$R\sw.js", $sw, (New-Object Text.UTF8Encoding $false))
& $git -C $R add -A
& $git -C $R commit -q -m $Mensaje
& $git -C $R push -q origin HEAD
"Publicado: https://a20255004-hash.github.io/LUZMILA/"
