#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

use log::LevelFilter;
use tauri_plugin_log::{LoggerBuilder, LogTarget, RotationStrategy};

#[tauri::command]
fn store_password(username: String, password: String) -> Result<(), String> {
    let service = "mega-manipipulator";
    let entry = keyring::Entry::new(&service, &username);

    match entry.set_password(&password) {
        Ok(p) => Ok(p),
        Err(e) => Err(format!("Failed setting password. {:?}", e).into()),
    }
}

#[tauri::command]
fn get_password(username: String) -> Result<String, String> {
    let service = "mega-manipipulator";
    let entry = keyring::Entry::new(&service, &username);
    match entry.get_password() {
        Ok(p) => Ok(p),
        Err(e) => Err(format!("Failed getting password. {:?}", e).into()),
    }
}

fn main() {
    let context = tauri::generate_context!();

    tauri::Builder::default()
        .plugin(tauri_plugin_store::PluginBuilder::default().build())
        .plugin(
            LoggerBuilder::default()
                .level(LevelFilter::Debug)
                .targets([
                    LogTarget::LogDir,
                    LogTarget::Stdout,
                    LogTarget::Webview,
                ])
                .rotation_strategy(RotationStrategy::KeepAll)
                .build(),
        )
        .menu(if cfg!(target_os = "macos") {
            tauri::Menu::os_default(&context.package_info().name)
        } else {
            tauri::Menu::default()
        })
        // This is where you pass in your commands
        .invoke_handler(tauri::generate_handler![store_password, get_password])
        .run(context)
        .expect("error while running tauri application");
}
