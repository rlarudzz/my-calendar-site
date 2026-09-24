@echo off
chcp 65001 >nul
setlocal

echo KH Calendar Widget을 제거합니다...
taskkill /IM KHCalendarWidget.exe /F >nul 2>&1
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "KH Calendar Widget" /f >nul 2>&1

set "DEST=%LOCALAPPDATA%\KHCalendarWidget"
if exist "%USERPROFILE%\Desktop\KH Calendar Widget.lnk" del /q "%USERPROFILE%\Desktop\KH Calendar Widget.lnk"
if exist "%DEST%" rmdir /s /q "%DEST%"

echo 제거 완료.
pause
endlocal