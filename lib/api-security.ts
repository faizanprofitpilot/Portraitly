import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, addSecurityHeaders, sanitizeError } from '../middleware/security'

export interface SecureAPIOptions {
  requireAuth?: boolean
  rateLimitPerMinute?: number
  allowedMethods?: string[]
}

export async function secureAPI(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: SecureAPIOptions = {}
) {
  const {
    requireAuth = true,
    rateLimitPerMinute = 60,
    allowedMethods = ['GET', 'POST']
  } = options

  // Method validation
  if (!allowedMethods.includes(request.method)) {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }

  // Rate limiting
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimitResult = rateLimit(clientIP, rateLimitPerMinute, 60 * 1000)
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  // Authentication check
  if (requireAuth) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  try {
    const response = await handler(request)
    return addSecurityHeaders(response)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 500 }
    )
  }
}

export function validateInput(data: any, schema: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key]
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`)
      continue
    }
    
    if (value !== undefined && value !== null) {
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${key} must be a string`)
      } else if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`${key} must be a number`)
      } else if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${key} must be a valid email`)
      } else if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${key} must be no more than ${rules.maxLength} characters`)
      } else if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} must be at least ${rules.minLength} characters`)
      }
    }
  }
  
  return { valid: errors.length === 0, errors }
}

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}
