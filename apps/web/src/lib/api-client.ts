export class ApiClientError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  const json = (await res.json().catch(() => null)) as
    | { ok: true; data: T }
    | { ok: false; error: { code: string } }
    | null;
  if (!json || !("ok" in json) || !json.ok) {
    throw new ApiClientError(json && "error" in json ? json.error.code : "unknown", res.status);
  }
  return json.data;
};

export const apiGet = <T>(url: string): Promise<T> => request<T>(url);

export const apiPost = <T>(url: string, body?: unknown): Promise<T> =>
  request<T>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const apiPatch = <T>(url: string, body: unknown): Promise<T> =>
  request<T>(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

/** multipart-загрузка: content-type выставляет браузер (boundary). */
export const apiUpload = <T>(url: string, form: FormData): Promise<T> =>
  request<T>(url, { method: "POST", body: form });
