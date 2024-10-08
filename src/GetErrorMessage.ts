export default function GetErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  } 
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  } 

  if (typeof error === 'string') {
    return error
  }

  return 'Unknown Error'
}