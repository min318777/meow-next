"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { ImagePlus, Bold, Italic, List, ListOrdered } from "lucide-react";
import { useEffect } from "react";
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";

/**
 * 삭제 버튼이 포함된 커스텀 이미지 컴포넌트
 */
const ImageWithDelete = ({ node, deleteNode }) => {
  return (
    <NodeViewWrapper className="image-wrapper">
      <img src={node.attrs.src} alt={node.attrs.alt || ""} />
      <button
        type="button"
        className="image-delete-btn"
        contentEditable={false}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          deleteNode();
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </NodeViewWrapper>
  );
};

/**
 * 커스텀 이미지 Extension - 삭제 버튼 포함
 */
const CustomImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageWithDelete);
  },
});

/**
 * Tiptap 기반 리치 텍스트 에디터 컴포넌트
 * - 텍스트 중간에 이미지 삽입 가능
 * - 볼드, 이탤릭, 리스트 등 기본 서식 지원
 * - 이미지 삭제 버튼 포함
 */
export default function TiptapEditor({ content, onChange, placeholder = "내용을 입력하세요..." }) {
  const editor = useEditor({
    immediatelyRender: false, // SSR 환경에서 hydration 오류 방지
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3], // h2, h3만 허용
        },
      }),
      CustomImage.configure({
        inline: true,
        allowBase64: true, // base64 이미지 허용
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      // HTML 형태로 내용 전달
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] px-4 py-3",
      },
    },
  });

  // content prop이 변경되면 에디터 내용 업데이트
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // 이미지 삽입 핸들러
  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        // 파일을 base64로 변환하여 에디터에 삽입
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const url = readerEvent.target?.result;
          if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* 툴바 */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-1 flex-wrap">
        {/* 볼드 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${
            editor.isActive("bold") ? "bg-gray-300" : ""
          }`}
          title="볼드 (Ctrl+B)"
        >
          <Bold size={18} />
        </button>

        {/* 이탤릭 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${
            editor.isActive("italic") ? "bg-gray-300" : ""
          }`}
          title="이탤릭 (Ctrl+I)"
        >
          <Italic size={18} />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* 불릿 리스트 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${
            editor.isActive("bulletList") ? "bg-gray-300" : ""
          }`}
          title="불릿 리스트"
        >
          <List size={18} />
        </button>

        {/* 번호 리스트 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${
            editor.isActive("orderedList") ? "bg-gray-300" : ""
          }`}
          title="번호 리스트"
        >
          <ListOrdered size={18} />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* 이미지 삽입 */}
        <button
          type="button"
          onClick={addImage}
          className="p-2 rounded hover:bg-gray-200 transition flex items-center gap-1 text-blue-600 font-medium"
          title="이미지 삽입"
        >
          <ImagePlus size={18} />
          <span className="text-sm">이미지</span>
        </button>
      </div>

      {/* 에디터 영역 */}
      <EditorContent editor={editor} className="bg-white" />

      {/* 사용 가이드 */}
      <div className="bg-gray-50 border-t border-gray-300 p-2 text-xs text-gray-500">
        💡 팁: 이미지 버튼을 클릭하거나, 이미지를 복사(Ctrl+C)해서 붙여넣기(Ctrl+V)하세요
      </div>
    </div>
  );
}
