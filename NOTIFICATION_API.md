# 알림 시스템 API 명세서

프론트엔드 알림 기능 구현을 위해 백엔드에서 제공해야 할 API 엔드포인트 목록입니다.

## 🔔 필요한 API 엔드포인트

### 1. 알림 목록 조회
**목적**: 사용자의 모든 알림을 조회합니다.

```http
GET /api/notifications
Authorization: Bearer {accessToken}
```

**응답 예시**:
```json
{
  "status": "OK",
  "message": "알림 목록 조회 성공",
  "data": [
    {
      "id": 1,
      "sourceId": 123,
      "postId": 45,
      "type": "COMMENT",
      "message": "새로운 댓글이 달렸습니다.",
      "receiverLoginId": "user123",
      "isRead": false,
      "createdAt": "2025-12-11T10:30:00",
      "updatedAt": "2025-12-11T10:30:00"
    },
    {
      "id": 2,
      "sourceId": 456,
      "postId": 45,
      "type": "LIKE",
      "message": "게시글에 좋아요가 추가되었습니다.",
      "receiverLoginId": "user123",
      "isRead": true,
      "createdAt": "2025-12-11T09:15:00",
      "updatedAt": "2025-12-11T09:20:00"
    }
  ]
}
```

---

### 2. SSE 실시간 알림 스트림
**목적**: Server-Sent Events를 통해 실시간 알림을 클라이언트에 전송합니다.

```http
GET /api/notifications/stream?token={accessToken}
```

**특징**:
- `Content-Type: text/event-stream`
- 클라이언트가 연결을 유지하는 동안 새 알림 발생 시 즉시 전송
- EventSource API 사용 (프론트엔드)

**이벤트 데이터 형식**:
```
event: notification
data: {"id":3,"sourceId":789,"postId":50,"type":"COMMENT","message":"새로운 댓글이 달렸습니다.","receiverLoginId":"user123","isRead":false,"createdAt":"2025-12-11T11:00:00"}

event: notification
data: {"id":4,"sourceId":101,"postId":50,"type":"LIKE","message":"게시글에 좋아요가 추가되었습니다.","receiverLoginId":"user123","isRead":false,"createdAt":"2025-12-11T11:05:00"}
```

**백엔드 구현 참고 (Spring Boot)**:
```java
@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter streamNotifications(@RequestParam String token) {
    // 토큰으로 사용자 인증
    String loginId = jwtService.validateToken(token);

    SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

    // Emitter 저장 (사용자별로 관리)
    sseEmitterService.addEmitter(loginId, emitter);

    // 연결 종료 시 처리
    emitter.onCompletion(() -> sseEmitterService.removeEmitter(loginId, emitter));
    emitter.onTimeout(() -> sseEmitterService.removeEmitter(loginId, emitter));

    return emitter;
}
```

**이벤트 발행 로직**:
```java
@TransactionalEventListener
public void handleNotificationSavedEvent(NotificationSavedEvent event) {
    Notification notification = event.getNotification();
    String receiverLoginId = notification.getReceiverLoginId();

    // 해당 사용자의 모든 SSE 연결에 알림 전송
    List<SseEmitter> emitters = sseEmitterService.getEmitters(receiverLoginId);

    for (SseEmitter emitter : emitters) {
        try {
            emitter.send(SseEmitter.event()
                .name("notification")
                .data(notification));
        } catch (IOException e) {
            sseEmitterService.removeEmitter(receiverLoginId, emitter);
        }
    }
}
```

---

### 3. 알림 읽음 처리
**목적**: 특정 알림을 읽음으로 표시합니다.

```http
PATCH /api/notifications/{notificationId}/read
Authorization: Bearer {accessToken}
```

**응답 예시**:
```json
{
  "status": "OK",
  "message": "알림 읽음 처리 성공",
  "data": {
    "id": 1,
    "sourceId": 123,
    "postId": 45,
    "type": "COMMENT",
    "message": "새로운 댓글이 달렸습니다.",
    "receiverLoginId": "user123",
    "isRead": true,
    "createdAt": "2025-12-11T10:30:00",
    "updatedAt": "2025-12-11T11:10:00"
  }
}
```

---

### 4. 모든 알림 읽음 처리
**목적**: 사용자의 모든 읽지 않은 알림을 한 번에 읽음으로 표시합니다.

```http
PATCH /api/notifications/read-all
Authorization: Bearer {accessToken}
```

**응답 예시**:
```json
{
  "status": "OK",
  "message": "모든 알림 읽음 처리 성공",
  "data": {
    "updatedCount": 5
  }
}
```

---

## 📋 데이터 모델

### Notification 엔티티
```java
@Entity
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sourceId;        // 댓글 ID 또는 좋아요 ID
    private Long postId;          // 게시글 ID

    @Enumerated(EnumType.STRING)
    private NotificationType type; // COMMENT, LIKE

    private String message;        // 알림 메시지
    private String receiverLoginId; // 알림 받는 사용자
    private boolean isRead;        // 읽음 여부

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### NotificationType Enum
```java
public enum NotificationType {
    COMMENT,  // 댓글 알림
    LIKE      // 좋아요 알림
}
```

---

## 🔄 전체 알림 흐름

### 댓글 작성 시
1. 사용자가 댓글 작성
2. `CommentController.registerBoastCatPostComment()` 호출
3. 댓글 저장 후 `CommentEvent` 발행
4. `NotificationSender.publish(CommentEvent)` → Kafka 메시지 발행
5. `NotificationConsumer.listenComment()` → Kafka 메시지 수신
6. `NotificationService.saveNotification()` → DB 저장
7. `NotificationSavedEvent` 발행
8. **SSE Listener** → 실시간으로 프론트엔드에 전송
9. 프론트엔드 `EventSource` 수신 → UI 업데이트

### 좋아요 추가 시
1. 사용자가 좋아요 클릭
2. `PostLikeController.plusLike()` 호출
3. 좋아요 저장 후 `LikeEvent` 발행
4. `NotificationSender.publish(LikeEvent)` → Kafka 메시지 발행
5. `NotificationConsumer.listenLike()` → Kafka 메시지 수신
6. `NotificationService.saveNotification()` → DB 저장
7. `NotificationSavedEvent` 발행
8. **SSE Listener** → 실시간으로 프론트엔드에 전송
9. 프론트엔드 `EventSource` 수신 → UI 업데이트

---

## 🛠️ 백엔드 구현 체크리스트

- [ ] `GET /api/notifications` - 알림 목록 조회 API
- [ ] `GET /api/notifications/stream` - SSE 스트림 엔드포인트
- [ ] `PATCH /api/notifications/{id}/read` - 개별 알림 읽음 처리
- [ ] `PATCH /api/notifications/read-all` - 전체 알림 읽음 처리
- [ ] `NotificationSavedEvent` 리스너에서 SSE 전송 로직
- [ ] SseEmitter 관리 서비스 (사용자별 Emitter 저장/삭제)
- [ ] JWT 토큰 쿼리 파라미터 인증 (SSE는 헤더 설정 불가)

---

## 🔐 보안 고려사항

1. **SSE 인증**:
   - EventSource API는 커스텀 헤더를 지원하지 않음
   - 쿼리 파라미터로 토큰 전달: `/api/notifications/stream?token={accessToken}`
   - 백엔드에서 토큰 검증 후 사용자 식별

2. **CORS 설정**:
   ```java
   @CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
   ```

3. **권한 검증**:
   - 알림 조회 시 본인의 알림만 조회 가능하도록 필터링
   - 알림 읽음 처리 시 본인의 알림만 수정 가능하도록 검증

---

## 📱 프론트엔드 사용 방법

### 컴포넌트 임포트
```jsx
import NotificationDropdown from "@/app/components/NotificationDropdown";
```

### Header에 추가
```jsx
{isLoggedIn && <NotificationDropdown userId={userId} />}
```

**자동으로 처리되는 기능**:
- ✅ SSE 연결 및 실시간 알림 수신
- ✅ 읽지 않은 알림 개수 뱃지 표시
- ✅ 알림 클릭 시 게시글로 이동
- ✅ 알림 읽음 처리
- ✅ 모든 알림 읽음 처리

---

## 🧪 테스트 시나리오

1. **알림 목록 조회**:
   - Postman으로 `GET /api/notifications` 호출
   - Authorization 헤더에 JWT 토큰 포함
   - 응답 데이터 확인

2. **SSE 연결**:
   - 브라우저에서 로그인 후 개발자 도구 > Network 탭
   - `stream` 요청의 EventStream 타입 확인
   - 다른 사용자가 댓글/좋아요 추가 시 실시간 수신 확인

3. **읽음 처리**:
   - 알림 클릭 → `PATCH /api/notifications/{id}/read` 호출 확인
   - 뱃지 숫자 감소 확인
   - 알림 배경색 변경 확인

---

## 📚 참고 자료

- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Spring SseEmitter 공식 문서](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/SseEmitter.html)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
