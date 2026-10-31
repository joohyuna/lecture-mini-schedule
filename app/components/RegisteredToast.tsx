"use client";

import { useEffect, useState } from "react";

const REGISTERED_FLAG = "mini-diary:registered";

/** AuthForm이 가입 직후 호출한다. 메인 화면으로 넘어간 뒤 토스트를 띄우기 위한 1회용 표시. */
export function markRegistered() {
  try {
    sessionStorage.setItem(REGISTERED_FLAG, "1");
  } catch {
    // 저장소를 쓸 수 없으면 토스트만 생략한다. 가입 자체에는 영향 없음.
  }
}

/** 가입 직후 메인 화면에서 완료 안내를 한 번만 보여준다. */
export default function RegisteredToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(REGISTERED_FLAG)) {
        sessionStorage.removeItem(REGISTERED_FLAG);
        setShow(true);
      }
    } catch {
      // 저장소를 읽을 수 없으면 토스트를 띄우지 않는다.
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    const id = window.setTimeout(() => setShow(false), 3000);
    return () => window.clearTimeout(id);
  }, [show]);

  if (!show) return null;

  return (
    <p className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-800 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900">
      회원가입이 완료되었습니다
    </p>
  );
}
