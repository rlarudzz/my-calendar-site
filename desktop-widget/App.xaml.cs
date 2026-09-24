using System.IO;
using System.Threading;
using System.Windows;
using System.Windows.Threading;

namespace KHCalendarWidget;

public partial class App : System.Windows.Application
{
    private const string MutexName = "Local\\KHCalendarWidget_SingleInstance_2026";
    private const string ShowEventName = "Local\\KHCalendarWidget_Show_2026";

    private Mutex? _mutex;
    private EventWaitHandle? _showEvent;
    private CancellationTokenSource? _listenerCts;

    protected override void OnStartup(StartupEventArgs e)
    {
        _mutex = new Mutex(true, MutexName, out var createdNew);

        if (!createdNew)
        {
            try
            {
                using var evt = EventWaitHandle.OpenExisting(ShowEventName);
                evt.Set();
            }
            catch { }

            Shutdown();
            return;
        }

        base.OnStartup(e);

        DispatcherUnhandledException += OnDispatcherUnhandledException;

        _showEvent = new EventWaitHandle(false, EventResetMode.AutoReset, ShowEventName);
        _listenerCts = new CancellationTokenSource();
        StartShowListener(_listenerCts.Token);

        var window = new MainWindow();
        MainWindow = window;
        window.Show();
        window.Activate();
    }

    private void StartShowListener(CancellationToken token)
    {
        _ = Task.Run(() =>
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    _showEvent?.WaitOne();
                    if (token.IsCancellationRequested) break;

                    Dispatcher.Invoke(() =>
                    {
                        if (MainWindow is MainWindow window)
                            window.ShowFromExternalLaunch();
                    });
                }
                catch
                {
                    break;
                }
            }
        }, token);
    }

    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        try
        {
            var dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "KHCalendarWidget");
            Directory.CreateDirectory(dir);
            File.WriteAllText(Path.Combine(dir, "crash.log"), e.Exception.ToString());
        }
        catch { }

        System.Windows.MessageBox.Show(
            "위젯 실행 중 오류가 발생했습니다.\n\n" +
            e.Exception.Message +
            "\n\n오류 기록: %LOCALAPPDATA%\\KHCalendarWidget\\crash.log",
            "KH Calendar Widget",
            MessageBoxButton.OK,
            MessageBoxImage.Error);

        e.Handled = true;
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _listenerCts?.Cancel();
        try { _showEvent?.Set(); } catch { }
        _showEvent?.Dispose();

        try { _mutex?.ReleaseMutex(); } catch { }
        _mutex?.Dispose();

        base.OnExit(e);
    }
}