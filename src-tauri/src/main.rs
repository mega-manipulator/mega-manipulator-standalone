#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

use std::fs;
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

#[tauri::command]
fn copy_dir(source: String, dest:String) -> Result<(), String> {
    println!("Copying from {:?} to {:?}", source, dest);
    let _ = fs::create_dir(&dest);
    let mut options = fs_extra::dir::CopyOptions::new();
    options.overwrite = true;
    let mut from_paths = Vec::new();
    from_paths.push(&source);
    match fs_extra::copy_items(&from_paths, &dest, &options) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("{:?}", e)),
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
        .invoke_handler(tauri::generate_handler![store_password, get_password, copy_dir])
        .run(context)
        .expect("error while running tauri application");
}
