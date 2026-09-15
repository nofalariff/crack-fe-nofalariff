import "@testing-library/jest-dom/vitest"

// Nilai env untuk lingkungan pengujian — src/env.ts memvalidasinya saat diimpor.
process.env.API_URL ??= "http://localhost:3001/api/v1"
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000"
process.env.NEXT_PUBLIC_APP_NAME ??= "LogiSend"
process.env.NEXT_PUBLIC_API_MOCKING ??= "enabled"
