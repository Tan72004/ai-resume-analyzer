export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs() {
    if (pdfjsLib) return pdfjsLib;

    if (loadPromise) return loadPromise;

    loadPromise = import(
        "pdfjs-dist/build/pdf.mjs"
        ).then((lib) => {
        pdfjsLib = lib;
        return lib;
    });

    return loadPromise;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        if (typeof window === "undefined") {
            throw new Error(
                "PDF conversion must run in the browser."
            );
        }

        // Load PDF.js API
        const lib = await loadPdfJs();

        // Load worker from the SAME pdfjs-dist version
        const worker = await import(
            "pdfjs-dist/build/pdf.worker.min.mjs?url"
            );

        lib.GlobalWorkerOptions.workerSrc =
            worker.default;

        const arrayBuffer =
            await file.arrayBuffer();

        const pdf = await lib.getDocument({
            data: arrayBuffer,
        }).promise;

        const page = await pdf.getPage(1);

        const viewport =
            page.getViewport({
                scale: 4,
            });

        const canvas =
            document.createElement("canvas");

        const context =
            canvas.getContext("2d");

        if (!context) {
            throw new Error(
                "Could not create canvas context."
            );
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        await page.render({
            canvasContext: context,
            viewport,
        }).promise;

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error:
                                "Failed to create image blob.",
                        });

                        return;
                    }

                    const originalName =
                        file.name.replace(
                            /\.pdf$/i,
                            ""
                        );

                    const imageFile =
                        new File(
                            [blob],
                            `${originalName}.png`,
                            {
                                type: "image/png",
                            }
                        );

                    resolve({
                        imageUrl:
                            URL.createObjectURL(
                                blob
                            ),
                        file: imageFile,
                    });
                },
                "image/png",
                1.0
            );
        });
    } catch (err) {
        console.error(
            "PDF conversion error:",
            err
        );

        return {
            imageUrl: "",
            file: null,
            error:
                err instanceof Error
                    ? `Failed to convert PDF: ${err.message}`
                    : `Failed to convert PDF: ${String(err)}`,
        };
    }
}