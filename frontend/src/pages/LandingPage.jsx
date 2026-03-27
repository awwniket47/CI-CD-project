import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  useEffect(() => {
    // Load the standalone landing page as an iframe or redirect
  }, [])

  // Simplest: just redirect to the static file
  window.location.href = '/landing.html'
  return null
}