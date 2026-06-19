interface CefQueryRequest {
  request: string
  onSuccess: (response: string) => void
  onFailure: (errorCode: number, errorMessage: string) => void
}

interface Window {
  cefQuery: (request: CefQueryRequest) => void
  cefQueryCancel?: (requestId: number) => void
}
