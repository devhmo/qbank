"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export default function ImageUploadField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);

    const supabase = createClient();
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("question-images")
      .upload(path, file);

    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("question-images").getPublicUrl(path);

    onChange(publicUrl);
  }

  function handleRemove() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        Image <span className="font-normal text-slate-400">(optional)</span>
      </label>

      {value ? (
        <div className="mt-2 flex items-start gap-4">
          <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200">
            <Image
              src={value}
              alt="Question illustration"
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Remove image
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
        />
      )}

      {uploading && (
        <p className="mt-1 text-sm text-slate-500">Uploading...</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
