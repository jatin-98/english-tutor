use tauri::{
    Emitter,
    Manager,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Called when the global shortcut is triggered.
/// Simulates Cmd+C (macOS) / Ctrl+C (Windows) to copy selected text,
/// then reads the clipboard and sends the text to the frontend.
fn handle_shortcut(app: &tauri::AppHandle) {
    let app_handle = app.clone();

    // Small delay to ensure the OS has time to process the copy
    std::thread::spawn(move || {
        // Simulate Ctrl+C / Cmd+C to copy selected text
        // This is handled by the frontend via a Tauri command
        if let Some(window) = app_handle.get_webview_window("main") {
            let _ = window.emit("shortcut-triggered", ());
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // ── Plugins ────────────────────────────────────────────────────
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        // ── Setup ──────────────────────────────────────────────────────
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Register global shortcut: Ctrl+Shift+G (Win/Linux) / Cmd+Shift+G (macOS)
            #[cfg(target_os = "macos")]
            let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyG);
            #[cfg(not(target_os = "macos"))]
            let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyG);

            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    handle_shortcut(&app_handle);
                }
            })?;

            // System tray setup
            let quit = MenuItemBuilder::new("Quit").id("quit").build(app)?;
            let show = MenuItemBuilder::new("Open Dashboard").id("show").build(app)?;
            let menu = MenuBuilder::new(app).items(&[&show, &quit]).build()?;

            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Suppress unused variable warning
            drop(tray);

            Ok(())
        })
        // ── Commands ───────────────────────────────────────────────────
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
