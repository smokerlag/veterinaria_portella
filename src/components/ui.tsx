"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

type Props = {
  title: string;
  triggerLabel: string;
  triggerClassName?: string;
  openOnMount?: boolean;
  children: (close: () => void) => ReactNode;
  onOpen?: () => void;
};

export function Modal({
  open,
  title,
  onClose,
  nested = false,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  nested?: boolean;
  children: ReactNode;
}) {
  const backdropPointerDown = useRef(false);
  if (!open) return null;
  return (
    <div
      className={`modal-backdrop${nested ? " nested" : ""}`}
      onPointerDown={(event) => {
        backdropPointerDown.current = event.target === event.currentTarget;
      }}
      onPointerUp={(event) => {
        const clickedBackdrop =
          backdropPointerDown.current && event.target === event.currentTarget;
        backdropPointerDown.current = false;
        if (clickedBackdrop) onClose();
      }}
      onPointerCancel={() => {
        backdropPointerDown.current = false;
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="btn secondary small" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function ModalForm({
  title,
  triggerLabel,
  triggerClassName = "btn",
  openOnMount = false,
  children,
  onOpen,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (openOnMount) setOpen(true);
  }, [openOnMount]);

  function openModal() {
    onOpen?.();
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button type="button" className={triggerClassName} onClick={openModal}>
        {triggerLabel}
      </button>
      <Modal open={open} title={title} onClose={close}>
        {children(close)}
      </Modal>
    </>
  );
}

export function SubmitRow({
  onCancel,
  submitLabel = "Guardar",
}: {
  onCancel: () => void;
  submitLabel?: string;
}) {
  return (
    <div className="actions" style={{ marginTop: "0.5rem" }}>
      <button type="submit" className="btn">
        {submitLabel}
      </button>
      <button type="button" className="btn secondary" onClick={onCancel}>
        Cancelar
      </button>
    </div>
  );
}

export async function apiJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Error en la solicitud");
  }
  return res.json();
}

/** Deja solo dígitos y corta al máximo (DNI/celular). */
export function onDigitsOnly(
  e: FormEvent<HTMLInputElement>,
  maxLen: number
) {
  e.currentTarget.value = e.currentTarget.value
    .replace(/\D/g, "")
    .slice(0, maxLen);
}

export function handleForm(
  e: FormEvent<HTMLFormElement>,
  onSubmit: (data: FormData) => Promise<void>
) {
  e.preventDefault();
  const form = e.currentTarget;
  const data = new FormData(form);
  return onSubmit(data);
}
