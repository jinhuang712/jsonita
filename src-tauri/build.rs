fn main() {
    // tauri_build 处理 frontendDist (../dist) 成嵌入资源；dist 内容变化时必须重跑 build.rs，
    // 否则 generate_context! 嵌入的还是旧资源（cargo 默认只在 tauri.conf.json 变化时重跑）。
    println!("cargo::rerun-if-changed=../dist");
    tauri_build::build()
}
