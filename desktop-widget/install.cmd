@echo off
chcp 65001 >nul
setlocal

set "DEST=%LOCALAPPDATA%\KHCalendarWidget"
echo.
echo [KH Calendar Widget] 설치를 시작합니다.
echo 설치 위치: %DEST%
echo.

taskkill /IM KHCalendarWidget.exe /F >nul 2>&1

if not exist "%DEST%" mkdir "%DEST%"
robocopy "%~dp0app" "%DEST%" /E /NFL /NDL /NJH /NJS /NP >nul

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws=New-Object -ComObject WScript.Shell; $lnk=$ws.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\KH Calendar Widget.lnk'); $lnk.TargetPath='%DEST%\KHCalendarWidget.exe'; $lnk.WorkingDirectory='%DEST%'; $lnk.Save()"

start "" "%DEST%\KHCalendarWidget.exe"

echo.
echo 설치 완료!
echo - 위젯은 다른 프로그램 위에 고정되지 않습니다.
echo - 톱니바퀴에서 투명도/크기/테마를 바꿀 수 있습니다.
echo - 작업표시줄 오른쪽 숨겨진 아이콘 영역에서 다시 열거나 종료할 수 있습니다.
echo.
pause
endlocal