using Microsoft.Web.WebView2.Core;
using Microsoft.Win32;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Threading;
using WinForms = System.Windows.Forms;

namespace KHCalendarWidget;

public partial class MainWindow : Window
{
    private const string WidgetUrl = "https://rlarudzz.github.io/my-calendar-site/widget.html";
    private const string RunKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Run";
    private const string RunValueName = "KH Calendar Widget";

    private readonly string _stateDir =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "KHCalendarWidget");
    private readonly DispatcherTimer _saveTimer = new() { Interval = TimeSpan.FromMilliseconds(500) };

    private WinForms.NotifyIcon? _tray;
    private WinForms.ToolStripMenuItem? _autoStartMenu;
    private bool _allowExit;
    private bool _loadedState;

    public MainWindow()
    {
        InitializeComponent();

        SourceInitialized += (_, _) => ApplyRoundedCorners();
        Loaded += OnLoaded;
        LocationChanged += (_, _) => ScheduleSave();
        SizeChanged += (_, _) => ScheduleSave();

        _saveTimer.Tick += (_, _) =>
        {
            _saveTimer.Stop();
            SaveWindowState();
        };
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        Directory.CreateDirectory(_stateDir);
        LoadWindowState();
        CreateTrayIcon();

        try
        {
            var userData = Path.Combine(_stateDir, "WebView2");
            var env = await CoreWebView2Environment.CreateAsync(userDataFolder: userData);
            await Web.EnsureCoreWebView2Async(env);

            Web.CoreWebView2.Settings.AreDevToolsEnabled = false;
            Web.CoreWebView2.Settings.IsStatusBarEnabled = false;
            Web.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            Web.CoreWebView2.Settings.IsZoomControlEnabled = false;
            Web.CoreWebView2.WebMessageReceived += OnWebMessage;
            Web.CoreWebView2.NewWindowRequested += OnNewWindowRequested;

            Web.Source = new Uri(WidgetUrl + "?desktop=1&t=" + DateTimeOffset.UtcNow.ToUnixTimeSeconds());
        }
        catch (Exception ex)
        {
            System.Windows.MessageBox.Show(
                "WebView2를 시작하지 못했습니다. Microsoft Edge WebView2 Runtime이 설치되어 있는지 확인해주세요.\n\n" +
                ex.Message,
                "KH Calendar Widget",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);

            try
            {
                Process.Start(new ProcessStartInfo(
                    "https://developer.microsoft.com/en-us/microsoft-edge/webview2/")
                { UseShellExecute = true });
            }
            catch { }
        }
    }

    private void OnNewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        e.Handled = true;
        try
        {
            Process.Start(new ProcessStartInfo(e.Uri) { UseShellExecute = true });
        }
        catch { }
    }

    private void OnWebMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            using var doc = JsonDocument.Parse(e.WebMessageAsJson);
            var root = doc.RootElement;
            if (!root.TryGetProperty("type", out var typeNode)) return;
            var type = typeNode.GetString();

            if (type is "ready" or "widget-settings")
            {
                if (root.TryGetProperty("opacity", out var opacityNode) && opacityNode.TryGetDouble(out var opacity))
                    Opacity = Math.Clamp(opacity / 100.0, 0.55, 1.0);

                if (root.TryGetProperty("size", out var sizeNode))
                    ApplySizePreset(sizeNode.GetString());

                if (root.TryGetProperty("autoStart", out var autoNode) &&
                    (autoNode.ValueKind is JsonValueKind.True or JsonValueKind.False))
                {
                    SetAutoStart(autoNode.GetBoolean());
                    RefreshAutoStartMenu();
                }
            }
            else if (type == "hide")
            {
                Hide();
            }
            else if (type == "drag")
            {
                BeginNativeDrag();
            }
        }
        catch { }
    }

    private void ApplySizePreset(string? size)
    {
        var target = size switch
        {
            "small" => (360d, 560d),
            "large" => (520d, 800d),
            _ => (440d, 680d)
        };

        if (Math.Abs(Width - target.Item1) > 2 || Math.Abs(Height - target.Item2) > 2)
        {
            Width = target.Item1;
            Height = target.Item2;
            KeepInsideWorkArea();
        }
    }

    private void CreateTrayIcon()
    {
        _tray = new WinForms.NotifyIcon
        {
            Icon = SystemIcons.Application,
            Text = "KH Calendar Widget",
            Visible = true
        };

        var menu = new WinForms.ContextMenuStrip();
        menu.Items.Add("위젯 열기", null, (_, _) => ShowWidget());
        menu.Items.Add("위젯 숨기기", null, (_, _) => Hide());

        _autoStartMenu = new WinForms.ToolStripMenuItem("Windows 로그인 시 자동 실행")
        {
            CheckOnClick = true,
            Checked = IsAutoStartEnabled()
        };
        _autoStartMenu.CheckedChanged += (_, _) =>
        {
            if (_autoStartMenu is not null)
                SetAutoStart(_autoStartMenu.Checked);
        };
        menu.Items.Add(_autoStartMenu);
        menu.Items.Add(new WinForms.ToolStripSeparator());
        menu.Items.Add("완전히 종료", null, (_, _) =>
        {
            _allowExit = true;
            Close();
        });

        _tray.ContextMenuStrip = menu;
        _tray.DoubleClick += (_, _) => ShowWidget();
    }

    private void ShowWidget()
    {
        Show();
        WindowState = WindowState.Normal;
        Activate();
    }

    protected override void OnClosing(System.ComponentModel.CancelEventArgs e)
    {
        if (!_allowExit)
        {
            e.Cancel = true;
            Hide();
            return;
        }

        SaveWindowState();
        if (_tray is not null)
        {
            _tray.Visible = false;
            _tray.Dispose();
        }
        base.OnClosing(e);
    }

    private void SetAutoStart(bool enabled)
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(RunKeyPath, writable: true);
            if (key is null) return;

            if (enabled)
            {
                var exe = Environment.ProcessPath;
                if (!string.IsNullOrWhiteSpace(exe))
                    key.SetValue(RunValueName, $"\"{exe}\" --autostart");
            }
            else
            {
                key.DeleteValue(RunValueName, throwOnMissingValue: false);
            }
        }
        catch { }
    }

    private bool IsAutoStartEnabled()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(RunKeyPath);
            return key?.GetValue(RunValueName) is string;
        }
        catch { return false; }
    }

    private void RefreshAutoStartMenu()
    {
        if (_autoStartMenu is not null)
            _autoStartMenu.Checked = IsAutoStartEnabled();
    }

    private void LoadWindowState()
    {
        var path = Path.Combine(_stateDir, "window.json");
        if (File.Exists(path))
        {
            try
            {
                var state = JsonSerializer.Deserialize<WindowStateData>(File.ReadAllText(path));
                if (state is not null)
                {
                    Width = Math.Max(MinWidth, state.Width);
                    Height = Math.Max(MinHeight, state.Height);
                    Left = state.Left;
                    Top = state.Top;
                    Opacity = Math.Clamp(state.Opacity, 0.55, 1.0);
                    KeepInsideWorkArea();
                    _loadedState = true;
                    return;
                }
            }
            catch { }
        }

        Left = SystemParameters.WorkArea.Right - Width - 24;
        Top = SystemParameters.WorkArea.Top + 24;
        _loadedState = true;
    }

    private void KeepInsideWorkArea()
    {
        var wa = SystemParameters.WorkArea;
        if (Left < wa.Left) Left = wa.Left + 8;
        if (Top < wa.Top) Top = wa.Top + 8;
        if (Left + Width > wa.Right) Left = Math.Max(wa.Left + 8, wa.Right - Width - 8);
        if (Top + Height > wa.Bottom) Top = Math.Max(wa.Top + 8, wa.Bottom - Height - 8);
    }

    private void ScheduleSave()
    {
        if (!_loadedState) return;
        _saveTimer.Stop();
        _saveTimer.Start();
    }

    private void SaveWindowState()
    {
        if (!_loadedState || WindowState == WindowState.Minimized) return;
        try
        {
            Directory.CreateDirectory(_stateDir);
            var data = new WindowStateData
            {
                Left = Left,
                Top = Top,
                Width = Width,
                Height = Height,
                Opacity = Opacity
            };
            File.WriteAllText(
                Path.Combine(_stateDir, "window.json"),
                JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true }));
        }
        catch { }
    }

    private void BeginNativeDrag()
    {
        try
        {
            var hwnd = new WindowInteropHelper(this).Handle;
            ReleaseCapture();
            SendMessage(hwnd, WM_NCLBUTTONDOWN, (IntPtr)HTCAPTION, IntPtr.Zero);
        }
        catch { }
    }

    private void ApplyRoundedCorners()
    {
        try
        {
            var hwnd = new WindowInteropHelper(this).Handle;
            var preference = 2; // DWMWCP_ROUND
            DwmSetWindowAttribute(hwnd, 33, ref preference, sizeof(int));
        }
        catch { }
    }

    private const int WM_NCLBUTTONDOWN = 0x00A1;
    private const int HTCAPTION = 2;

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool ReleaseCapture();

    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(
        IntPtr hwnd,
        int dwAttribute,
        ref int pvAttribute,
        int cbAttribute);

    private sealed class WindowStateData
    {
        public double Left { get; set; }
        public double Top { get; set; }
        public double Width { get; set; } = 440;
        public double Height { get; set; } = 680;
        public double Opacity { get; set; } = 1;
    }
}