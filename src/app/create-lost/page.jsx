"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Header from "../components/Header";
import TiptapEditor from "../components/TiptapEditor";
import { authPost } from "../utils/authFetch";
import { processEditorContent } from "../utils/imageUpload";
import { X, MapPin, Navigation, Search } from "lucide-react";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // 제출 중 상태
  const [showMap, setShowMap] = useState(false); // 지도 표시 여부
  const [mapLoaded, setMapLoaded] = useState(false); // 카카오맵 API 로드 여부
  const [searchAddress, setSearchAddress] = useState(""); // 주소 검색 입력값

  const mapRef = useRef(null); // 지도 DOM 참조
  const kakaoMapRef = useRef(null); // 카카오맵 인스턴스 참조
  const markerRef = useRef(null); // 마커 참조

  // 텍스트 필드 변경
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 카카오맵 API 로드 완료 시 호출
  const handleKakaoMapLoad = () => {
    setMapLoaded(true);
  };

  // 마커 생성/업데이트 함수
  const updateMarker = (lat, lng) => {
    if (!kakaoMapRef.current) return;

    const kakao = window.kakao;
    const map = kakaoMapRef.current;
    const latlng = new kakao.maps.LatLng(lat, lng);

    // 기존 마커 제거
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // 새 마커 생성
    const marker = new kakao.maps.Marker({
      position: latlng,
    });
    marker.setMap(map);
    markerRef.current = marker;

    // 지도 중심 이동
    map.setCenter(latlng);
  };

  // 지도 초기화 (지도를 열 때마다 호출)
  const initializeMap = () => {
    if (!mapLoaded || !mapRef.current || !window.kakao || !window.kakao.maps) {
      return;
    }

    const kakao = window.kakao;

    // 서울 시청을 기본 중심 좌표로 설정
    const defaultLat = form.latitude || 37.5665;
    const defaultLng = form.longitude || 126.978;

    const container = mapRef.current;
    const options = {
      center: new kakao.maps.LatLng(defaultLat, defaultLng),
      level: 3, // 지도 확대 레벨
    };

    // 지도 생성
    const map = new kakao.maps.Map(container, options);
    kakaoMapRef.current = map;

    // 기존 좌표가 있으면 마커 생성
    if (form.latitude && form.longitude) {
      updateMarker(parseFloat(form.latitude), parseFloat(form.longitude));
    }

    // 지도 클릭 이벤트
    kakao.maps.event.addListener(map, "click", function (mouseEvent) {
      const latlng = mouseEvent.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();

      // 좌표를 폼에 저장
      setForm((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));

      // 마커 업데이트
      updateMarker(lat, lng);

      // 주소 검색 (Geocoder 사용)
      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.coord2Address(lng, lat, function (result, status) {
        if (status === kakao.maps.services.Status.OK && result[0]) {
          const address =
            result[0].address.address_name ||
            result[0].road_address?.address_name ||
            "";
          setForm((prev) => ({
            ...prev,
            lostLocation: address,
          }));
        }
      });
    });
  };

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    // 지도가 열려있지 않으면 먼저 열기
    if (!showMap) {
      setShowMap(true);
      setTimeout(() => {
        initializeMap();
        // 지도 초기화 후 위치 가져오기
        setTimeout(() => {
          fetchCurrentPosition();
        }, 200);
      }, 100);
    } else {
      fetchCurrentPosition();
    }
  };

  // 실제 위치 가져오기 함수
  const fetchCurrentPosition = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 폼에 좌표 저장
        setForm((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));

        // 마커 업데이트
        if (kakaoMapRef.current) {
          updateMarker(lat, lng);

          // 주소 변환
          const kakao = window.kakao;
          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.coord2Address(lng, lat, function (result, status) {
            if (status === kakao.maps.services.Status.OK && result[0]) {
              const address =
                result[0].address.address_name ||
                result[0].road_address?.address_name ||
                "";
              setForm((prev) => ({
                ...prev,
                lostLocation: address,
              }));
            }
          });
        }

        alert("현재 위치로 설정되었습니다.");
      },
      (error) => {
        console.error("위치 가져오기 오류:", error);
        alert("현재 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // 주소 검색
  const handleAddressSearch = () => {
    if (!searchAddress.trim()) {
      alert("검색할 주소를 입력해주세요.");
      return;
    }

    if (!window.kakao || !window.kakao.maps) {
      alert("지도를 먼저 열어주세요.");
      return;
    }

    const kakao = window.kakao;
    const geocoder = new kakao.maps.services.Geocoder();

    geocoder.addressSearch(searchAddress, function (result, status) {
      if (status === kakao.maps.services.Status.OK) {
        const lat = parseFloat(result[0].y);
        const lng = parseFloat(result[0].x);

        // 폼에 좌표와 주소 저장
        setForm((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
          lostLocation: result[0].address_name || searchAddress,
        }));

        // 마커 업데이트
        updateMarker(lat, lng);

        setSearchAddress(""); // 검색창 초기화
      } else {
        alert("주소를 찾을 수 없습니다. 정확한 주소를 입력해주세요.");
      }
    });
  };

  // 지도 표시 토글
  const toggleMap = () => {
    setShowMap(!showMap);
    // 지도를 열 때 초기화
    if (!showMap) {
      setTimeout(() => {
        initializeMap();
      }, 100); // DOM 렌더링 대기
    }
  };

  // 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!form.content.trim() || form.content === "<p></p>") {
      alert("내용을 입력해주세요.");
      return;
    }

    // 중복 제출 방지
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1단계: 에디터 콘텐츠에서 이미지 추출 및 S3 업로드
      const { content: processedContent, imageKeys } =
        await processEditorContent(form.content);

      // 2단계: 게시글 생성 API 호출 (JSON 형식)
      // 새로운 API는 FormData가 아닌 JSON으로 imageKeys를 받음
      const requestBody = {
        title: form.title,
        content: processedContent, // 플레이스홀더가 포함된 HTML
        imageKeys: imageKeys, // S3에 업로드된 이미지의 key 배열
        // 선택적 필드들 (값이 있을 때만 포함)
        ...(form.catName && { catName: form.catName }),
        ...(form.catType && { catType: form.catType }),
        ...(form.catColor && { catColor: form.catColor }),
        ...(form.catAge && { catAge: parseInt(form.catAge) }),
        ...(form.catWeight && { catWeight: parseInt(form.catWeight) }),
        ...(form.lostLocation && { lostLocation: form.lostLocation }),
        ...(form.latitude && { latitude: parseFloat(form.latitude) }),
        ...(form.longitude && { longitude: parseFloat(form.longitude) }),
        ...(form.reward && { reward: parseInt(form.reward) }),
      };

      console.log("📤 게시글 생성 요청:", requestBody);

      const data = await authPost(
        "http://localhost:8080/api/meow/lost-cat",
        requestBody
      );

      if (data.status === "OK") {
        alert("고양이 찾기글 등록 완료!");
        router.push("/lost");
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
      {/* 카카오맵 API 스크립트 로드 */}
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          window.kakao.maps.load(() => {
            handleKakaoMapLoad();
          });
        }}
      />

      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-3xl">
          <h2 className="text-3xl font-bold text-blue-600 mb-8 text-center">
            고양이 찾기 글 등록
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
                disabled={isSubmitting}
              />
            </div>

            {/* 고양이 정보 섹션 */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                고양이 정보
              </h3>

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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* 실종 위치 섹션 */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  실종 위치
                </h3>
                {/* 지도 표시 토글 버튼 */}
                <button
                  type="button"
                  onClick={toggleMap}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:bg-gray-400"
                >
                  <MapPin size={18} />
                  {showMap ? "지도 숨기기" : "지도에서 선택"}
                </button>
              </div>

              {/* 카카오맵 */}
              {showMap && (
                <div className="mb-4 space-y-4">
                  {/* 지도 컨트롤 - 주소 검색 및 현재 위치 */}
                  <div className="flex gap-2">
                    {/* 주소 검색 */}
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddressSearch();
                          }
                        }}
                        placeholder="주소로 검색 (예: 서울시 강남구)"
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={handleAddressSearch}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:bg-gray-400"
                      >
                        <Search size={16} />
                        검색
                      </button>
                    </div>

                    {/* 현재 위치 버튼 */}
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium whitespace-nowrap disabled:bg-gray-400"
                    >
                      <Navigation size={16} />
                      현재 위치
                    </button>
                  </div>

                  {/* 지도 */}
                  <div
                    ref={mapRef}
                    className="w-full h-96 rounded-lg border-2 border-gray-300"
                  />
                  <p className="text-xs text-gray-500">
                    지도를 클릭하여 실종 위치를 선택하세요. 주소와 좌표가
                    자동으로 입력됩니다.
                  </p>
                </div>
              )}

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
                    readOnly={showMap} // 지도 모드에서는 읽기 전용
                    disabled={isSubmitting}
                  />
                  {showMap && (
                    <p className="text-xs text-gray-500 mt-1">
                      지도에서 위치를 선택하면 자동으로 입력됩니다
                    </p>
                  )}
                </div>

                {/* 위도와 경도는 숨김 처리 (hidden input으로 유지하여 폼 데이터에는 포함) */}
                <input type="hidden" name="latitude" value={form.latitude} />
                <input type="hidden" name="longitude" value={form.longitude} />
              </div>
            </div>

            {/* 상세 내용 - Tiptap 에디터 */}
            <div className="border-t pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                상세 내용 <span className="text-red-500">*</span>
              </label>
              <TiptapEditor
                content={form.content}
                onChange={(html) => setForm({ ...form, content: html })}
                placeholder="고양이의 특징, 실종 당시 상황 등을 자세히 적어주세요. 글 중간에 이미지를 삽입할 수 있습니다."
              />
            </div>

            {/* 안내 메시지 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>작성 팁:</strong> 고양이의 특징을 자세히 기록할수록 찾을
                확률이 높아집니다. 털 색깔, 무늬, 특이사항, 착용한 목걸이 등을
                상세히 적어주세요.
              </p>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-lg transition-colors font-semibold text-lg shadow-md ${
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
