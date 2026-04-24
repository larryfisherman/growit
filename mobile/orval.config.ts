import { defineConfig } from 'orval';

export default defineConfig({
  growit: {
    input: 'http://localhost:5050/openapi/v1.json',
    output: {
      mode: 'tags-split',
      target: 'src/api/generated',
      schemas: 'src/api/generated/schemas',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        mutator: {
          path: 'src/api/axios.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
