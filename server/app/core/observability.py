from os import getenv


def init_observability() -> None:
    """Enable Sentry error tracking when SENTRY_DSN is set; no-op otherwise."""
    dsn = getenv("SENTRY_DSN")
    if not dsn:
        return
    try:
        import sentry_sdk
    except ImportError:
        print("[Observability] SENTRY_DSN is set but sentry-sdk is not installed.")
        return
    sentry_sdk.init(
        dsn=dsn,
        environment=getenv("SENTRY_ENVIRONMENT", "production"),
        traces_sample_rate=0,
        send_default_pii=False,
    )
