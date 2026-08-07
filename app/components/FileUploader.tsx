import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "~/lib/util";

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
    const [file, setFile] = useState<File | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const uploadedFile = acceptedFiles[0] || null;

            setFile(uploadedFile);
            onFileSelect?.(uploadedFile);
        },
        [onFileSelect]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            "application/pdf": [".pdf"],
        },
        maxSize: 20 * 1024 * 1024, // 20 MB
    });

    return (
        <div className="w-full gradient-border">
            <div
                {...getRootProps()}
                className={`p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                    isDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                }`}
            >
                <input {...getInputProps()} />

                {file ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <img
                                src="/images/pdf.png"
                                alt="PDF"
                                className="size-10"
                            />

                            <div>
                                <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                    {file.name}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {formatSize(file.size)}
                                </p>

                                <p className="text-green-600 text-sm">
                                    File selected successfully
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevents opening the file picker
                                setFile(null);
                                onFileSelect?.(null);
                            }}
                            className="p-2 rounded-full hover:bg-gray-100"
                        >
                            <img
                                src="/icons.png"
                                alt="Remove"
                                className="w-5 h-5"
                            />
                        </button>
                    </div>

                ) : (
                    <div className="space-y-4 text-center">
                        <div className="mx-auto w-16 h-16 flex items-center justify-center">
                            <img
                                src="/icon.jpg"
                                alt="Upload"
                                className="size-20"
                            />
                        </div>

                        <div>
                            <p className="text-lg text-gray-500">
                                <span className="font-semibold">
                                    Click to upload
                                </span>{" "}
                                or drag and drop
                            </p>

                            <p className="text-sm text-gray-500">
                                PDF (max 20MB)
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploader;