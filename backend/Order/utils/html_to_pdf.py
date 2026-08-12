import atexit
import queue
import threading

from playwright.sync_api import sync_playwright


_task_queue = queue.Queue()
_renderer_ready = threading.Event()
_renderer_thread = None
_renderer_start_error = None


def _render_pdf(browser, html: str) -> bytes:
    page = browser.new_page(
        viewport={
            "width": 219,
            "height": 1000,
        },
        device_scale_factor=1,
    )

    try:
        page.set_content(
            html,
            wait_until="domcontentloaded",
        )

        page.emulate_media(media="print")

        page.evaluate(
            """
            async () => {
                if (document.fonts) {
                    await document.fonts.ready;
                }
            }
            """
        )

        receipt_end = page.locator("#receipt-end")

        if receipt_end.count() == 0:
            raise ValueError("Missing #receipt-end in invoice.html")

        dimensions = receipt_end.evaluate(
            """
            element => {
                const receipt = document.querySelector(".receipt");

                if (!receipt) {
                    throw new Error("Missing .receipt element");
                }

                const receiptRect = receipt.getBoundingClientRect();
                const endRect = element.getBoundingClientRect();

                return {
                    receiptTop: receiptRect.top,
                    endBottom: endRect.bottom
                };
            }
            """
        )

        content_height_px = dimensions["endBottom"] - dimensions["receiptTop"]
        total_height_px = content_height_px + 12

        height_mm = total_height_px * 25.4 / 96
        height_mm = max(height_mm, 40)
        height_mm = min(height_mm, 1000)

        return page.pdf(
            width="58mm",
            height=f"{height_mm:.2f}mm",
            margin={
                "top": "0mm",
                "right": "0mm",
                "bottom": "0mm",
                "left": "0mm",
            },
            print_background=True,
            prefer_css_page_size=False,
        )

    finally:
        page.close()


def _renderer_main():
    global _renderer_start_error

    playwright = None
    browser = None

    try:
        playwright = sync_playwright().start()
        browser = playwright.chromium.launch(
            headless=True,
            args=[
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-gpu",
                "--disable-extensions",
                "--disable-background-networking",
                "--disable-background-timer-throttling",
                "--disable-renderer-backgrounding",
            ],
        )
    except Exception as exc:
        _renderer_start_error = exc
    finally:
        _renderer_ready.set()

    if _renderer_start_error is not None:
        return

    while True:
        task = _task_queue.get()

        if task is None:
            break

        html, result_queue = task

        try:
            result_queue.put((True, _render_pdf(browser, html)))
        except Exception as exc:
            result_queue.put((False, exc))

    if browser is not None and browser.is_connected():
        browser.close()

    if playwright is not None:
        playwright.stop()


def _ensure_renderer_started():
    global _renderer_thread

    if _renderer_thread is not None and _renderer_thread.is_alive():
        return

    _renderer_thread = threading.Thread(
        target=_renderer_main,
        name="invoice-pdf-renderer",
        daemon=True,
    )
    _renderer_thread.start()
    _renderer_ready.wait()

    if _renderer_start_error is not None:
        raise _renderer_start_error


def _shutdown_renderer():
    if _renderer_thread is not None and _renderer_thread.is_alive():
        _task_queue.put(None)
        _renderer_thread.join(timeout=5)


atexit.register(_shutdown_renderer)


def html_to_pdf(html: str) -> bytes:
    _ensure_renderer_started()

    result_queue = queue.Queue(maxsize=1)
    _task_queue.put((html, result_queue))

    success, payload = result_queue.get()

    if success:
        return payload

    raise payload