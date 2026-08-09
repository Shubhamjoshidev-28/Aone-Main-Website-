from playwright.sync_api import sync_playwright


def html_to_pdf(html: str) -> bytes:

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=True
        )

        page = browser.new_page(
            viewport={
                "width": 219,
                "height": 1000,
            },
            device_scale_factor=1,
        )

        page.set_content(
            html,
            wait_until="networkidle",
        )

        # Render and measure the receipt in print mode so screen-only
        # spacing cannot leak into the exported PDF.
        page.emulate_media(media="print")

        # Make sure fonts have finished loading.
        page.evaluate(
            """
            async () => {
                if (document.fonts) {
                    await document.fonts.ready;
                }
            }
            """
        )

        # -------------------------------------------------
        # FIND RECEIPT END
        # -------------------------------------------------

        receipt_end = page.locator("#receipt-end")

        if receipt_end.count() == 0:
            browser.close()

            raise ValueError(
                "Missing #receipt-end in invoice.html"
            )

        # -------------------------------------------------
        # MEASURE RECEIPT
        # -------------------------------------------------

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

        # Actual receipt height in CSS pixels.
        content_height_px = (
            end_bottom - receipt_top
        )

        # Small bottom breathing room.
        bottom_padding_px = 12

        total_height_px = (
            content_height_px +
            bottom_padding_px
        )

        # -------------------------------------------------
        # PX → MM
        # -------------------------------------------------

        height_mm = (
            total_height_px * 25.4 / 96
        )

        # Safety limits.
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

        # -------------------------------------------------
        # GENERATE PDF
        # -------------------------------------------------

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

            # VERY IMPORTANT
            prefer_css_page_size=False,
        )

        browser.close()

        return pdf_bytes