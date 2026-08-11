from playwright.sync_api import sync_playwright


_playwright = None
_browser = None


def _get_browser():
    global _playwright, _browser

    if _browser is None:
        _playwright = sync_playwright().start()

        _browser = _playwright.chromium.launch(
            headless=True
        )

    return _browser


def html_to_pdf(html: str) -> bytes:

    browser = _get_browser()

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
            wait_until="networkidle",
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
            raise ValueError(
                "Missing #receipt-end in invoice.html"
            )

        dimensions = receipt_end.evaluate(
            """
            element => {

                const receipt =
                    document.querySelector(".receipt");

                const receiptRect =
                    receipt.getBoundingClientRect();

                const endRect =
                    element.getBoundingClientRect();

                return {
                    receiptTop: receiptRect.top,
                    endBottom: endRect.bottom
                };
            }
            """
        )

        receipt_top = dimensions["receiptTop"]
        end_bottom = dimensions["endBottom"]

        content_height_px = (
            end_bottom - receipt_top
        )

        bottom_padding_px = 12

        total_height_px = (
            content_height_px +
            bottom_padding_px
        )

        height_mm = (
            total_height_px * 25.4 / 96
        )

        height_mm = max(height_mm, 40)
        height_mm = min(height_mm, 1000)

        print(
            f"Receipt height: "
            f"{content_height_px}px"
        )

        print(
            f"PDF height: "
            f"{height_mm:.2f}mm"
        )

        pdf_bytes = page.pdf(
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

        return pdf_bytes

    finally:
        page.close()