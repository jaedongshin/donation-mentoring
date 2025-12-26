// ============================================================
// CodingBuddy Configuration
// React Project Configuration File
//
// This file is used by AI coding assistants to understand project context.
// Modify the values to match your project.
// ============================================================

module.exports = {
  // 🌍 Language Setting
  // Specify the language for AI responses. ('ko', 'en', 'ja', etc.)
  language: 'ko',

  // 📦 Project Information
  projectName: 'donation-mentoring',

  // 🛠️ Tech Stack
  techStack: {
    languages: ['TypeScript'],
    frontend: ['Next.js 16', 'React 19', 'Tailwind CSS 4'],
    backend: ['Supabase'],
    libraries: ['Lucide React'],
  },

  // 🏗️ Architecture
  architecture: {
    pattern: 'next-app-router',
    componentStyle: 'colocated',
    i18n: 'client-side', // EN/KO bilingual support via utils/i18n.ts
  },

  // 📝 Coding Conventions
  conventions: {
    naming: {
      components: 'PascalCase',      // MentorCard.tsx
      utils: 'lowercase',            // supabase.ts, i18n.ts
      functions: 'camelCase',
      bilingualFields: '_en/_ko',    // name_en, name_ko pattern
    },
  },

  // 🧪 Test Strategy
  testStrategy: {
    configured: false, // No test framework currently set up
  },

  // 📊 Project-Specific Context
  projectContext: {
    description: 'Bilingual (EN/KO) mentoring platform connecting mentors and mentees',
    pages: ['/', '/admin'],
    dataModel: 'Mentor with bilingual fields (_en/_ko suffixes)',
    storage: 'Supabase table: mentors, bucket: mentor-pictures',
  },
};

// ============================================================
  // 💡 TIP: Sync with MCP
  //
  // codingbuddy MCP analyzes your project and suggests config updates.
  // ============================================================