export function getApiErrorMessage(error, fallbackMessage = 'Something went wrong.') {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  )
}
