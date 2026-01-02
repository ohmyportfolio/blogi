"use client";

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

export interface ConfirmActionState {
  error?: string | null;
  success?: boolean;
}

interface ConfirmFormProps {
  action: (prevState: ConfirmActionState, formData: FormData) => Promise<ConfirmActionState>;
  message: string;
  title?: string;
  confirmText?: string;
  hiddenFields?: Record<string, string>;
  children: React.ReactNode;
}

export const ConfirmForm = ({
  action,
  message,
  title = "확인",
  confirmText = "확인",
  hiddenFields,
  children,
}: ConfirmFormProps) => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [state, formAction] = useActionState(action, { error: null, success: false });
  const [isPending, startTransition] = useTransition();
  const hasMounted = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (state?.error) {
      showToast(state.error, "error");
    } else if (state?.success) {
      showToast("처리가 완료되었습니다.", "success");
    }
  }, [state, showToast]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isPending) return;

      const confirmed = await confirm({
        title,
        message,
        confirmText,
        variant: "warning",
      });

      if (confirmed && formRef.current) {
        const formData = new FormData(formRef.current);
        startTransition(() => {
          formAction(formData);
        });
      }
    },
    [message, title, confirmText, confirm, formAction, isPending, startTransition]
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      {hiddenFields &&
        Object.entries(hiddenFields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      {children}
    </form>
  );
};
