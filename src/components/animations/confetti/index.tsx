"use client"

import { useEffect, useState } from "react"

interface ConfettiProps {
  duration?: number
  pieces?: number
  colors?: string[]
  autoStart?: boolean
}

export default function Confetti({
  duration = 6000,
  pieces = 200,
  colors = [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#FFEB3B",
    "#FFC107",
    "#FF9800",
    "#FF5722",
  ],
  autoStart = true,
}: ConfettiProps) {
  const [isActive, setIsActive] = useState(autoStart)

  useEffect(() => {
    if (!isActive) return

    // Create canvas element
    const canvas = document.createElement("canvas")
    canvas.style.position = "fixed"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.style.pointerEvents = "none"
    canvas.style.zIndex = "9999"
    document.body.appendChild(canvas)

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasSize()
    window.addEventListener("resize", setCanvasSize)

    // Create confetti pieces
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const confettiPieces = Array.from({ length: pieces }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      size: 5 + Math.random() * 15,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 5,
      speedX: (Math.random() - 0.5) * 8,
      speedY: 1 + Math.random() * 5,
      gravity: 0.1 + Math.random() * 0.1,
      opacity: 1,
    }))

    // Animation
    let animationFrame: number
    const startTime = Date.now()

    const animate = () => {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      confettiPieces.forEach((piece) => {
        // Update position
        piece.x += piece.speedX
        piece.y += piece.speedY
        piece.speedY += piece.gravity
        piece.rotation += piece.rotationSpeed

        // Fade out as animation progresses
        if (progress > 0.7) {
          piece.opacity = (1 - progress) / 0.3
        }

        // Draw confetti
        ctx.save()
        ctx.translate(piece.x, piece.y)
        ctx.rotate((piece.rotation * Math.PI) / 180)
        ctx.globalAlpha = piece.opacity
        ctx.fillStyle = piece.color
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size / 3)
        ctx.restore()
      })

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        // Clean up
        document.body.removeChild(canvas)
        window.removeEventListener("resize", setCanvasSize)
        setIsActive(false)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrame)
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas)
      }
      window.removeEventListener("resize", setCanvasSize)
    }
  }, [colors, duration, pieces, isActive])

  return null
}

