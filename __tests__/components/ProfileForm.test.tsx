import { render, screen, fireEvent } from '@testing-library/react';
import ProfileForm, { ProfileFormData } from '@/app/components/ProfileForm';

// Mock translations
jest.mock('@/utils/i18n', () => ({
  translations: {
    en: {
      name: 'Name',
      company: 'Company',
      position: 'Position',
      description: 'Description',
      location: 'Location',
      calendarUrl: 'Calendar URL',
      languages: 'Languages',
      sessionTime: 'Session Time',
      sessionPrice: 'Session Price',
      tags: 'Tags',
      photo: 'Photo',
      upload: 'Upload',
      uploading: 'Uploading...',
      save: 'Save',
    },
    ko: {
      name: '이름',
      company: '회사',
      position: '직책',
      description: '설명',
      location: '위치',
      calendarUrl: '캘린더 URL',
      languages: '언어',
      sessionTime: '세션 시간',
      sessionPrice: '세션 가격',
      tags: '태그',
      photo: '사진',
      upload: '업로드',
      uploading: '업로드 중...',
      save: '저장',
    },
  },
}));

describe('ProfileForm', () => {
  const defaultFormData: ProfileFormData = {
    name_en: '',
    name_ko: '',
    description_en: '',
    description_ko: '',
    position_en: '',
    position_ko: '',
    company_en: '',
    company_ko: '',
    location_en: '',
    location_ko: '',
    linkedin_url: '',
    calendly_url: '',
    email: '',
    languages: [],
    session_time_minutes: null,
    session_price_usd: null,
    tags: [],
    picture_url: '',
  };

  let mockOnChange: jest.Mock;
  let mockOnSubmit: jest.Mock;

  beforeEach(() => {
    mockOnChange = jest.fn();
    mockOnSubmit = jest.fn((e) => e.preventDefault());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('tag parsing', () => {
    it('should parse comma-separated tags', () => {
      render(
        <ProfileForm
          formData={defaultFormData}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          darkMode={false}
          lang="en"
        />
      );

      const tagsInput = screen.getByPlaceholderText(/Frontend, UX, AI/i);
      fireEvent.change(tagsInput, { target: { value: 'React, Node.js, TypeScript' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultFormData,
        tags: ['React', 'Node.js', 'TypeScript'],
      });
    });

    it('should trim whitespace from tags', () => {
      render(
        <ProfileForm
          formData={defaultFormData}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          darkMode={false}
          lang="en"
        />
      );

      const tagsInput = screen.getByPlaceholderText(/Frontend, UX, AI/i);
      fireEvent.change(tagsInput, { target: { value: ' React ,  Node.js  , TypeScript ' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultFormData,
        tags: ['React', 'Node.js', 'TypeScript'],
      });
    });

    it('should filter out empty tags', () => {
      render(
        <ProfileForm
          formData={defaultFormData}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          darkMode={false}
          lang="en"
        />
      );

      const tagsInput = screen.getByPlaceholderText(/Frontend, UX, AI/i);
      fireEvent.change(tagsInput, { target: { value: 'React, , Node.js,  , TypeScript' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultFormData,
        tags: ['React', 'Node.js', 'TypeScript'],
      });
    });
  });

  describe('language toggling', () => {
    it('should add language when checkbox is checked', () => {
      render(
        <ProfileForm
          formData={defaultFormData}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          darkMode={false}
          lang="en"
        />
      );

      const koreanCheckbox = screen.getByLabelText(/korean/i);
      fireEvent.click(koreanCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultFormData,
        languages: ['Korean'],
      });
    });

    it('should remove language when checkbox is unchecked', () => {
      const formDataWithLanguages: ProfileFormData = {
        ...defaultFormData,
        languages: ['Korean', 'English'],
      };

      render(
        <ProfileForm
          formData={formDataWithLanguages}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          darkMode={false}
          lang="en"
        />
      );

      const koreanCheckbox = screen.getByLabelText(/korean/i);
      fireEvent.click(koreanCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...formDataWithLanguages,
        languages: ['English'],
      });
    });

    it('should handle multiple language selections', () => {
      const { rerender } = render(
        <ProfileForm
          formData={defaultFormData}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          darkMode={false}
          lang="en"
        />
      );

      const koreanCheckbox = screen.getByLabelText(/korean/i);

      // Click Korean first
      fireEvent.click(koreanCheckbox);
      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultFormData,
        languages: ['Korean'],
      });

      // Update formData to include Korean
      const formDataWithKorean: ProfileFormData = {
        ...defaultFormData,
        languages: ['Korean'],
      };

      // Rerender with updated formData
      rerender(
        <ProfileForm
          formData={formDataWithKorean}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          darkMode={false}
          lang="en"
        />
      );

      // Click English - should add to existing Korean
      const englishCheckboxUpdated = screen.getByLabelText(/english/i);
      fireEvent.click(englishCheckboxUpdated);

      expect(mockOnChange).toHaveBeenLastCalledWith({
        ...formDataWithKorean,
        languages: ['Korean', 'English'],
      });
    });
  });

  describe('form submission', () => {
    it('should call onSubmit when form is submitted', () => {
      render(
        <ProfileForm
          formData={defaultFormData}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          darkMode={false}
          lang="en"
          showSubmitButton={true}
        />
      );

      const submitButton = screen.getByText(/save/i);
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });
});

