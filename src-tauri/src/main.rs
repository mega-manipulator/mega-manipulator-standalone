#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

use std::sync::{Arc, Mutex};
//use tokio::process::Command;

struct MyState {
    count: Arc<Mutex<u32>>,
}

#[tauri::command]
fn my_custom_command(state: tauri::State<'_, MyState>) -> u32 {
    /*
    match Command::new("echo").arg("hello").arg("world").output().await {
        Ok(out) => println!("Output: {:?}", out),
        Err(e) => println!("Error: {:?}", e),
    }
     */

    let increased: u32 = *state.count.lock().unwrap() + 1;
    let mut thing = state.count.lock().unwrap();
    *thing = increased;
    println!("I was invoked from JS! {:?}", increased);

    increased
}

fn main() {
    let context = tauri::generate_context!();

    tauri::Builder::default()
        .menu(if cfg!(target_os = "macos") {
            tauri::Menu::os_default(&context.package_info().name)
        } else {
            tauri::Menu::default()
        })
        // This is where you pass in your commands
        .invoke_handler(tauri::generate_handler![my_custom_command])
        .manage(MyState { count: Arc::new(Mutex::new(0)) })
        .run(context)
        .expect("error while running tauri application");
}
