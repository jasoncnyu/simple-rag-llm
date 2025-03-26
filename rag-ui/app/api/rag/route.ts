import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

export async function POST(req: NextRequest) {
  const { question, chunkSize, chunkOverlap } = await req.json()

  return new Promise((resolve, reject) => {
    const py = spawn('python3', [
      'rag_query.py',
      question,
      String(chunkSize),
      String(chunkOverlap),
    ])

    let output = ''
    let error = ''

    py.stdout.on('data', (data) => {
      output += data.toString()
    })

    py.stderr.on('data', (data) => {
      error += data.toString()
    })

    py.on('close', (code) => {
      if (error || code !== 0) {
        console.error('Python error:', error)
        return resolve(
          NextResponse.json({ error: 'Python execution failed', detail: error }, { status: 500 })
        )
      }

      try {
        const result = JSON.parse(output)
        return resolve(NextResponse.json(result))
      } catch (err) {
        return resolve(
          NextResponse.json({ error: 'Failed to parse Python output' }, { status: 500 })
        )
      }
    })
  })
}