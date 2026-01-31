/**
 * JWT 토큰 자동 재발급 기능이 포함된 fetch 래퍼 함수
 *
 * 이 유틸리티는 다음과 같은 기능을 제공합니다:
 * 1. API 요청 시 자동으로 Authorization 헤더 추가
 * 2. 401 에러 발생 시 에러 코드 확인 후 자동 토큰 재발급 시도
 * 3. 재발급 성공 시 원래 요청 자동 재시도
 * 4. 재발급 실패 시 로그인 페이지로 리다이렉트
 * 5. 동시 요청 시 중복 재발급 방지 (토큰 갱신 락 메커니즘)
 *
 * 백엔드 JwtFilter 에러 응답 형식:
 * - TOKEN_EXPIRED: 토큰 만료 -> 재발급 시도
 * - INVALID_TOKEN: 유효하지 않은 토큰 -> 재로그인 필요
 * - INVALID_ACCESS_TOKEN: Access 토큰이 아님 -> 재로그인 필요
 * - USER_NOT_FOUND: 사용자를 찾을 수 없음 -> 재로그인 필요
 */

// ============================================
// 토큰 재발급 동시성 제어를 위한 상태 관리
// ============================================

/**
 * 토큰 재발급 진행 중 여부를 나타내는 플래그
 * 여러 API 요청이 동시에 401을 받았을 때 중복 재발급을 방지
 */
let isRefreshing = false;

/**
 * 토큰 재발급 완료를 기다리는 요청들의 콜백 큐
 * 재발급이 완료되면 큐에 있는 모든 요청들이 새 토큰으로 재시도됨
 */
let refreshSubscribers = [];

/**
 * 토큰 재발급 완료 시 대기 중인 모든 요청에게 알림
 * @param {string} newToken - 새로 발급받은 액세스 토큰
 */
function onRefreshSuccess(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

/**
 * 토큰 재발급 실패 시 대기 중인 모든 요청에게 알림
 * @param {Error} error - 발생한 에러
 */
function onRefreshFailure(error) {
  refreshSubscribers.forEach((callback) => callback(null, error));
  refreshSubscribers = [];
}

/**
 * 토큰 재발급이 완료될 때까지 대기하는 Promise 생성
 * @returns {Promise<string>} 새로운 액세스 토큰
 */
function subscribeToTokenRefresh() {
  return new Promise((resolve, reject) => {
    refreshSubscribers.push((newToken, error) => {
      if (error) {
        reject(error);
      } else {
        resolve(newToken);
      }
    });
  });
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * localStorage에서 모든 인증 관련 데이터 삭제
 * 로그아웃 또는 토큰 만료 시 호출
 */
function clearAuthData() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("loginId");
  localStorage.removeItem("role");
}

/**
 * Refresh 토큰을 이용한 Access 토큰 재발급
 * 동시 요청 시 중복 재발급을 방지하는 락 메커니즘 포함
 *
 * @returns {Promise<string|null>} 새로운 액세스 토큰 또는 null (실패 시)
 *
 * 동작 원리:
 * 1. 이미 재발급 중이면 기존 재발급이 완료될 때까지 대기
 * 2. 재발급이 진행 중이 아니면 재발급 시작
 * 3. 쿠키에 저장된 refresh 토큰(HttpOnly)을 이용하여 /api/reissue 엔드포인트 호출
 * 4. 서버는 새로운 accessToken을 Authorization 헤더로 반환
 * 5. 새 토큰을 localStorage에 저장하고 대기 중인 요청들에게 알림
 */
export async function refreshAccessToken() {
  // 이미 재발급 중이면 완료될 때까지 대기
  if (isRefreshing) {
    console.log("⏳ 토큰 재발급 진행 중... 대기합니다.");
    return subscribeToTokenRefresh();
  }

  // 재발급 시작 - 락 획득
  isRefreshing = true;
  console.log("🔄 토큰 재발급 시도...");

  try {
    const response = await fetch("http://localhost:8080/api/reissue", {
      method: "POST",
      credentials: "include", // HttpOnly 쿠키(refresh token) 자동 포함
    });

    if (response.ok) {
      // 응답 헤더에서 새로운 accessToken 추출
      const newAccessToken = response.headers.get("Authorization");

      if (newAccessToken) {
        // Bearer 접두사 제거하고 저장
        const token = newAccessToken.startsWith("Bearer ")
          ? newAccessToken.substring(7)
          : newAccessToken;

        localStorage.setItem("accessToken", token);
        console.log("✅ 토큰 재발급 성공");

        // 대기 중인 모든 요청에게 새 토큰 전달
        onRefreshSuccess(token);
        return token;
      }
    }

    // 재발급 실패
    console.error("❌ 토큰 재발급 실패: 응답 상태 코드", response.status);
    const error = new Error("토큰 재발급 실패");
    onRefreshFailure(error);
    return null;
  } catch (error) {
    console.error("❌ 토큰 재발급 중 오류:", error);
    onRefreshFailure(error);
    return null;
  } finally {
    // 락 해제
    isRefreshing = false;
  }
}

/**
 * 401 에러 응답에서 에러 코드 확인
 * TOKEN_EXPIRED인 경우에만 재발급 시도
 *
 * @param {Response} response - fetch 응답 객체
 * @returns {Promise<{shouldRefresh: boolean, errorCode: string}>}
 */
async function checkAuthError(response) {
  try {
    const clonedResponse = response.clone();
    const errorData = await clonedResponse.json();

    // 백엔드 JwtFilter 에러 응답: { error: "ERROR_CODE", message: "...", status: 401 }
    const errorCode = errorData.error || "";

    // TOKEN_EXPIRED인 경우에만 재발급 시도
    if (errorCode === "TOKEN_EXPIRED") {
      return { shouldRefresh: true, errorCode };
    }

    // 그 외 에러 코드는 재로그인 필요
    // INVALID_TOKEN, INVALID_ACCESS_TOKEN, USER_NOT_FOUND 등
    return { shouldRefresh: false, errorCode };
  } catch (e) {
    // JSON 파싱 실패 시 재발급 시도
    return { shouldRefresh: true, errorCode: "UNKNOWN" };
  }
}

// ============================================
// 메인 fetch 래퍼 함수
// ============================================

/**
 * 인증이 필요한 API 요청을 위한 fetch 래퍼 함수
 *
 * @param {string} url - API 엔드포인트 URL
 * @param {RequestInit} options - fetch 옵션 (method, headers, body 등)
 * @returns {Promise<Response>} fetch 응답
 *
 * 사용 예시:
 * ```javascript
 * const response = await authFetch("http://localhost:8080/api/meow/boast-cat", {
 *   method: "GET"
 * });
 * const data = await response.json();
 * ```
 *
 * 동작 흐름:
 * 1. localStorage에서 accessToken 가져오기
 * 2. Authorization 헤더에 토큰 포함하여 요청
 * 3. 401/403 에러 발생 시 토큰 재발급 시도
 * 4. 재발급 성공 시 원래 요청 재시도
 * 5. 재발급 실패 시 로그인 페이지로 리다이렉트
 */
export async function authFetch(url, options = {}) {
  // 1단계: localStorage에서 accessToken 가져오기
  let accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.warn("⚠️ accessToken이 없습니다. 로그인이 필요합니다.");
    // 토큰이 없으면 바로 재발급 시도
    const newToken = await refreshAccessToken();
    if (newToken) {
      accessToken = newToken;
    } else {
      // 재발급도 실패하면 로그인 페이지로
      clearAuthData();
      window.location.href = "/signin";
      throw new Error("인증이 필요합니다.");
    }
  }

  // 2단계: Authorization 헤더 추가
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    ...options.headers, // 기존 헤더 병합
  };

  // 3단계: API 요청
  try {
    console.log(`📤 API 요청: ${options.method || "GET"} ${url}`);
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // 쿠키 포함
    });

    console.log(`📥 응답 상태: ${response.status} ${response.statusText}`);

    // 4단계: 401/403 에러 처리 (토큰 만료 또는 유효하지 않음)
    if (response.status === 401 || response.status === 403) {
      console.warn(`⚠️ ${response.status} 인증 오류 발생. 토큰 재발급 시도...`);

      // 토큰 재발급 시도
      const newToken = await refreshAccessToken();

      if (newToken) {
        // 재발급 성공 - 원래 요청 재시도
        console.log("🔁 토큰 재발급 성공! 원래 요청 재시도...");

        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          },
          credentials: "include",
        });

        console.log(
          `📥 재시도 응답 상태: ${retryResponse.status} ${retryResponse.statusText}`
        );
        return retryResponse;
      } else {
        // 재발급 실패 - 로그인 페이지로 리다이렉트
        console.error("❌ 토큰 재발급 실패. 로그인 페이지로 이동합니다.");
        clearAuthData();
        window.location.href = "/signin";
        throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
      }
    }

    // 5단계: 정상 응답 반환
    return response;
  } catch (error) {
    console.error("❌ API 요청 중 오류:", error);
    throw error;
  }
}

// ============================================
// 인증 필수 API 헬퍼 함수들
// ============================================

/**
 * GET 요청을 위한 헬퍼 함수
 *
 * @param {string} url - API 엔드포인트 URL
 * @returns {Promise<any>} JSON 파싱된 응답 데이터
 */
export async function authGet(url) {
  const response = await authFetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(`서버 오류: ${response.status}`);
  }

  return response.json();
}

/**
 * POST 요청을 위한 헬퍼 함수
 *
 * @param {string} url - API 엔드포인트 URL
 * @param {object} body - 요청 본문 데이터
 * @returns {Promise<any>} JSON 파싱된 응답 데이터
 */
export async function authPost(url, body) {
  const response = await authFetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`서버 오류: ${response.status}`);
  }

  return response.json();
}

/**
 * FormData를 사용하는 POST 요청 (파일 업로드 등)
 *
 * @param {string} url - API 엔드포인트 URL
 * @param {FormData} formData - FormData 객체
 * @returns {Promise<any>} JSON 파싱된 응답 데이터
 */
export async function authPostFormData(url, formData) {
  let accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      accessToken = newToken;
    } else {
      clearAuthData();
      window.location.href = "/signin";
      throw new Error("인증이 필요합니다.");
    }
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        // Content-Type을 설정하지 않음 - 브라우저가 자동으로 multipart/form-data로 설정
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
      credentials: "include",
    });

    if (response.status === 401 || response.status === 403) {
      const newToken = await refreshAccessToken();

      if (newToken) {
        const retryResponse = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
          body: formData,
          credentials: "include",
        });

        if (!retryResponse.ok) {
          throw new Error(`서버 오류: ${retryResponse.status}`);
        }

        return retryResponse.json();
      } else {
        clearAuthData();
        window.location.href = "/signin";
        throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
      }
    }

    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("❌ FormData 전송 중 오류:", error);
    throw error;
  }
}

/**
 * PUT 요청을 위한 헬퍼 함수 (댓글 수정 등)
 *
 * @param {string} url - API 엔드포인트 URL
 * @param {object} body - 요청 본문 데이터
 * @returns {Promise<any>} JSON 파싱된 응답 데이터
 */
export async function authPut(url, body) {
  const response = await authFetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`서버 오류: ${response.status}`);
  }

  return response.json();
}

/**
 * FormData를 사용하는 PUT 요청 (파일 업로드 포함 수정)
 *
 * @param {string} url - API 엔드포인트 URL
 * @param {FormData} formData - FormData 객체
 * @returns {Promise<any>} JSON 파싱된 응답 데이터
 */
export async function authPutFormData(url, formData) {
  let accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      accessToken = newToken;
    } else {
      clearAuthData();
      window.location.href = "/signin";
      throw new Error("인증이 필요합니다.");
    }
  }

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        // Content-Type을 설정하지 않음 - 브라우저가 자동으로 multipart/form-data로 설정
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
      credentials: "include",
    });

    if (response.status === 401 || response.status === 403) {
      const newToken = await refreshAccessToken();

      if (newToken) {
        const retryResponse = await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
          body: formData,
          credentials: "include",
        });

        if (!retryResponse.ok) {
          throw new Error(`서버 오류: ${retryResponse.status}`);
        }

        return retryResponse.json();
      } else {
        clearAuthData();
        window.location.href = "/signin";
        throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
      }
    }

    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("❌ PUT FormData 전송 중 오류:", error);
    throw error;
  }
}

/**
 * PATCH 요청을 위한 헬퍼 함수 (알림 읽음 처리 등)
 *
 * @param {string} url - API 엔드포인트 URL
 * @param {object} body - 요청 본문 데이터 (선택적)
 * @returns {Promise<any>} JSON 파싱된 응답 데이터 또는 빈 객체
 */
export async function authPatch(url, body = {}) {
  const response = await authFetch(url, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`서버 오류: ${response.status}`);
  }

  // 응답 본문이 있으면 JSON 파싱, 없으면 빈 객체 반환
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return { success: true };
}

/**
 * DELETE 요청을 위한 헬퍼 함수 (댓글 삭제 등)
 *
 * @param {string} url - API 엔드포인트 URL
 * @returns {Promise<any>} JSON 파싱된 응답 데이터
 */
export async function authDelete(url) {
  const response = await authFetch(url, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`서버 오류: ${response.status}`);
  }

  return response.json();
}

// ============================================
// 공개 API 함수 (인증 선택적, 토큰 자동 갱신 지원)
// ============================================

/**
 * 공개 API를 위한 GET 요청 함수 (인증 선택적)
 * 토큰이 만료된 경우 자동으로 재발급 시도
 *
 * @param {string} url - API 엔드포인트 URL
 * @returns {Promise<any>} JSON 파싱된 응답 데이터
 *
 * 동작 원리:
 * - localStorage에 accessToken이 있으면 Authorization 헤더 포함
 * - 토큰이 없어도 요청은 진행 (로그인 리다이렉트 하지 않음)
 * - 401 에러 시 토큰 재발급 시도 후 재요청
 * - 재발급 실패해도 로그인 리다이렉트 하지 않음 (공개 API이므로)
 *
 * 사용 예시:
 * ```javascript
 * // 비로그인 사용자도 게시물 목록 조회 가능
 * const data = await publicGet("http://localhost:8080/api/meow/boast-cat?page=0&size=10");
 * ```
 */
export async function publicGet(url) {
  // 토큰이 있으면 포함, 없으면 그냥 진행
  let accessToken = localStorage.getItem("accessToken");

  const makeRequest = async (token) => {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return fetch(url, {
      method: "GET",
      headers,
      credentials: "include", // 쿠키 포함 (있는 경우)
    });
  };

  try {
    let response = await makeRequest(accessToken);

    // 토큰이 있었고 401 에러가 발생한 경우 -> 토큰 재발급 시도
    if (accessToken && (response.status === 401 || response.status === 403)) {
      console.log("🔄 publicGet: 토큰 만료 감지, 재발급 시도...");
      const newToken = await refreshAccessToken();

      if (newToken) {
        // 재발급 성공 - 새 토큰으로 재요청
        console.log("✅ publicGet: 토큰 재발급 성공, 재요청...");
        response = await makeRequest(newToken);
      } else {
        // 재발급 실패 - 토큰 없이 재요청 (공개 API이므로)
        console.log("⚠️ publicGet: 토큰 재발급 실패, 토큰 없이 재요청...");
        clearAuthData();
        response = await makeRequest(null);
      }
    }

    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("❌ Public GET 요청 중 오류:", error);
    throw error;
  }
}

/**
 * 공개 API를 위한 POST 요청 함수 (인증 선택적)
 * 토큰이 만료된 경우 자동으로 재발급 시도
 *
 * @param {string} url - API 엔드포인트 URL
 * @param {object} body - 요청 본문 데이터
 * @returns {Promise<any>} JSON 파싱된 응답 데이터
 *
 * 동작 원리:
 * - localStorage에 accessToken이 있으면 Authorization 헤더 포함
 * - 토큰이 없어도 요청은 진행 (로그인 리다이렉트 하지 않음)
 * - 401 에러 시 토큰 재발급 시도 후 재요청
 * - 재발급 실패해도 로그인 리다이렉트 하지 않음 (공개 API이므로)
 *
 * 사용 예시:
 * ```javascript
 * // 비로그인 사용자도 검색 가능
 * const data = await publicPost("http://localhost:8080/api/meow/search", {
 *   title: "고양이",
 *   contents: "고양이"
 * });
 * ```
 */
export async function publicPost(url, body) {
  // 토큰이 있으면 포함, 없으면 그냥 진행
  let accessToken = localStorage.getItem("accessToken");

  const makeRequest = async (token) => {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      credentials: "include", // 쿠키 포함 (있는 경우)
    });
  };

  try {
    let response = await makeRequest(accessToken);

    // 토큰이 있었고 401 에러가 발생한 경우 -> 토큰 재발급 시도
    if (accessToken && (response.status === 401 || response.status === 403)) {
      console.log("🔄 publicPost: 토큰 만료 감지, 재발급 시도...");
      const newToken = await refreshAccessToken();

      if (newToken) {
        // 재발급 성공 - 새 토큰으로 재요청
        console.log("✅ publicPost: 토큰 재발급 성공, 재요청...");
        response = await makeRequest(newToken);
      } else {
        // 재발급 실패 - 토큰 없이 재요청 (공개 API이므로)
        console.log("⚠️ publicPost: 토큰 재발급 실패, 토큰 없이 재요청...");
        clearAuthData();
        response = await makeRequest(null);
      }
    }

    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("❌ Public POST 요청 중 오류:", error);
    throw error;
  }
}
