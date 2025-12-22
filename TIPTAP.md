# TipTap 에디터 사용 가이드

## 개요

TipTap은 ProseMirror 기반의 헤드리스 리치 텍스트 에디터입니다. 이 문서는 프로젝트에서 TipTap을 사용할 때 참고해야 할 모범 사례와 패턴을 정리합니다.

---

## 설치된 확장 기능

```tsx
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
```

---

## Next.js SSR 설정

Next.js와 같은 SSR 프레임워크에서는 반드시 `immediatelyRender: false`를 설정해야 합니다.

```tsx
const editor = useEditor({
    extensions: [...],
    content,
    onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
    },
    immediatelyRender: false, // SSR에서 필수!
});
```

> TipTap은 클라이언트 사이드 에디터로 브라우저 API와 DOM에 의존합니다. 서버에서 렌더링하면 hydration 불일치 오류가 발생합니다.

---

## 툴바 버튼 구현 패턴

### 핵심 원칙

툴바 버튼을 클릭하면 브라우저가 해당 버튼에 포커스를 주어 에디터의 포커스가 사라집니다. 이를 방지하기 위한 패턴:

### 권장 패턴

```tsx
const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
}: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
}) => (
    <button
        type="button"
        onClick={() => {
            editor?.chain().focus().run(); // 먼저 에디터에 포커스
            onClick();                      // 그 다음 명령 실행
        }}
        onMouseDown={(e) => e.preventDefault()} // 포커스 이동 방지
        title={title}
        className={cn(
            "p-2 rounded hover:bg-gray-100 transition-colors",
            isActive && "bg-gray-200 text-blue-600"
        )}
    >
        {children}
    </button>
);
```

### 왜 이렇게 해야 하나?

1. **`onMouseDown={(e) => e.preventDefault()}`**: 버튼 클릭 시 브라우저의 기본 포커스 이동을 막습니다.
2. **`editor?.chain().focus().run()`**: 명령 실행 전에 에디터에 포커스를 명시적으로 복원합니다.

---

## 명령 체이닝 (Command Chaining)

TipTap의 모든 명령은 체이닝 패턴을 사용합니다:

```tsx
// 기본 패턴
editor.chain().focus().toggleBold().run()

// 여러 명령 연결
editor.chain().focus().toggleBold().toggleItalic().run()

// 포커스 위치 지정
editor.chain().focus('end').insertContent('텍스트').run()
```

### focus() 파라미터

| 값 | 설명 |
|---|---|
| (없음) | 이전 커서 위치 복원 |
| `'start'` | 문서 시작으로 이동 |
| `'end'` | 문서 끝으로 이동 |
| `'all'` | 전체 문서 선택 |
| `number` | 특정 위치로 이동 (예: 10) |

---

## 활성 상태 확인

### 기본 사용법

```tsx
editor.isActive('bold')                              // 굵게 활성화?
editor.isActive('heading', { level: 1 })             // H1 활성화?
editor.isActive('highlight', { color: '#fef08a' })   // 특정 색상 하이라이트?
editor.isActive({ textAlign: 'center' })             // 가운데 정렬?
```

### React에서 주의사항

React에서 `isActive()` 값은 자동으로 반응형이 아닙니다. 성능 문제를 피하기 위해 초기 에디터 상태 값만 반환합니다.

상태 변화를 구독하려면 `useEditorState` 훅을 사용하거나, 컴포넌트가 에디터 상태 변경 시 리렌더링되도록 설정해야 합니다.

---

## 명령 실행 가능 여부 확인

버튼을 표시하거나 숨기려면 `.can()` 메서드를 사용합니다:

```tsx
// 실행 가능 여부 확인
editor.can().toggleBold()

// 체인으로 확인
editor.can().chain().toggleBold().toggleItalic().run()
```

---

## 이미지 처리 주의사항

### Base64 사용 금지

```tsx
// ❌ 잘못된 방법 - 절대 사용하지 마세요
Image.configure({
    allowBase64: true,
})
```

Base64 이미지는 문서 크기를 급격히 증가시킵니다. 대신:

```tsx
// ✅ 올바른 방법 - 외부 스토리지 사용
const addImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
    });

    if (response.ok) {
        const { url } = await response.json();
        editor.chain().setImage({ src: url }).run();
    }
};
```

---

## 확장 기능 구성 예시

```tsx
const editor = useEditor({
    extensions: [
        StarterKit.configure({
            heading: {
                levels: [1, 2, 3],
            },
        }),
        Image.configure({
            HTMLAttributes: {
                class: "max-w-full h-auto rounded-lg",
            },
        }),
        Link.configure({
            openOnClick: false,
            HTMLAttributes: {
                class: "text-blue-500 underline hover:text-blue-700",
            },
        }),
        Placeholder.configure({
            placeholder: "내용을 입력하세요...",
        }),
        TextAlign.configure({
            types: ["heading", "paragraph"],
        }),
        Underline,
        TextStyle,
        Color,
        Highlight.configure({
            multicolor: true,
        }),
    ],
    content,
    onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
    },
    immediatelyRender: false,
});
```

---

## 참고 자료

- [TipTap 공식 문서](https://tiptap.dev/docs)
- [TipTap React 설치 가이드](https://tiptap.dev/docs/editor/getting-started/install/react)
- [Focus 명령](https://tiptap.dev/docs/editor/api/commands/selection/focus)
- [커스텀 메뉴](https://tiptap.dev/docs/editor/getting-started/style-editor/custom-menus)
- [명령 체이닝](https://tiptap.dev/docs/editor/api/commands)
