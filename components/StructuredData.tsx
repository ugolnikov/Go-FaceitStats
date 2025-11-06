import { useEffect } from 'react'

interface StructuredDataProps {
  data: object
}

export default function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(data)
    script.id = 'structured-data'
    
    // Удаляем старый скрипт если есть
    const oldScript = document.getElementById('structured-data')
    if (oldScript) {
      oldScript.remove()
    }
    
    document.head.appendChild(script)
    
    return () => {
      const scriptToRemove = document.getElementById('structured-data')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [data])

  return null
}

