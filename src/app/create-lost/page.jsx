"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { X } from "lucide-react"; // 이미지 삭제 아이콘

export default function CreateLostCatPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    content: "",
    catName: "",
    catType: "",
    catColor: "",
    catAge: "",
    catWeight: "",
    lostLocation: "",
    latitude: "",
    longitude: "",
    reward: "",
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
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
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
      const accessToken = localStorage.getItem("accessToken");

      // FormData 생성 (이미지 파일 포함을 위해)
      const formData = new FormData();

      // 텍스트 필드 추가
      formData.append("title", form.title);
      formData.append("content", form.content);

      // 선택적 필드들 (값이 있을 때만 추가)
      if (form.catName) formData.append("catName", form.catName);
      if (form.catType) formData.append("catType", form.catType);
      if (form.catColor) formData.append("catColor", form.catColor);
      if (form.catAge) formData.append("catAge", form.catAge);
      if (form.catWeight) formData.append("catWeight", form.catWeight);
      if (form.lostLocation) formData.append("lostLocation", form.lostLocation);
      if (form.latitude) formData.append("latitude", form.latitude);
      if (form.longitude) formData.append("longitude", form.longitude);
      if (form.reward) formData.append("reward", form.reward);

      // 이미지 파일들 추가 (백엔드의 'images' 필드명에 맞춤)
      files.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch("http://localhost:8080/api/meow/lost-cat", {
        method: "POST",
        headers: {
          // Content-Type을 명시하지 않음 (브라우저가 자동으로 multipart/form-data 설정)
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData, // FormData 객체 전송
      });

      const data = await res.json();

      if (res.ok) {
        alert("고양이 찾기글 등록 완료!");

        // 메모리 정리: 미리보기 URL 해제
        previewUrls.forEach(url => URL.revokeObjectURL(url));

        router.push("/lost");
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

      <main className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-3xl">
          <h2 className="text-3xl font-bold text-blue-600 mb-8 text-center">
            🔍 고양이 찾기 글 등록
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="예) 회색 고양이를 찾습니다"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* 고양이 정보 섹션 */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🐱 고양이 정보</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 고양이 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    고양이 이름
                  </label>
                  <input
                    type="text"
                    name="catName"
                    value={form.catName}
                    onChange={handleChange}
                    placeholder="예) 나비"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 품종 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    품종
                  </label>
                  <input
                    type="text"
                    name="catType"
                    value={form.catType}
                    onChange={handleChange}
                    placeholder="예) 코리안숏헤어"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 색상 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    색상
                  </label>
                  <input
                    type="text"
                    name="catColor"
                    value={form.catColor}
                    onChange={handleChange}
                    placeholder="예) 회색 태비"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 나이 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    나이 (세)
                  </label>
                  <input
                    type="number"
                    name="catAge"
                    value={form.catAge}
                    onChange={handleChange}
                    placeholder="예) 3"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 무게 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    무게 (kg)
                  </label>
                  <input
                    type="number"
                    name="catWeight"
                    value={form.catWeight}
                    onChange={handleChange}
                    placeholder="예) 4"
                    min="0"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 사례금 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사례금 (원)
                  </label>
                  <input
                    type="number"
                    name="reward"
                    value={form.reward}
                    onChange={handleChange}
                    placeholder="예) 100000"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 실종 위치 섹션 */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📍 실종 위치</h3>

              <div className="space-y-4">
                {/* 실종 장소 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    실종 장소
                  </label>
                  <input
                    type="text"
                    name="lostLocation"
                    value={form.lostLocation}
                    onChange={handleChange}
                    placeholder="예) 서울시 강남구 역삼동 123-45"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 위도 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      위도 (Latitude)
                    </label>
                    <input
                      type="number"
                      name="latitude"
                      value={form.latitude}
                      onChange={handleChange}
                      placeholder="예) 37.4979"
                      step="any"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 경도 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      경도 (Longitude)
                    </label>
                    <input
                      type="number"
                      name="longitude"
                      value={form.longitude}
                      onChange={handleChange}
                      placeholder="예) 127.0276"
                      step="any"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 상세 내용 */}
            <div className="border-t pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                상세 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="고양이의 특징, 실종 당시 상황 등을 자세히 적어주세요"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={8}
                required
              />
            </div>

            {/* 이미지 업로드 */}
            <div className="border-t pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                고양이 사진 (여러 장 가능)
              </label>
              <input
                type="file"
                name="catImages"
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-2">
                * 고양이를 식별할 수 있는 명확한 사진을 올려주세요
              </p>

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

            {/* 안내 메시지 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>작성 팁:</strong> 고양이의 특징을 자세히 기록할수록 찾을 확률이 높아집니다.
                털 색깔, 무늬, 특이사항, 착용한 목걸이 등을 상세히 적어주세요.
              </p>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-md"
            >
              등록하기
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}