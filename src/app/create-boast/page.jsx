"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { authPostFormData } from "../utils/authFetch";
import { X } from "lucide-react"; // 이미지 삭제 아이콘

export default function CreateBoastCatPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    content: "",
  });
  const [files, setFiles] = useState([]); // 실제 File 객체 배열
  const [previewUrls, setPreviewUrls] = useState([]); // 미리보기 URL 배열
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 컴포넌트 unmount 시 메모리 정리
  useEffect(() => {
    return () => {
      // 모든 미리보기 URL의 메모리 해제
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // 텍스트 필드 변경
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 파일 선택 및 미리보기 생성
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);

      // 이전 미리보기 URL 메모리 해제
      previewUrls.forEach(url => URL.revokeObjectURL(url));

      // 새로운 미리보기 URL 생성
      const newPreviewUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(newPreviewUrls);
    }
  };

  // 개별 이미지 삭제
  const removeImage = (index) => {
    // 미리보기 URL 메모리 해제
    URL.revokeObjectURL(previewUrls[index]);

    // 해당 인덱스의 파일과 미리보기 제거
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);

    setFiles(newFiles);
    setPreviewUrls(newPreviewUrls);
  };

  // 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("content", form.content);
      files.forEach((file) => {
        formData.append("images", file); // 서버에서 images[]로 받기
      });

      // authPostFormData 함수를 사용하여 자동 토큰 재발급 적용
      const data = await authPostFormData(
        "http://localhost:8080/api/meow/boast-cat",
        formData
      );

      if (data.status === "OK") {
        alert("고양이 자랑글 등록 완료!");

        // 메모리 정리: 미리보기 URL 해제
        previewUrls.forEach(url => URL.revokeObjectURL(url));

        router.push("/boast");
      } else {
        alert(`등록 실패: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("등록 중 오류가 발생했습니다.");
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
              <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="제목을 입력하세요"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                required
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="내용을 입력하세요"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                rows={7}
                required
              />
            </div>

            {/* 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">고양이 이미지 (여러 장 가능)</label>
              <input
                type="file"
                name="catImages"
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

              {/* 이미지 미리보기 */}
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    선택된 이미지 ({previewUrls.length}장)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`미리보기 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        {/* 삭제 버튼 */}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          aria-label="이미지 삭제"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              등록하기
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
