"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import TiptapEditor from "../components/TiptapEditor";
import { authPost } from "../utils/authFetch";
import { processEditorContent } from "../utils/imageUpload";

export default function CreateBoastCatPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // HTML 형태로 저장됨
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // 제출 중 상태

  // 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!content.trim() || content === "<p></p>") {
      alert("내용을 입력해주세요.");
      return;
    }

    // 중복 제출 방지
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1단계: 에디터 콘텐츠에서 이미지 추출 및 S3 업로드
      // - base64 이미지를 File 객체로 변환
      // - Presigned URL로 S3에 업로드
      // - 이미지 key 배열 반환
      const { content: processedContent, imageKeys } =
        await processEditorContent(content);

      // 2단계: 게시글 생성 API 호출 (JSON 형식)
      // 새로운 API는 FormData가 아닌 JSON으로 imageKeys를 받음
      const requestBody = {
        title: title,
        content: processedContent, // 플레이스홀더가 포함된 HTML
        imageKeys: imageKeys, // S3에 업로드된 이미지의 key 배열
      };

      console.log("📤 게시글 생성 요청:", requestBody);

      const data = await authPost(
        "http://localhost:8080/api/meow/boast-cat",
        requestBody
      );

      if (data.status === "OK") {
        alert("고양이 자랑글 등록 완료!");
        router.push("/boast");
      } else {
        alert(`등록 실패: ${data.message}`);
      }
    } catch (err) {
      console.error("등록 중 오류:", err);
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="flex items-center justify-center min-h-screen bg-gray-50 pt-20">
        <div className="bg-white shadow-lg rounded-xl p-10 w-full max-w-2xl">
          <h2 className="text-3xl font-bold text-blue-600 mb-8 text-center">
            고양이 자랑 글 등록
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* 내용 - Tiptap 에디터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                내용
              </label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="내용을 입력하세요. 글 중간에 이미지를 삽입할 수 있습니다."
              />
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg transition-colors font-medium text-lg ${
                isSubmitting
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "등록 중..." : "등록하기"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
