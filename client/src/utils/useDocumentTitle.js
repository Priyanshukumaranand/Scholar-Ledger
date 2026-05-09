import { useEffect } from "react";

const BASE = "Scholar Ledger";

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : BASE;
  }, [title]);
}
