use tauri::Manager;
use tauri::{AppHandle, CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayEvent};

pub fn generate_tray() -> SystemTray {
    // System tray
    let quit = CustomMenuItem::new("quit", "Quit");
    let tray_menu = SystemTrayMenu::new()
    .add_item(quit);

    let system_tray = SystemTray::new().with_menu(tray_menu);
    system_tray
}

pub fn on_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick {
            position: _,
            size: _,
            ..
        } => {
            let window = app.get_window("main").unwrap();
            window.unminimize().unwrap();
            window.show().unwrap();
            window.set_focus().unwrap();
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
          match id.as_str() {
            "quit" => {
                app.exit(0);

            }
            _ => {}
          }
        }
        _ => {}
    }
}