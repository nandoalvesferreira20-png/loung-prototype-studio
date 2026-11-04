"use client";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
export function DraftPreview({
  width,
  children,
}: {
  width: number;
  children: ReactNode;
}) {
  const [body, setBody] = useState<HTMLElement | null>(null);
  return (
    <iframe
      title="Preview"
      style={{ width, height: 760, border: 0, display: "block" }}
      srcDoc={
        '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{margin:0}</style></head><body></body></html>'
      }
      onLoad={(e) => {
        const doc = e.currentTarget.contentDocument;
        if (!doc) return;
        document
          .querySelectorAll('style,link[rel="stylesheet"]')
          .forEach((node) => doc.head.appendChild(node.cloneNode(true)));
        setBody(doc.body);
      }}
    >
      {body && createPortal(children, body)}
    </iframe>
  );
}
