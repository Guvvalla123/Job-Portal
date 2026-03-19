# Postman Collection

## Import

1. Open Postman
2. Import `Job-Portal-API.postman_collection.json`
3. Import `Job-Portal-Local.postman_environment.json` (optional)
4. Select the "Job Portal - Local" environment

## Usage

1. **Register** or **Login** – Tokens are auto-saved to collection variables
2. Use **Get Me** to verify auth
3. Replace `:id`, `:jobId`, `:token` placeholders in URL with real IDs
4. For **Apply to Job**, add `Idempotency-Key: <uuid>` header (or use `{{$guid}}`)

## Base URL

Default: `http://localhost:5000/api`

Change in environment variables for staging/production.
