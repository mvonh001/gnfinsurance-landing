' Generic hidden runner for .cmd tasks (same pattern as callqa run_silent.vbs).
' Usage: wscript.exe run_hidden.vbs "C:\full\path\to\script.cmd"
Set sh = CreateObject("WScript.Shell")
code = sh.Run("cmd /c """ & WScript.Arguments(0) & """", 0, True)
WScript.Quit code
