# Lost 페이지 토큰 재발급 적용 가이드

현재 `lost/page.js` 파일이 잠겨있어 직접 수정할 수 없습니다.
아래 내용을 참고하여 수동으로 수정해주세요.

## 수정 방법

### 1단계: import 추가
파일 상단에 authGet 함수를 import합니다.

```javascript
// 기존 코드
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import PostCard from "../components/PostCard";

// 👇 이 줄을 추가
import { authGet } from "../utils/authFetch";
```

### 2단계: fetchAllPosts 함수 수정
useEffect 내부의 fetchAllPosts 함수를 다음과 같이 수정합니다.

```javascript
// 기존 코드 (16-46 라인)
const fetchAllPosts = async () => {
  try {
    // 백엔드가 페이징을 제대로 안 하므로 size를 크게 설정해서 모든 데이터 가져오기
    const res = await fetch(
      `http://localhost:8080/api/meow/lost-cat?page=0&size=1000`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      }
    );

    if (!res.ok) {
      throw new Error(`서버 오류: ${res.status}`);
    }
    const data = await res.json();
    console.log("API 응답 데이터:", data.data);
    console.log("전체 게시물 수:", data.data.content?.length);

    setAllPosts(data.data.content || []);
  } catch (err) {
    console.error("게시물 조회 실패:", err);
  }
};

// 👇 이렇게 변경
const fetchAllPosts = async () => {
  try {
    // authGet 함수를 사용하여 자동 토큰 재발급 적용
    // 백엔드가 페이징을 제대로 안 하므로 size를 크게 설정해서 모든 데이터 가져오기
    const data = await authGet(
      `http://localhost:8080/api/meow/lost-cat?page=0&size=1000`
    );

    console.log("API 응답 데이터:", data.data);
    console.log("전체 게시물 수:", data.data.content?.length);

    setAllPosts(data.data.content || []);
  } catch (err) {
    console.error("게시물 조회 실패:", err);
    // authGet에서 이미 로그인 페이지로 리다이렉트 처리됨
  }
};
```

### 3단계: accessToken 변수 제거
useEffect 최상단의 accessToken 변수 선언을 삭제합니다.

```javascript
// 기존 코드 (17 라인)
const accessToken = localStorage.getItem("accessToken"); // 👈 이 줄을 삭제
```

## 변경 사항 요약

- ❌ **제거**: `localStorage.getItem("accessToken")`
- ❌ **제거**: `fetch()` 호출 및 수동 헤더 설정
- ✅ **추가**: `import { authGet } from "../utils/authFetch"`
- ✅ **추가**: `authGet()` 함수 사용

## 이점

1. **자동 토큰 재발급**: 401/403 에러 발생 시 자동으로 토큰 재발급 시도
2. **재시도 로직**: 재발급 성공 시 원래 요청 자동 재시도
3. **에러 처리**: 재발급 실패 시 자동으로 로그인 페이지로 리다이렉트
4. **코드 간결화**: 인증 로직이 authFetch.js에 중앙화되어 유지보수 용이
