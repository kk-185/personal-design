@echo off
setlocal
pushd "%~dp0dist" || exit /b 1
set "portfolio_url=http://127.0.0.1:18527/"
powershell.exe -NoProfile -Command "$wc = New-Object Net.WebClient; $wc.Proxy = $null; try { $served = $wc.DownloadData('http://127.0.0.1:18527/index.html'); $local = [IO.File]::ReadAllBytes((Join-Path (Get-Location) 'index.html')); if ([Convert]::ToBase64String($served) -ceq [Convert]::ToBase64String($local)) { exit 0 }; exit 2 } catch { exit 1 } finally { $wc.Dispose() }"
if errorlevel 2 goto occupied
if not errorlevel 1 goto running
echo Open %portfolio_url% in your browser. Keep this window open while using the site.
where py.exe >nul 2>nul
if errorlevel 1 goto python
py -3 -m http.server 18527 --bind 127.0.0.1
goto finished
:python
python -m http.server 18527 --bind 127.0.0.1
:finished
if errorlevel 1 pause
goto end
:running
echo The portfolio is already running at %portfolio_url%
start "" "%portfolio_url%"
goto end
:occupied
echo Port 18527 is serving a different website. Open index.html directly to preview this portfolio.
pause
:end
popd
endlocal
