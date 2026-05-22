//! tracing 日志初始化。
//!
//! Spec ref: `spec/15_logging.html` § 4 4 级策略 / § 5 路径 / § 6 滚动 + 保留 7 天
//! M0 范围：daily rolling + 0600 (umask) + 7 天 purge + RedactLayer 占位
//! 不含：5 MB 单文件分片（M1 补）/ WebView IPC log_write 合流（M1）/ 导出 zip（D-N5）

pub mod redact;

use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};

use tracing_appender::non_blocking::WorkerGuard;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

const FILE_PREFIX: &str = "jsonita";
const FILE_SUFFIX: &str = "log";
const RETAIN_DAYS: u64 = 7;

/// 启动期调一次。返回 `WorkerGuard` 必须 bind 在 main 局部变量上 ──
/// drop 时触发 tracing-appender flush（spec/15 § 2.5 注意点）。
pub fn init() -> Option<WorkerGuard> {
    // POSIX umask 强制新文件 0600（spec/15 § 6 权限要求）── 设在任何 file open 之前
    #[cfg(unix)]
    unsafe {
        libc::umask(0o077);
    }

    let log_dir = resolve_log_dir()?;
    if let Err(e) = std::fs::create_dir_all(&log_dir) {
        eprintln!(
            "[logging] failed to create log dir {}: {}",
            log_dir.display(),
            e
        );
        return None;
    }

    // 启动期清理 > 7 天的旧文件
    purge_old(&log_dir, RETAIN_DAYS);
    // 顺手把现存文件的 mode 拉到 0600（umask 只影响新创建）
    #[cfg(unix)]
    restrict_existing(&log_dir);

    let appender = RollingFileAppender::builder()
        .rotation(Rotation::DAILY)
        .filename_prefix(FILE_PREFIX)
        .filename_suffix(FILE_SUFFIX)
        .build(&log_dir)
        .ok()?;

    let (non_blocking, guard) = tracing_appender::non_blocking(appender);

    let env_filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("jsonita=info,warn"));

    let fmt_layer = tracing_subscriber::fmt::layer()
        .json()
        .with_target(true)
        .with_current_span(false)
        .with_span_list(false)
        .flatten_event(true)
        .with_writer(non_blocking);

    tracing_subscriber::registry()
        .with(env_filter)
        .with(redact::RedactLayer)
        .with(fmt_layer)
        .init();

    Some(guard)
}

#[cfg(target_os = "macos")]
fn resolve_log_dir() -> Option<PathBuf> {
    Some(dirs::home_dir()?.join("Library").join("Logs").join("Jsonita"))
}

#[cfg(not(target_os = "macos"))]
fn resolve_log_dir() -> Option<PathBuf> {
    Some(
        dirs::data_local_dir()?
            .join("Jsonita")
            .join("logs"),
    )
}

fn purge_old(dir: &Path, retain_days: u64) {
    let cutoff = SystemTime::now() - Duration::from_secs(retain_days * 86_400);
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let Ok(meta) = entry.metadata() else {
            continue;
        };
        let Ok(modified) = meta.modified() else {
            continue;
        };
        if modified < cutoff {
            let _ = std::fs::remove_file(entry.path());
        }
    }
}

#[cfg(unix)]
fn restrict_existing(dir: &Path) {
    use std::os::unix::fs::PermissionsExt;
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let _ = std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600));
    }
}
