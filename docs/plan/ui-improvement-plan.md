# UI 개선 계획서

## 현재 상태 분석

### 문제점 요약

| 영역 | 현재 상태 | 문제점 |
|------|----------|--------|
| Typography | Arial, Helvetica, sans-serif | 제네릭하고 개성 없음 |
| Color | blue-600, gray-50/100/500 | 표준 Tailwind 색상, 차별화 없음 |
| Motion | hover:shadow 정도 | 애니메이션 거의 없음 |
| Layout | 표준 그리드 | 예측 가능하고 평범함 |
| Background | 단색 (gray-50, white) | 깊이감과 텍스처 없음 |
| Identity | 없음 | 기억에 남지 않는 템플릿 느낌 |

---

## 디자인 방향성

### 컨셉: "Warm & Human"
멘토링 플랫폼의 본질인 **인간적인 연결**과 **따뜻함**을 시각적으로 표현

- **Warm Gradient**: 따뜻한 색상의 그라디언트로 환영하는 느낌
- **Organic Shapes**: 딱딱한 직선보다 부드러운 곡선
- **Subtle Depth**: 레이어와 그림자로 깊이감 표현
- **Meaningful Motion**: 목적 있는 애니메이션으로 생동감

---

## 개선 항목 상세

### 1. Typography 개선

**현재**: `font-family: Arial, Helvetica, sans-serif`

**개선안**:
- Display Font: **Playfair Display** 또는 **DM Serif Display** (헤딩용)
- Body Font: **Pretendard** (한글) + **Inter** 또는 **Source Sans 3** (영문)
- 한글/영문 이중 언어 지원을 위한 폰트 스택

```css
/* 제안 폰트 스택 */
--font-display: 'DM Serif Display', 'Noto Serif KR', serif;
--font-body: 'Pretendard', 'Source Sans 3', sans-serif;
```

**적용 위치**:
- `globals.css`: 폰트 임포트 및 변수 정의
- `layout.tsx`: next/font 설정
- 헤딩 요소들에 display 폰트 적용

---

### 2. Color System 개선

**현재**: Tailwind 기본 blue-600 중심

**개선안**: 따뜻하고 인간적인 팔레트

```css
:root {
  /* Primary - Warm Coral/Terracotta */
  --color-primary-50: #fef7f5;
  --color-primary-100: #fde8e2;
  --color-primary-500: #e07a5f;
  --color-primary-600: #c9634a;
  --color-primary-700: #a84d38;

  /* Secondary - Sage Green (신뢰/성장) */
  --color-secondary-50: #f4f7f4;
  --color-secondary-500: #81a88d;
  --color-secondary-600: #6b9377;

  /* Accent - Warm Gold */
  --color-accent: #d4a574;

  /* Neutrals - Warm Gray */
  --color-neutral-50: #fafaf9;
  --color-neutral-100: #f5f4f2;
  --color-neutral-800: #292524;
  --color-neutral-900: #1c1917;
}
```

---

### 3. Hero Section 리디자인

**현재**: 단순 blue-600 배경에 검색창

**개선안**:
- 드라마틱한 메시 그라디언트 배경
- 더 큰 타이포그래피 (display 폰트 활용)
- 장식적 요소 (추상적인 원형/곡선)
- 미묘한 애니메이션 (floating shapes)

```jsx
// Hero 배경 스타일 예시
<div className="relative overflow-hidden">
  {/* Gradient Mesh Background */}
  <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-white to-secondary-50" />

  {/* Decorative Blobs */}
  <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl" />
  <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary-200/30 rounded-full blur-3xl" />

  {/* Content */}
</div>
```

---

### 4. MentorCard 컴포넌트 개선

**현재**: 표준 카드 + hover:shadow

**개선안**:
- 이미지에 그라디언트 오버레이 (하단)
- 호버 시 scale + shadow 조합
- 태그에 컬러 강조
- 미묘한 border gradient

```jsx
// 개선된 카드 스타일
<div className="group relative bg-white rounded-2xl overflow-hidden
  shadow-md hover:shadow-2xl
  transform transition-all duration-300
  hover:-translate-y-1 hover:scale-[1.02]
  border border-neutral-100 hover:border-primary-200">

  {/* 이미지 영역 */}
  <div className="relative h-64 overflow-hidden">
    <Image className="transition-transform duration-500 group-hover:scale-110" />
    {/* 하단 그라디언트 오버레이 */}
    <div className="absolute inset-x-0 bottom-0 h-20
      bg-gradient-to-t from-black/50 to-transparent" />
  </div>
</div>
```

---

### 5. Animation & Motion 추가

**현재**: 거의 없음

**개선안**:

#### 5.1 페이지 로드 애니메이션
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}
```

#### 5.2 Staggered Card Reveals
```jsx
{mentors.map((mentor, index) => (
  <MentorCard
    style={{ animationDelay: `${index * 100}ms` }}
    className="animate-fade-in-up opacity-0"
  />
))}
```

#### 5.3 Scroll-triggered Animations
- Intersection Observer 활용
- 섹션 진입 시 fade-in 효과

#### 5.4 마이크로 인터랙션
- 버튼 hover: scale + 색상 변화
- 검색창 focus: 테두리 glow
- 언어 토글: smooth transition

---

### 6. Background & Texture 개선

**현재**: 플랫한 gray-50, white

**개선안**:

#### 6.1 Subtle Noise Texture
```css
.bg-texture {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03;
}
```

#### 6.2 Section Gradients
- About 섹션: warm-to-cool gradient
- Values 섹션: subtle radial gradient
- How-to 섹션: 장식적 패턴

#### 6.3 Decorative Elements
- Floating circles/blobs
- Subtle grid patterns
- Section dividers with curves

---

### 7. Modal 개선

**현재**: 즉시 나타남, 기본 스타일

**개선안**:
- 백드롭 fade-in
- 모달 scale + fade 애니메이션
- 더 둥근 코너 (rounded-3xl)
- 이미지 영역 개선 (오버레이, 크기 조정)

```jsx
// 모달 애니메이션
<div className="animate-in fade-in duration-200">
  <div className="animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
    {/* 모달 콘텐츠 */}
  </div>
</div>
```

---

### 8. Admin 페이지 UI 일관성

**현재**: 홈페이지와 다른 스타일

**개선안**:
- 동일한 컬러 시스템 적용
- 폰트 일관성
- 테이블/리스트 스타일 개선
- 폼 디자인 개선

---

## 구현 우선순위

| 순서 | 항목 | 난이도 | 임팩트 |
|------|------|--------|--------|
| 1 | Color System | 낮음 | 높음 |
| 2 | Typography | 중간 | 높음 |
| 3 | Hero Section | 중간 | 높음 |
| 4 | MentorCard | 중간 | 높음 |
| 5 | Animation | 중간 | 중간 |
| 6 | Background | 낮음 | 중간 |
| 7 | Modal | 낮음 | 중간 |
| 8 | Admin 일관성 | 낮음 | 낮음 |

---

## 파일 변경 예상

```
app/
├── globals.css          # 컬러 변수, 폰트, 애니메이션 키프레임
├── layout.tsx           # 폰트 설정
├── page.tsx             # Hero, 섹션 스타일 개선
├── admin/page.tsx       # 일관된 스타일 적용
└── components/
    └── MentorCard.tsx   # 카드 디자인 개선
```

---

## 참고 자료

### 영감받을 디자인
- 따뜻한 색상: Calm, Headspace
- 멘토링/교육: MasterClass, Coursera
- 비영리/기부: charity:water, UNICEF

### 기술 참고
- Tailwind CSS 커스텀 색상
- next/font (Google Fonts)
- CSS @keyframes 애니메이션
- Intersection Observer API
