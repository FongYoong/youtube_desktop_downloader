use tauri::{Menu, MenuItem, Submenu, CustomMenuItem, WindowMenuEvent};

pub fn generate_menu() -> Menu {
    // Top Menu
    let menu = Menu::new()
    .add_item(CustomMenuItem::new("about", "About"))
    .add_item(CustomMenuItem::new("supported_sites", "Supported Sites"));
    menu
}

pub fn on_menu_event(event: WindowMenuEvent) {
    let window = event.window().clone();
    match event.menu_item_id() {
        "about" => {
            window.emit("menu_about", 0).unwrap();
        }
        "supported_sites" => {
            window.emit("menu_supported_sites", 0).unwrap();
        }
        _ => {}
    }
}